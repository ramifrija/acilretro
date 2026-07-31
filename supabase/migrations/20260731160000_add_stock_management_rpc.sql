-- Create secure stored functions for order-level stock management in transactions

-- 1. Function to reduce stock when validating an order/quote or POS sale
CREATE OR REPLACE FUNCTION public.reduce_stock_for_order(
  p_order_id uuid,
  p_reason_prefix text
)
RETURNS void AS $$
DECLARE
  v_item record;
BEGIN
  -- Security check: only admins can manage stock
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized to perform stock adjustments.';
  END IF;

  FOR v_item IN 
    SELECT product_id, quantity, product_name 
    FROM public.order_items 
    WHERE order_id = p_order_id AND product_id IS NOT NULL
  LOOP
    -- Update stock atomatically (never let stock drop below 0)
    UPDATE public.products
    SET stock = CASE 
      WHEN stock - v_item.quantity < 0 THEN 0 
      ELSE stock - v_item.quantity 
    END
    WHERE id = v_item.product_id;

    -- Insert movement
    INSERT INTO public.inventory_movements (product_id, movement_type, quantity, reason)
    VALUES (
      v_item.product_id, 
      'sale', 
      -v_item.quantity, 
      p_reason_prefix || ' #' || upper(substring(p_order_id::text, 1, 8))
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to restore stock when rejecting or cancelling an order
CREATE OR REPLACE FUNCTION public.restore_stock_for_order(
  p_order_id uuid,
  p_reason_prefix text
)
RETURNS void AS $$
DECLARE
  v_item record;
BEGIN
  -- Security check: only admins can manage stock
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized to perform stock adjustments.';
  END IF;

  FOR v_item IN 
    SELECT product_id, quantity, product_name 
    FROM public.order_items 
    WHERE order_id = p_order_id AND product_id IS NOT NULL
  LOOP
    -- Restore stock atomatically
    UPDATE public.products
    SET stock = stock + v_item.quantity
    WHERE id = v_item.product_id;

    -- Insert movement
    INSERT INTO public.inventory_movements (product_id, movement_type, quantity, reason)
    VALUES (
      v_item.product_id, 
      'return', 
      v_item.quantity, 
      p_reason_prefix || ' #' || upper(substring(p_order_id::text, 1, 8))
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
