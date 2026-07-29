ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_info jsonb DEFAULT '{}'::jsonb;
