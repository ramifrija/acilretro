CREATE TABLE IF NOT EXISTS public.client (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  prenom text NOT NULL,
  email text,
  num_tel text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.client ENABLE ROW LEVEL SECURITY;

-- Allow admins to do everything
CREATE POLICY "admin_all_client" ON public.client
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
