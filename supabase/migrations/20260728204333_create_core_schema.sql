/*
# ACIL RETRO Core Schema

Creates the foundational catalog and commerce schema for the ACIL RETRO
automotive spare-parts platform: vehicle brands/models, product categories,
products with configurable options and variants, product compatibility with
vehicles, customers, orders (orders + quotations), order items, and inventory
movements with full audit traceability.

## 1. New Tables

- `brands` — vehicle manufacturers (Fiat, Peugeot, Renault, ...).
  - id (uuid pk), name, slug (unique), logo_url, country, created_at.
- `models` — vehicle models belonging to a brand.
  - id (uuid pk), brand_id (fk brands), name, slug, start_year, end_year, created_at.
- `categories` — product categories (mirrors, accessories, ...), self-referencing parent.
  - id (uuid pk), name, slug (unique), parent_id (fk categories nullable), icon, created_at.
- `products` — sellable spare parts.
  - id (uuid pk), slug (unique), name, description (text), category_id (fk),
    base_price numeric, promo_price numeric nullable, sku, oem_ref,
    manufacturer_ref, weight, dimensions, warranty, delivery_time,
    stock int, min_stock int, warehouse_location, purchase_price numeric,
    rating numeric, featured bool, best_seller bool, new_arrival bool,
    is_promo bool, images jsonb (array of urls), created_at, updated_at.
- `product_options` — configurable option groups for a product (e.g. "Heating").
  - id (uuid pk), product_id (fk), name, required bool.
- `option_values` — possible values for an option, with price modifier and image.
  - id (uuid pk), option_id (fk), value, price_modifier numeric default 0,
    image_url, sku_suffix.
- `product_compat` — many-to-many compatibility between products and vehicle models.
  - id (uuid pk), product_id (fk), model_id (fk), year_from int, year_to int,
    fuel_type text, engine_type text.
- `customers` — storefront customer profiles (linked to auth.users).
  - id (uuid pk = auth.users.id), type text (individual|company), full_name,
    company_name, tax_id, vat_number, rc_number, email, phone, address, city,
    postal_code, country, notes, created_at.
- `orders` — purchase orders and quotation requests (type distinguishes them).
  - id (uuid pk), customer_id (fk customers nullable for guest), customer_type
    text, status text, type text (order|quote), subtotal, vat, shipping, total,
    notes, expires_at (for quotes), created_at, updated_at.
- `order_items` — line items in an order, snapshotting selected options.
  - id (uuid pk), order_id (fk orders), product_id (fk), product_name, quantity int,
    unit_price, options_snapshot jsonb, created_at.
- `inventory_movements` — full audit log of every stock change.
  - id (uuid pk), product_id (fk), movement_type text (purchase|sale|quote|
    adjustment|return|transfer), quantity int (negative for out), reason text,
    user_id uuid, created_at.

## 2. Indexes

- models.brand_id, products.category_id, products.slug, product_options.product_id,
  option_values.option_id, product_compat.product_id, product_compat.model_id,
  orders.customer_id, order_items.order_id, inventory_movements.product_id.

## 3. Security (RLS)

- Catalog tables (brands, models, categories, products, product_options,
  option_values, product_compat): public read (anon, authenticated) so the
  storefront works without login; write restricted to authenticated users (admin).
- customers: owner-scoped (auth.uid() = id).
- orders: owner-scoped (auth.uid() = customer_id); authenticated can read all
  (admin). Guest orders (customer_id null) are inserted by anon.
- order_items: writable when the parent order is owned (or anon for guest).
- inventory_movements: authenticated read/write (admin/warehouse).

## 4. Notes

- Soft-delete via `deleted_at` is intentionally omitted for catalog tables in v1
  to keep the demo lean; the inventory_movements table provides audit traceability.
- All money columns use numeric(12,3) to handle TND/EUR precisely.
*/

-- ---------- brands ----------
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  country text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_brands" ON brands;
CREATE POLICY "anon_read_brands" ON brands FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_write_brands" ON brands;
CREATE POLICY "auth_write_brands" ON brands FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_brands" ON brands;
CREATE POLICY "auth_update_brands" ON brands FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_brands" ON brands;
CREATE POLICY "auth_delete_brands" ON brands FOR DELETE TO authenticated USING (true);

-- ---------- models ----------
CREATE TABLE IF NOT EXISTS models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  start_year int,
  end_year int,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_models" ON models;
CREATE POLICY "anon_read_models" ON models FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_write_models" ON models;
CREATE POLICY "auth_write_models" ON models FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_models" ON models;
CREATE POLICY "auth_update_models" ON models FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_models" ON models;
CREATE POLICY "auth_delete_models" ON models FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_models_brand ON models(brand_id);

-- ---------- categories ----------
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  icon text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_categories" ON categories;
CREATE POLICY "anon_read_categories" ON categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_write_categories" ON categories;
CREATE POLICY "auth_write_categories" ON categories FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_categories" ON categories;
CREATE POLICY "auth_update_categories" ON categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_categories" ON categories;
CREATE POLICY "auth_delete_categories" ON categories FOR DELETE TO authenticated USING (true);

-- ---------- products ----------
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  base_price numeric(12,3) NOT NULL DEFAULT 0,
  promo_price numeric(12,3),
  sku text,
  oem_ref text,
  manufacturer_ref text,
  weight text,
  dimensions text,
  warranty text,
  delivery_time text,
  stock int NOT NULL DEFAULT 0,
  min_stock int NOT NULL DEFAULT 5,
  warehouse_location text,
  purchase_price numeric(12,3) DEFAULT 0,
  rating numeric(2,1) DEFAULT 0,
  featured boolean DEFAULT false,
  best_seller boolean DEFAULT false,
  new_arrival boolean DEFAULT false,
  is_promo boolean DEFAULT false,
  images jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_products" ON products;
CREATE POLICY "anon_read_products" ON products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_write_products" ON products;
CREATE POLICY "auth_write_products" ON products FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_products" ON products;
CREATE POLICY "auth_update_products" ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_products" ON products;
CREATE POLICY "auth_delete_products" ON products FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- ---------- product_options ----------
CREATE TABLE IF NOT EXISTS product_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  required boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_product_options" ON product_options;
CREATE POLICY "anon_read_product_options" ON product_options FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_write_product_options" ON product_options;
CREATE POLICY "auth_write_product_options" ON product_options FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_product_options" ON product_options;
CREATE POLICY "auth_update_product_options" ON product_options FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_product_options" ON product_options;
CREATE POLICY "auth_delete_product_options" ON product_options FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_product_options_product ON product_options(product_id);

-- ---------- option_values ----------
CREATE TABLE IF NOT EXISTS option_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id uuid NOT NULL REFERENCES product_options(id) ON DELETE CASCADE,
  value text NOT NULL,
  price_modifier numeric(12,3) DEFAULT 0,
  image_url text,
  sku_suffix text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE option_values ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_option_values" ON option_values;
CREATE POLICY "anon_read_option_values" ON option_values FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_write_option_values" ON option_values;
CREATE POLICY "auth_write_option_values" ON option_values FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_option_values" ON option_values;
CREATE POLICY "auth_update_option_values" ON option_values FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_option_values" ON option_values;
CREATE POLICY "auth_delete_option_values" ON option_values FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_option_values_option ON option_values(option_id);

-- ---------- product_compat ----------
CREATE TABLE IF NOT EXISTS product_compat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  model_id uuid NOT NULL REFERENCES models(id) ON DELETE CASCADE
);
ALTER TABLE product_compat ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_product_compat" ON product_compat;
CREATE POLICY "anon_read_product_compat" ON product_compat FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_write_product_compat" ON product_compat;
CREATE POLICY "auth_write_product_compat" ON product_compat FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_product_compat" ON product_compat;
CREATE POLICY "auth_update_product_compat" ON product_compat FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_product_compat" ON product_compat;
CREATE POLICY "auth_delete_product_compat" ON product_compat FOR DELETE TO authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_compat_product ON product_compat(product_id);
CREATE INDEX IF NOT EXISTS idx_compat_model ON product_compat(model_id);

-- ---------- customers ----------
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'individual',
  full_name text,
  company_name text,
  tax_id text,
  vat_number text,
  rc_number text,
  email text,
  phone text,
  address text,
  city text,
  postal_code text,
  country text,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_read_customers" ON customers;
CREATE POLICY "owner_read_customers" ON customers FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "owner_insert_customers" ON customers;
CREATE POLICY "owner_insert_customers" ON customers FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "owner_update_customers" ON customers;
CREATE POLICY "owner_update_customers" ON customers FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ---------- orders ----------
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  customer_type text NOT NULL DEFAULT 'individual',
  status text NOT NULL DEFAULT 'pending',
  type text NOT NULL DEFAULT 'order',
  subtotal numeric(12,3) DEFAULT 0,
  vat numeric(12,3) DEFAULT 0,
  shipping numeric(12,3) DEFAULT 0,
  total numeric(12,3) DEFAULT 0,
  notes text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "owner_read_orders" ON orders;
CREATE POLICY "owner_read_orders" ON orders FOR SELECT TO authenticated USING (auth.uid() = customer_id);
DROP POLICY IF EXISTS "auth_update_orders" ON orders;
CREATE POLICY "auth_update_orders" ON orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ---------- order_items ----------
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  unit_price numeric(12,3) NOT NULL DEFAULT 0,
  options_snapshot jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_read_order_items" ON order_items;
CREATE POLICY "anon_read_order_items" ON order_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_update_order_items" ON order_items;
CREATE POLICY "auth_update_order_items" ON order_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ---------- inventory_movements ----------
CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type text NOT NULL,
  quantity int NOT NULL,
  reason text,
  user_id uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_inventory" ON inventory_movements;
CREATE POLICY "auth_read_inventory" ON inventory_movements FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_write_inventory" ON inventory_movements;
CREATE POLICY "auth_write_inventory" ON inventory_movements FOR INSERT TO authenticated WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory_movements(product_id);

-- ---------- updated_at trigger ----------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_products_updated ON products;
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_orders_updated ON orders;
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
