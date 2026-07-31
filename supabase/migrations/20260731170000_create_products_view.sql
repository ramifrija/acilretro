-- Create a view for products that calculates the active price (coalescing promo_price and base_price)
-- It uses security_invoker = true to inherit the RLS policies of the underlying products table
CREATE OR REPLACE VIEW public.products_with_price 
WITH (security_invoker = true) 
AS
SELECT *,
       COALESCE(promo_price, base_price) AS active_price
FROM public.products;
