-- 1. Indexation pour optimiser les performances de lecture
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_type ON public.orders (status, type);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders (client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at_desc ON public.inventory_movements (created_at DESC);

-- GIN trigram indexes pour la recherche textuelle rapide
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_sku_trgm ON public.products USING gin (sku gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_client_nom_trgm ON public.client USING gin (nom gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_client_num_tel ON public.client (num_tel);

-- Index composite et partiels supplémentaires
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON public.products (stock, min_stock) WHERE stock <= min_stock;

-- 2. Helper is_admin() marqué STABLE pour être mis en cache dans chaque transaction
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.customers 
    WHERE id = auth.uid() AND type = 'admin'
  );
$$;

-- 3. Mise à jour des politiques RLS de public.orders pour utiliser is_admin() et éviter le N+1
DROP POLICY IF EXISTS "owner_read_orders" ON public.orders;
CREATE POLICY "owner_read_orders" ON public.orders FOR SELECT TO authenticated 
USING (
  auth.uid() = customer_id OR public.is_admin()
);

DROP POLICY IF EXISTS "auth_update_orders" ON public.orders;
CREATE POLICY "auth_update_orders" ON public.orders FOR UPDATE TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- RLS de order_items
DROP POLICY IF EXISTS "auth_update_order_items" ON public.order_items;
CREATE POLICY "auth_update_order_items" ON public.order_items FOR UPDATE TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- 4. RPC get_inventory_stats() pour agréger les stats d'inventaire côté serveur
CREATE OR REPLACE FUNCTION public.get_inventory_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'totalValue',   COALESCE(SUM(base_price * stock), 0),
    'references',   COUNT(*),
    'lowStock',     COUNT(*) FILTER (WHERE stock <= min_stock AND stock > 0),
    'outOfStock',   COUNT(*) FILTER (WHERE stock = 0)
  )
  FROM public.products;
$$;

-- 5. RPC reduce_stock_for_order() réécrite en batch
CREATE OR REPLACE FUNCTION public.reduce_stock_for_order(
  p_order_id uuid,
  p_reason_prefix text
)
RETURNS void AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized to perform stock adjustments.';
  END IF;

  -- Update en batch (1 seule requête SQL)
  UPDATE public.products p
  SET stock = GREATEST(0, p.stock - oi.quantity)
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id
    AND oi.product_id = p.id
    AND oi.product_id IS NOT NULL;

  -- Insert en batch (1 seule requête SQL)
  INSERT INTO public.inventory_movements (product_id, movement_type, quantity, reason)
  SELECT 
    oi.product_id, 
    'sale', 
    -oi.quantity, 
    p_reason_prefix || ' #' || upper(substring(p_order_id::text, 1, 8))
  FROM public.order_items oi
  WHERE oi.order_id = p_order_id AND oi.product_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
