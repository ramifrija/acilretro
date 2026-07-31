-- 1. Créer une fonction sécurisée pour vérifier si l'utilisateur connecté est un admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM customers
    WHERE id = auth.uid() AND type = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ajouter les permissions de LECTURE pour les administrateurs
DROP POLICY IF EXISTS "admin_read_customers" ON customers;
CREATE POLICY "admin_read_customers" ON customers 
FOR SELECT TO authenticated 
USING (public.is_admin());

-- 3. Ajouter les permissions de MODIFICATION pour les administrateurs
DROP POLICY IF EXISTS "admin_update_customers" ON customers;
CREATE POLICY "admin_update_customers" ON customers 
FOR UPDATE TO authenticated 
USING (public.is_admin());

-- 4. Ajouter les permissions de SUPPRESSION pour les administrateurs
DROP POLICY IF EXISTS "admin_delete_customers" ON customers;
CREATE POLICY "admin_delete_customers" ON customers 
FOR DELETE TO authenticated 
USING (public.is_admin());
