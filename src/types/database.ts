export type Brand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  country: string | null;
};

export type Model = {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  start_year: number | null;
  end_year: number | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  icon: string | null;
};

export type Customer = {
  id: string;
  email: string;
  phone: string | null;
  type: 'individual' | 'company' | 'admin';
  full_name: string | null;
  company_name: string | null;
  tax_id: string | null;
  address: string | null;
  city: string | null;
  created_at: string;
};

export type SiteSettings = {
  id: string;
  email: string;
  phone: string;
  address: string;
  updated_at: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category_id: string | null;
  brand_id: string | null;
  base_price: number;
  promo_price: number | null;
  sku: string | null;
  oem_ref: string | null;
  manufacturer_ref: string | null;
  weight: string | null;
  dimensions: string | null;
  warranty: string | null;
  delivery_time: string | null;
  stock: number;
  min_stock: number;
  warehouse_location: string | null;
  purchase_price: number;
  rating: number;
  featured: boolean;
  best_seller: boolean;
  new_arrival: boolean;
  is_promo: boolean;
  images: string[];
  created_at: string;
  updated_at: string;
};

export type OptionValue = {
  id: string;
  option_id: string;
  value: string;
  description: string | null;
  price_modifier: number;
  image_url: string | null;
  sku_suffix: string | null;
};

export type ProductOption = {
  id: string;
  product_id: string;
  name: string;
  required: boolean;
  option_values: OptionValue[];
};

export type ProductCompat = {
  id: string;
  product_id: string;
  model_id: string;
  year_from: number | null;
  year_to: number | null;
  fuel_type: string | null;
  engine_type: string | null;
};

export type Order = {
  id: string;
  customer_id: string | null;
  customer_type: 'individual' | 'company';
  status: string;
  type: 'order' | 'quote';
  subtotal: number;
  vat: number;
  shipping: number;
  total: number;
  notes: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  customer_info?: any;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  options_snapshot: Array<{ option: string; value: string; modifier: number }>;
  created_at: string;
};

export type InventoryMovement = {
  id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  reason: string | null;
  user_id: string | null;
  created_at: string;
};

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  options: Array<{ option: string; value: string; modifier: number }>;
};
