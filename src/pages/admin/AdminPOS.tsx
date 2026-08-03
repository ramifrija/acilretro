import { useEffect, useState, useRef } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, X, Check, Barcode, ChevronDown, Percent, Receipt, User, Car } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import type { Product, Order, OrderItem, Brand } from '@/types/database';
import PrintableDocument from '@/components/admin/PrintableDocument';

type OrderWithItems = Order & { order_items: OrderItem[] };

type ProductWithOpts = Product & {
  product_options?: {
    id: string;
    name: string;
    required: boolean;
    option_values: { id: string; value: string; price_modifier: number; image_url?: string }[];
  }[];
};

type PosItem = {
  id: string;
  product: ProductWithOpts;
  quantity: number;
  options: { option: string; value: string; priceModifier: number }[];
  unitPrice: number;
};

const VAT_OPTIONS = [0, 7, 13, 19];

export default function AdminPOS() {
  const [products, setProducts] = useState<ProductWithOpts[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<PosItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [vatRate, setVatRate] = useState(19);
  const [showVatDropdown, setShowVatDropdown] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [printDoc, setPrintDoc] = useState<{ order: OrderWithItems; type: 'invoice' } | null>(null);
  const [activeCategory, setActiveCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Clients CRM
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientForOrder, setSelectedClientForOrder] = useState<any | null>(null);
  const [showClientDD, setShowClientDD] = useState(false);
  const clientRef = useRef<HTMLDivElement>(null);

  // Brand filter
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  // Searchable brand dropdown
  const [brandSearch, setBrandSearch] = useState('');
  const [showBrandDD, setShowBrandDD] = useState(false);
  const brandRef = useRef<HTMLDivElement>(null);

  // Pagination
  const ITEMS_PER_PAGE = 16;
  const [page, setPage] = useState(1);

  // Option modal state
  const [selectedProduct, setSelectedProduct] = useState<ProductWithOpts | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, { value: string; price_modifier: number }>>({});

  useEffect(() => {
    supabase
      .from('products')
      .select('*, product_options(*, option_values(*))')
      .order('name')
      .then(({ data }) => setProducts(data || []));

    supabase.from('brands').select('*').order('name').then(({ data }) => setBrands(data || []));
    supabase.from('client').select('*').order('nom').then(({ data }) => setClients(data || []));
  }, []);

  // Close brand dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (brandRef.current && !brandRef.current.contains(e.target as Node)) setShowBrandDD(false);
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) setShowClientDD(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, selectedBrand]);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Unique categories
  const categories = Array.from(new Set(products.map(p => p.category_id || 'Autre').filter(Boolean)));

  // Filter by search text AND brand (using product.brand_id)
  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.oem_ref?.toLowerCase().includes(search.toLowerCase());
    const matchBrand = !selectedBrand || p.brand_id === selectedBrand.id;
    return matchSearch && matchBrand;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Searchable brand dropdown filtered list
  const filteredBrands = brands.filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase()));

  const handleProductClick = (product: ProductWithOpts) => {
    if (product.product_options && product.product_options.length > 0) {
      setSelectedProduct(product);
      setSelectedOptions({});
    } else {
      addToCart(product, []);
    }
  };

  const addToCart = (product: ProductWithOpts, options: { option: string; value: string; priceModifier: number }[]) => {
    const unitPrice = (product.promo_price ?? product.base_price) + options.reduce((sum, opt) => sum + opt.priceModifier, 0);

    setCart((c) => {
      const existing = c.find((i) =>
        i.product.id === product.id &&
        JSON.stringify(i.options) === JSON.stringify(options)
      );
      if (existing) {
        if (existing.quantity >= product.stock) return c;
        return c.map((i) => i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...c, { id: crypto.randomUUID(), product, quantity: 1, options, unitPrice }];
    });

    setSelectedProduct(null);
    setSearch('');
    searchRef.current?.focus();
  };

  const updateQty = (id: string, delta: number) => {
    setCart((c) => c.map((i) => {
      if (i.id === id) {
        const newQty = i.quantity + delta;
        if (newQty < 1) return i;
        return { ...i, quantity: Math.min(i.product.stock, newQty) };
      }
      return i;
    }));
  };

  const removeFromCart = (id: string) => setCart((c) => c.filter((i) => i.id !== id));

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const vat = subtotal * (vatRate / 100);
  const timbre = subtotal > 0 ? 1 : 0;
  const ras = (subtotal + vat + timbre) * 0.01;
  const total = subtotal + vat + timbre + ras;

  const checkout = async () => {
    setIsLoading(true);
    setShowCheckout(false);
    const finalCustomerName = customerName.trim() || 'Client Passager';

    const { data: order } = await supabase.from('orders').insert({
      customer_type: 'individual', status: 'paid', type: 'order',
      subtotal, vat, shipping: 0, total,
      notes: 'Vente directe au point de vente',
      client_id: selectedClientForOrder?.id || null,
      customer_info: { 
        fullName: finalCustomerName,
        email: selectedClientForOrder?.email,
        phone: selectedClientForOrder?.num_tel,
        taxId: selectedClientForOrder?.tax_id,
        address: selectedClientForOrder?.adresse || ''
      }
    }).select().single();

    if (order && cart.length) {
      const itemsToInsert = cart.map((i) => ({
        order_id: order.id,
        product_id: i.product.id,
        product_name: i.product.name,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        options_snapshot: i.options,
      }));

      const { data: insertedItems } = await supabase.from('order_items').insert(itemsToInsert).select();

      const { error: rpcError } = await supabase.rpc('reduce_stock_for_order', {
        p_order_id: order.id,
        p_reason_prefix: 'Vente POS'
      });

      if (rpcError) {
        console.error('Error reducing stock via RPC:', rpcError);
      }

      setPrintDoc({ order: { ...order, order_items: insertedItems || [] } as OrderWithItems, type: 'invoice' });
    }
    setCart([]);
    setCustomerName('');
    setSelectedClientForOrder(null);
    setIsLoading(false);
  };

  const isModalValid = selectedProduct?.product_options?.every(
    (opt) => !opt.required || selectedOptions[opt.id]
  );

  return (
    <div className="animate-fade-in h-full">
      <div className="grid lg:grid-cols-[1fr_380px] gap-4 h-full">

        {/* ===== LEFT: Product Catalog ===== */}
        <div className="flex flex-col gap-4 min-h-0">

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, SKU ou référence OEM..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-brand-900/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm shadow-sm focus:ring-2 focus:ring-brand-500/40 outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); searchRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Brand Filter — Searchable Dropdown */}
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-1.5 shrink-0 text-slate-500">
              <Car className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Marque</span>
            </div>

            {/* Brand searchable dropdown */}
            <div className="relative flex-1" ref={brandRef}>
              <button
                onClick={() => { setShowBrandDD(!showBrandDD); setBrandSearch(''); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all
                  ${selectedBrand ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-brand-900/60 text-slate-700 dark:text-slate-300'}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {selectedBrand?.logo_url && (
                    <img src={selectedBrand.logo_url} alt="" className="w-4 h-4 object-contain shrink-0" />
                  )}
                  <span className="truncate">{selectedBrand ? selectedBrand.name : 'Toutes les marques'}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${showBrandDD ? 'rotate-180' : ''}`} />
              </button>
              {showBrandDD && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-brand-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-30 overflow-hidden flex flex-col max-h-64">
                  <div className="p-2 border-b border-slate-100 dark:border-white/5 relative shrink-0">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Rechercher une marque..."
                      value={brandSearch}
                      onChange={e => setBrandSearch(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-white/5 rounded-lg outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="overflow-y-auto">
                    <button
                      onClick={() => { setSelectedBrand(null); setShowBrandDD(false); }}
                      className={`w-full px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${!selectedBrand ? 'font-bold text-brand-600' : 'text-slate-500'}`}
                    >
                      Toutes les marques
                    </button>
                    {filteredBrands.map(b => (
                      <button
                        key={b.id}
                        onClick={() => { setSelectedBrand(b); setShowBrandDD(false); setBrandSearch(''); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors
                          ${selectedBrand?.id === b.id ? 'bg-brand-50 dark:bg-brand-800/50 text-brand-700 dark:text-brand-300 font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                      >
                        {b.logo_url ? (
                          <div className="w-6 h-6 rounded bg-white border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 p-0.5">
                            <img src={b.logo_url} alt={b.name} className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                            <Car className="w-3 h-3 text-slate-400" />
                          </div>
                        )}
                        {b.name}
                      </button>
                    ))}
                    {filteredBrands.length === 0 && <p className="px-3 py-3 text-xs text-slate-400 text-center">Aucune marque</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Reset */}
            {selectedBrand && (
              <button
                onClick={() => setSelectedBrand(null)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-400 hover:text-error-500 hover:border-error-300 transition-all shrink-0"
                title="Effacer le filtre"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Active filter badge */}
          {selectedBrand && (
            <div className="flex items-center gap-2 px-3 py-2 bg-brand-50 dark:bg-brand-900/40 rounded-xl border border-brand-200 dark:border-brand-700/40">
              {selectedBrand.logo_url && <img src={selectedBrand.logo_url} alt="" className="w-4 h-4 object-contain" />}
              <span className="text-xs text-brand-700 dark:text-brand-300 font-semibold">
                {filtered.length} produit(s) pour la marque {selectedBrand.name}
              </span>
            </div>
          )}

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto pb-4">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Barcode className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-base font-medium">Aucun produit trouvé</p>
                <p className="text-sm mt-1">Essayez avec un autre terme</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {paginated.map((p) => {
                  const price = p.promo_price ?? p.base_price;
                  const isOutOfStock = p.stock === 0;
                  const hasOptions = p.product_options && p.product_options.length > 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleProductClick(p)}
                      disabled={isOutOfStock}
                      className={`glass-card text-left transition-all duration-200 group relative overflow-hidden
                        ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/10 active:scale-95'}
                      `}
                    >
                      {/* Image */}
                      <div className="aspect-square rounded-xl mb-3 overflow-hidden bg-slate-100 dark:bg-brand-900/30 relative">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Barcode className="w-10 h-10 text-slate-300" />
                          </div>
                        )}
                        {/* Badges */}
                        {hasOptions && (
                          <div className="absolute top-2 left-2 bg-brand-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                            OPTIONS
                          </div>
                        )}
                        {p.promo_price && (
                          <div className="absolute top-2 right-2 bg-error-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                            PROMO
                          </div>
                        )}
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-xs font-bold bg-black/60 px-2 py-1 rounded-lg">Épuisé</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="px-1 pb-1">
                        <p className="text-[12px] font-semibold text-slate-800 dark:text-white line-clamp-2 leading-tight mb-1.5">{p.name}</p>
                        {p.sku && <p className="text-[10px] text-slate-400 font-mono mb-1">{p.sku}</p>}
                        <div className="flex items-center justify-between gap-1">
                          <div>
                            <p className="text-sm font-bold text-brand-600 dark:text-brand-400">{formatPrice(price)}</p>
                            {p.promo_price && (
                              <p className="text-[10px] text-slate-400 line-through">{formatPrice(p.base_price)}</p>
                            )}
                          </div>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${p.stock <= (p.min_stock || 3) ? 'bg-amber-500/10 text-amber-600' : 'bg-success-500/10 text-success-600'}`}>
                            {p.stock} stock
                          </span>
                        </div>
                      </div>

                      {/* Hover Add indicator */}
                      {!isOutOfStock && (
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-brand-gradient scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100 dark:border-white/10">
                <span className="text-xs text-slate-500">
                  {((page - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} sur {filtered.length} produits
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    ← Préc.
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                    .reduce<(number | '...')[]>((acc, n, i, arr) => {
                      if (i > 0 && (n as number) - (arr[i - 1] as number) > 1) acc.push('...');
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((n, i) =>
                      n === '...' ? (
                        <span key={`ellipsis-${i}`} className="px-1 text-slate-400 text-xs">…</span>
                      ) : (
                        <button
                          key={n}
                          onClick={() => setPage(n as number)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all
                            ${page === n ? 'bg-brand-gradient text-white shadow-md shadow-brand-500/20' : 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                        >
                          {n}
                        </button>
                      )
                    )
                  }
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Suiv. →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== RIGHT: Cart & Summary ===== */}
        <div className="flex flex-col glass-card p-0 overflow-hidden max-h-[calc(100vh-120px)] sticky top-24">

          {/* Cart Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-brand-500/20">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-base leading-none">Ticket de caisse</h3>
                <p className="text-xs text-slate-500 mt-0.5">{cart.length} article(s)</p>
              </div>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs font-semibold text-slate-400 hover:text-error-500 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Vider
              </button>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
                <ShoppingCart className="w-14 h-14 opacity-10 mb-4" />
                <p className="text-sm font-medium">Panier vide</p>
                <p className="text-xs mt-1 opacity-70">Cliquez sur un produit pour l'ajouter</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-brand-900/30 border border-slate-100 dark:border-white/5 group">
                    {/* Product image */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white dark:bg-brand-900 border border-slate-100 dark:border-white/10 shrink-0">
                      {item.product.images?.[0] ? (
                        <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Barcode className="w-5 h-5 text-slate-300" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-slate-900 dark:text-white truncate">{item.product.name}</p>
                      {item.options.length > 0 && (
                        <div className="text-[10px] text-brand-500 dark:text-brand-400 mt-0.5 truncate">
                          {item.options.map(o => o.value).join(' · ')}
                        </div>
                      )}
                      {/* Qty Controls */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white dark:bg-brand-800 border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-brand-50 dark:hover:bg-brand-700 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-7 text-center text-slate-900 dark:text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="w-6 h-6 rounded-lg bg-white dark:bg-brand-800 border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-brand-50 dark:hover:bg-brand-700 transition-colors disabled:opacity-30"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="text-[10px] text-slate-400 ml-1">× {formatPrice(item.unitPrice)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-between shrink-0">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 rounded-lg text-slate-300 hover:text-error-500 hover:bg-error-500/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <p className="text-sm font-extrabold text-brand-600 dark:text-brand-400">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="shrink-0 border-t border-slate-100 dark:border-white/10 p-4 space-y-4">

              {/* Customer Selection */}
              <div className="relative" ref={clientRef}>
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setSelectedClientForOrder(null);
                    setShowClientDD(true);
                  }}
                  onFocus={() => setShowClientDD(true)}
                  placeholder="Nom du client (optionnel)"
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-brand-900/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/30 transition-all relative z-0"
                />
                {selectedClientForOrder && (
                  <button
                    onClick={() => {
                      setSelectedClientForOrder(null);
                      setCustomerName('');
                    }}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-error-500 transition-colors z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Dropdown for client search */}
                {showClientDD && clients.length > 0 && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-brand-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                    {clients
                      .filter(c => (c.nom + ' ' + c.prenom).toLowerCase().includes(customerName.toLowerCase()))
                      .map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedClientForOrder(c);
                            setCustomerName(`${c.prenom} ${c.nom}`);
                            setShowClientDD(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-50 dark:border-white/5 last:border-0"
                        >
                          <div className="font-semibold text-slate-900 dark:text-white">{c.prenom} {c.nom}</div>
                          {(c.num_tel || c.email) && (
                            <div className="text-xs text-slate-500">{c.num_tel} {c.email ? `• ${c.email}` : ''}</div>
                          )}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* VAT Selector */}
              <div className="relative">
                <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">TVA (%)</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={vatRate}
                    onChange={(e) => setVatRate(Number(e.target.value) || 0)}
                    className="input-field w-full pl-10"
                    placeholder="Ex: 19"
                  />
                  <Percent className="w-4 h-4 text-brand-500 absolute left-3" />
                </div>
              </div>

              {/* Totals */}
              <div className="bg-slate-50 dark:bg-brand-900/30 rounded-xl px-4 py-3 space-y-2">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Sous-total HT</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>TVA ({vatRate}%)</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{formatPrice(vat)}</span>
                </div>
                {subtotal > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Timbre fiscal</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{formatPrice(timbre)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>RAS (1%)</span>
                      <span className="font-medium text-brand-600 dark:text-brand-400">+{formatPrice(ras)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-extrabold text-lg text-slate-900 dark:text-white border-t border-slate-200 dark:border-white/10 pt-2 mt-1">
                  <span>Total TTC</span>
                  <span className="text-brand-600 dark:text-brand-400">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Encaisser Button */}
              <button
                onClick={() => setShowCheckout(true)}
                disabled={isLoading}
                className="w-full py-4 rounded-2xl bg-brand-gradient text-white font-display font-bold text-lg shadow-xl shadow-brand-500/30 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-60"
              >
                <Receipt className="w-5 h-5" />
                Encaisser {formatPrice(total)}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===== Option Selection Modal ===== */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedProduct(null)} />
          <div className="relative glass-card w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white pr-8">
                  {selectedProduct.name}
                </h2>
                <p className="text-sm text-brand-600 dark:text-brand-400 font-semibold mt-1">
                  {formatPrice(selectedProduct.promo_price ?? selectedProduct.base_price)}
                </p>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="p-2 rounded-xl glass shrink-0 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-6">
              {selectedProduct.product_options?.map((opt) => (
                <div key={opt.id}>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    {opt.name}
                    {opt.required && (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-error-500/10 text-error-600">
                        Requis
                      </span>
                    )}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {opt.option_values.map((val) => {
                      const isSelected = selectedOptions[opt.id]?.value === val.value;
                      return (
                        <button
                          key={val.id}
                          onClick={() => {
                            if (!opt.required && isSelected) {
                              const newOpts = { ...selectedOptions };
                              delete newOpts[opt.id];
                              setSelectedOptions(newOpts);
                            } else {
                              setSelectedOptions({ ...selectedOptions, [opt.id]: { value: val.value, price_modifier: val.price_modifier } });
                            }
                          }}
                          className={`p-3 text-left rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/40'
                              : 'border-slate-200 dark:border-white/10 glass hover:border-brand-300'
                          }`}
                        >
                          {val.image_url && (
                            <img src={val.image_url} alt={val.value} className="w-full h-16 object-cover rounded-lg mb-2" />
                          )}
                          <div className="flex justify-between items-center gap-2">
                            <span className={`text-xs font-semibold ${isSelected ? 'text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-300'}`}>
                              {val.value}
                            </span>
                            {val.price_modifier > 0 && (
                              <span className="text-[10px] font-bold text-success-600 shrink-0">+{formatPrice(val.price_modifier)}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10">
              <button
                disabled={!isModalValid}
                onClick={() => {
                  const optsArray = Object.entries(selectedOptions).map(([optId, val]) => {
                    const optName = selectedProduct.product_options?.find(o => o.id === optId)?.name || 'Option';
                    return { option: optName, value: val.value, priceModifier: val.price_modifier };
                  });
                  addToCart(selectedProduct, optsArray);
                }}
                className="btn-primary w-full py-3.5 text-base disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5 mr-2" />
                Ajouter au ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Checkout Confirmation Modal ===== */}
      {showCheckout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCheckout(false)} />
          <div className="relative glass-card w-full max-w-md p-8 text-center shadow-2xl">
            <button onClick={() => setShowCheckout(false)} className="absolute top-4 right-4 p-2 rounded-xl glass">
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center mx-auto mb-5 shadow-xl shadow-brand-500/30">
              <Receipt className="w-8 h-8 text-white" />
            </div>

            <h2 className="font-display font-bold text-2xl text-slate-900 dark:text-white mb-1">Confirmation</h2>
            <p className="text-slate-500 text-sm mb-6">Valider l'encaissement et imprimer la facture</p>

            <div className="font-display font-extrabold text-5xl text-brand-600 dark:text-brand-400 mb-6 tracking-tight">
              {formatPrice(total)}
            </div>

            <div className="bg-slate-50 dark:bg-brand-900/30 rounded-xl p-4 mb-2 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Client</span>
                <span className="font-semibold text-slate-900 dark:text-white">{customerName.trim() || 'Client Passager'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Articles</span>
                <span className="font-semibold text-slate-900 dark:text-white">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">HT</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">TVA ({vatRate}%)</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatPrice(vat)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Timbre</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatPrice(timbre)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">RAS (1%)</span>
                <span className="font-semibold text-brand-600 dark:text-brand-400">+{formatPrice(ras)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-5">La facture s'ouvrira automatiquement après l'encaissement</p>

            <button
              onClick={checkout}
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-brand-gradient text-white font-display font-bold text-lg shadow-xl shadow-brand-500/30 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-60"
            >
              <Check className="w-6 h-6" />
              {isLoading ? 'Traitement...' : 'Confirmer & Imprimer'}
            </button>
          </div>
        </div>
      )}

      {/* ===== Print Invoice Modal ===== */}
      {printDoc && (
        <div className="fixed inset-0 z-[62] bg-white overflow-y-auto animate-fade-in print:static print:h-auto print:overflow-visible print:block">
          <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-slate-200 px-6 py-3 flex items-center justify-between print:hidden shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPrintDoc(null)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all text-sm font-semibold text-slate-700"
              >
                <X className="w-4 h-4" /> Fermer
              </button>
              <span className="text-sm text-slate-500 font-semibold">
                Facture #{printDoc.order.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <button onClick={() => window.print()} className="btn-primary text-sm px-6">
              Imprimer la facture
            </button>
          </div>
          <div className="print:block">
            <PrintableDocument order={printDoc.order} documentType={printDoc.type} />
          </div>
        </div>
      )}
    </div>
  );
}
