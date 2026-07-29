-- Update orders policies to allow admins to read and update all orders
DROP POLICY IF EXISTS "owner_read_orders" ON orders;
CREATE POLICY "owner_read_orders" ON orders FOR SELECT TO authenticated USING (
  auth.uid() = customer_id OR 
  EXISTS (SELECT 1 FROM customers WHERE id = auth.uid() AND type = 'admin')
);

DROP POLICY IF EXISTS "auth_update_orders" ON orders;
CREATE POLICY "auth_update_orders" ON orders FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM customers WHERE id = auth.uid() AND type = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM customers WHERE id = auth.uid() AND type = 'admin')
);

-- Ensure admin can read all order items too
DROP POLICY IF EXISTS "anon_read_order_items" ON order_items;
CREATE POLICY "anon_read_order_items" ON order_items FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_update_order_items" ON order_items;
CREATE POLICY "auth_update_order_items" ON order_items FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM customers WHERE id = auth.uid() AND type = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM customers WHERE id = auth.uid() AND type = 'admin')
);
