-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "anon_read_site_settings" ON site_settings FOR SELECT TO anon, authenticated USING (true);

-- Allow admin updates
CREATE POLICY "admin_update_site_settings" ON site_settings FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM customers WHERE id = auth.uid() AND type = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM customers WHERE id = auth.uid() AND type = 'admin')
);

-- Insert default settings if empty
INSERT INTO site_settings (id, email, phone, address)
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid, 
  'king-glass@hotmail.com', 
  '+216 71 000 000', 
  'Zone Industrielle, Tunis'
WHERE NOT EXISTS (SELECT 1 FROM site_settings);
