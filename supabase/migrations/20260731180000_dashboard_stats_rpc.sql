CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_revenue numeric;
  v_total_orders int;
  v_pending_quotes int;
  v_pending_orders int;
  v_total_products int;
  v_low_stock_count int;
  v_total_customers int;
  v_inventory_value numeric;
  v_chart_week json;
  v_chart_month json;
  v_top_products json;
  v_low_stock_products json;
BEGIN
  -- Verification du role admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;

  -- 1. Statistiques des Commandes
  SELECT 
    COALESCE(SUM(total), 0)
  INTO v_total_revenue
  FROM public.orders 
  WHERE status = 'paid';

  SELECT 
    COUNT(*) FILTER (WHERE type = 'order'),
    COUNT(*) FILTER (WHERE type = 'quote' AND status = 'pending'),
    COUNT(*) FILTER (WHERE type = 'order' AND status = 'pending')
  INTO v_total_orders, v_pending_quotes, v_pending_orders
  FROM public.orders;

  -- 2. Statistiques des Produits
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE stock <= min_stock),
    COALESCE(SUM(base_price * stock), 0)
  INTO v_total_products, v_low_stock_count, v_inventory_value
  FROM public.products;

  -- 3. Statistiques des Clients (on compte dans la table client qui est celle utilisee par l'espace admin)
  -- Si 'client' n'existe pas, on peut ajuster. 
  SELECT COUNT(*) INTO v_total_customers FROM public.client;

  -- 4. Graphiques (Ventes)
  -- 7 derniers jours
  WITH days AS (
    SELECT generate_series(
      date_trunc('day', CURRENT_TIMESTAMP) - interval '6 days',
      date_trunc('day', CURRENT_TIMESTAMP),
      interval '1 day'
    ) AS day
  )
  SELECT json_agg(COALESCE(daily_total, 0) ORDER BY day)
  INTO v_chart_week
  FROM (
    SELECT d.day, SUM(o.total) as daily_total
    FROM days d
    LEFT JOIN public.orders o ON date_trunc('day', o.created_at) = d.day AND o.status = 'paid'
    GROUP BY d.day
  ) t;

  -- 12 mois (annee en cours)
  WITH months AS (
    SELECT generate_series(1, 12) AS month
  )
  SELECT json_agg(COALESCE(monthly_total, 0) ORDER BY month)
  INTO v_chart_month
  FROM (
    SELECT m.month, SUM(o.total) as monthly_total
    FROM months m
    LEFT JOIN public.orders o ON EXTRACT(MONTH FROM o.created_at) = m.month 
                              AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_TIMESTAMP)
                              AND o.status = 'paid'
    GROUP BY m.month
  ) t;

  -- 5. Top Produits
  SELECT COALESCE(json_agg(row_to_json(tp)), '[]'::json)
  INTO v_top_products
  FROM (
    SELECT 
      oi.product_name, 
      SUM(oi.quantity)::int as count, 
      SUM(oi.quantity * oi.unit_price) as sum
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE o.status = 'paid'
    GROUP BY oi.product_name
    ORDER BY count DESC
    LIMIT 5
  ) tp;

  -- 6. Low stock products
  SELECT COALESCE(json_agg(row_to_json(ls)), '[]'::json)
  INTO v_low_stock_products
  FROM (
    SELECT * 
    FROM public.products 
    WHERE stock <= min_stock 
    ORDER BY stock ASC 
    LIMIT 5
  ) ls;

  -- Retour du JSON structure
  RETURN json_build_object(
    'totalRevenue', v_total_revenue,
    'totalOrders', v_total_orders,
    'pendingQuotes', v_pending_quotes,
    'pendingOrders', v_pending_orders,
    'totalProducts', v_total_products,
    'lowStockCount', v_low_stock_count,
    'totalCustomers', v_total_customers,
    'inventoryValue', v_inventory_value,
    'chartData', json_build_object(
      'week', v_chart_week,
      'month', v_chart_month
    ),
    'topProducts', v_top_products,
    'lowStockProducts', v_low_stock_products
  );
END;
$$;
