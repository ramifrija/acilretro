ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.client(id) ON DELETE SET NULL;
