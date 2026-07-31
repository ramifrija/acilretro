# Rapport d'Audit Technique : Projet ACIL RETRO (E-commerce / ERP)

**Par :** Lead Software Engineer & Architecte Cloud (10+ ans d'expérience)  
**Cible :** Architecture Web, Performances, Sécurité de la Base de Données, et Bonnes Pratiques de Code.  
**Date :** 31 Juillet 2026  

---

## 🟢 Ce qui est très bien fait

1. **Design System & Esthétique Premium (Front-end)**
   * **Intégration Tailwind soignée** : L'intégration d'un style basé sur le verre (glassmorphism via la classe `.glass-card` et `.glass`) et des gradients dynamiques donne une impression visuelle haut de gamme et cohérente sur l'ensemble de la plateforme.
   * **Typographie moderne** : L'utilisation des polices *Plus Jakarta Sans* et *Sora* est très bien implémentée dans [src/index.css](file:///c:/Users/Admin/Desktop/Acil-Retro-main/Acil-Retro-main/src/index.css) et configurée proprement dans Tailwind.

2. **Routeur sur-mesure léger (Hash-based Routing)**
   * Le choix d'implémenter un routeur personnalisé basé sur les Hash-links dans [src/context/RouterContext.tsx](file:///c:/Users/Admin/Desktop/Acil-Retro-main/Acil-Retro-main/src/context/RouterContext.tsx) est **idéal pour un hébergement statique comme Netlify**. Cela évite les redirections serveur (SPA Redirects / 404 Fallbacks) et permet de déployer l'application sans configuration DevOps complexe.

3. **Protection contre la récursion RLS**
   * L'écriture de la fonction PostgreSQL `public.is_admin()` avec l'option `SECURITY DEFINER` (dans [supabase/migrations/20260731012500_fix_customers_rls.sql](file:///c:/Users/Admin/Desktop/Acil-Retro-main/Acil-Retro-main/supabase/migrations/20260731012500_fix_customers_rls.sql)) est une **excellente pratique**. En s'exécutant avec les droits de `postgres`, elle permet de contourner les politiques RLS de la table `customers` et prévient les boucles de récursivité infinies (policy recursion loops), qui sont le piège classique des débutants avec Supabase.

4. **Structure du Context API**
   * La séparation des contextes applicatifs (`AuthContext`, `CartContext`, `ThemeContext`, `RouterContext`) respecte les standards de la structure globale de données dans React.

---

## 🟡 Ce qui doit être modifié ou refactorisé

1. **Requêtes Client-side trop lourdes (Anti-pattern de sur-téléchargement)**
   * Dans [src/pages/admin/AdminDashboard.tsx](file:///c:/Users/Admin/Desktop/Acil-Retro-main/Acil-Retro-main/src/pages/admin/AdminDashboard.tsx#L30-L36), l'application télécharge **l'intégralité** des tables `orders` et `products` en mémoire client pour exécuter de simples calculs de somme :
     ```typescript
     const confirmedOrders = (orders || []).filter((o) => o.status === 'paid');
     const revenue = confirmedOrders.reduce((s, o) => s + Number(o.total), 0);
     const invValue = (products || []).reduce((s, p) => s + Number(p.base_price) * p.stock, 0);
     ```
     *Impact* : Dès que vous aurez 5 000 commandes et 2 000 produits, cette page prendra plusieurs secondes à charger, consommera énormément de bande passante et finira par faire crasher les navigateurs mobiles des administrateurs.
     *Solution* : Utiliser des agrégations SQL de PostgreSQL en créant des vues (SQL Views) ou via des RPC Supabase (ex: `select(total.sum())`).

2. **Recherche et Pagination traitées côté Client**
   * Dans [src/pages/admin/AdminInventory.tsx](file:///c:/Users/Admin/Desktop/Acil-Retro-main/Acil-Retro-main/src/pages/admin/AdminInventory.tsx#L24-L31) et [src/pages/CatalogPage.tsx](file:///c:/Users/Admin/Desktop/Acil-Retro-main/Acil-Retro-main/src/pages/CatalogPage.tsx#L58-L65), vous récupérez l'ensemble des produits et jusqu'à 1 000 mouvements d'inventaire, pour ensuite filtrer et paginer en JavaScript avec `.filter()` et `.slice()`.
   * *Solution* : Toujours déléguer le tri, le filtrage de recherche et la pagination à Supabase en utilisant les filtres natifs `.ilike('name', ...)` et la méthode de pagination serveur `.range(from, to)`.

3. **Absence de Transactions SQL pour les écritures en masse**
   * Dans [src/pages/admin/AdminOrders.tsx](file:///c:/Users/Admin/Desktop/Acil-Retro-main/Acil-Retro-main/src/pages/admin/AdminOrders.tsx#L50-L63), la validation d'une commande met à jour les stocks de chaque produit séquentiellement à l'intérieur d'une boucle :
     ```typescript
     for (const item of order.order_items) {
       // Await unitaire sur les produits...
       await supabase.from('products').update({ stock: newStock }).eq('id', item.product_id);
     }
     ```
     *Impact* : Si l'un des produits échoue lors de la mise à jour (connexion interrompue, produit supprimé), la base de données se retrouve dans un état corrompu ("partial write").
     *Solution* : Encapsuler ces opérations dans une fonction PostgreSQL en base de données pour qu'elles s'exécutent au sein d'une seule **transaction atomique**.

4. **Concurrence et Race Conditions sur la mise à jour des stocks**
   * Toujours dans la mise à jour des stocks, l'application lit la valeur actuelle du stock sur le client, calcule la différence en JS (`product.stock - item.quantity`), puis réécrit le résultat. Si deux clients valident un achat simultanément pour le même produit, le stock calculé par l'un écrasera celui calculé par l'autre.
   * *Solution* : Exécuter une requête SQL atomique : `UPDATE products SET stock = stock - X WHERE id = Y`.

---

## 🔴 Ce qui doit être SUPPRIMÉ ou complètement réécrit

1. **🚨 Faille de Sécurité Critique : Escalade de Privilèges Admin**
   * Dans la migration [supabase/migrations/20260729014500_create_user_trigger.sql](file:///c:/Users/Admin/Desktop/Acil-Retro-main/Acil-Retro-main/supabase/migrations/20260729014500_create_user_trigger.sql#L10), le trigger de création de profil client fait confiance aux métadonnées brutes de l'utilisateur :
     ```sql
     COALESCE(NEW.raw_user_meta_data->>'account_type', 'individual')
     ```
   * *Pourquoi c'est dangereux* : N'importe quel internaute peut ouvrir sa console de développement dans son navigateur et s'enregistrer via le client public Supabase en injectant `account_type: 'admin'` dans le paramètre d'options d'inscription. La base de données va immédiatement insérer ce compte en tant qu'administrateur dans la table `customers`, lui donnant un contrôle total sur l'ensemble de la boutique et de l'ERP.
   * *Solution* : **Supprimer cette ligne du trigger.** Le type de compte à l'inscription doit être forcé à `'individual'` ou `'company'`. Les droits d'administration ('admin') doivent être attribués uniquement par un autre administrateur ou manuellement dans la base de données.

2. **Script temporaire corrompu à la racine**
   * Le fichier [fix_customers_rls.sql](file:///c:/Users/Admin/Desktop/Acil-Retro-main/Acil-Retro-main/fix_customers_rls.sql) à la racine contient une erreur de syntaxe SQL (l'absence des délimiteurs de corps `$$` pour `is_admin()`), ce qui le rend impossible à exécuter tel quel.
   * *Solution* : Supprimer complètement ce fichier temporaire de l'arborescence du projet pour éviter toute confusion.

3. **Incohérence dans les requêtes de sécurité RLS**
   * La migration [supabase/migrations/20260729031800_fix_orders_rls.sql](file:///c:/Users/Admin/Desktop/Acil-Retro-main/Acil-Retro-main/supabase/migrations/20260729031800_fix_orders_rls.sql#L5) utilise des requêtes SQL directes `EXISTS (SELECT 1 FROM customers WHERE id = auth.uid() AND type = 'admin')` à l'intérieur des politiques RLS de la table `orders`.
   * *Solution* : Utiliser exclusivement la fonction centralisée `public.is_admin()` que vous avez créée plus tard pour assurer l'optimisation des requêtes et la lisibilité globale.

---

## 📋 Plan d'Action Priorisé (Top 5 étapes urgentes)

1. **Sécuriser la création de compte utilisateur (Urgence 1 - Sécurité)** :
   Modifier le fichier [supabase/migrations/20260729014500_create_user_trigger.sql](file:///c:/Users/Admin/Desktop/Acil-Retro-main/Acil-Retro-main/supabase/migrations/20260729014500_create_user_trigger.sql) pour s'assurer que le trigger n'accepte jamais le type de compte `'admin'` depuis `raw_user_meta_data`.

2. **Nettoyer les fichiers de développement obsolètes (Urgence 2 - Qualité)** :
   Supprimer le fichier temporaire [fix_customers_rls.sql](file:///c:/Users/Admin/Desktop/Acil-Retro-main/Acil-Retro-main/fix_customers_rls.sql) de la racine.

3. **Migrer la logique de gestion des stocks vers PostgreSQL (Urgence 3 - Fiabilité)** :
   Créer une fonction stockée PL/pgSQL sécurisée en base de données pour traiter la validation des commandes et décrémenter les stocks atomiquement, puis l'appeler via `supabase.rpc()` dans `AdminOrders.tsx` et `AdminPOS.tsx`.

4. **Implémenter la pagination et la recherche Server-side (Urgence 4 - Performance)** :
   Remplacer les filtres JS en mémoire par les filtres `.range()` et `.ilike()` de Supabase sur les pages d'inventaire, de catalogue produit et de liste des clients.

5. **Créer des requêtes d'agrégation SQL pour le Dashboard (Urgence 5 - Performance)** :
   Définir des fonctions ou des vues SQL sur PostgreSQL pour calculer les statistiques financières et d'inventaire sans que l'application front-end ait besoin de télécharger toutes les données brutes.
