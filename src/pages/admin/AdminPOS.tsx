import { useEffect, useState } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, Landmark, X, Check, Barcode } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import type { Product, Order, OrderItem } from '@/types/database';
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

export default function AdminPOS() {
  const [products, setProducts] = useState<ProductWithOpts[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<PosItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [printDoc, setPrintDoc] = useState<{ order: OrderWithItems; type: 'invoice' } | null>(null);

  // Option modal state
  const [selectedProduct, setSelectedProduct] = useState<ProductWithOpts | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, { value: string; price_modifier: number }>>({});

  useEffect(() => {
    supabase
      .from('products')
      .select('*, product_options(*, option_values(*))')
      .order('name')
      .then(({ data }) => setProducts(data || []));
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.oem_ref?.toLowerCase().includes(search.toLowerCase()),
  );

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
  };

  const updateQty = (id: string, delta: number) => {
    setCart((c) => c.map((i) => {
      if (i.id === id) {
        return { ...i, quantity: Math.min(i.product.stock, Math.max(1, i.quantity + delta)) };
      }
      return i;
    }));
  };

  const removeFromCart = (id: string) => setCart((c) => c.filter((i) => i.id !== id));

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const vat = subtotal * 0.19;
  const total = subtotal + vat;

  const checkout = async () => {
    setShowCheckout(false);
    const finalCustomerName = customerName.trim() || 'Client Passager';
    
    const { data: order } = await supabase.from('orders').insert({
      customer_type: 'individual', status: 'paid', type: 'order',
      subtotal, vat, shipping: 0, total, notes: 'Vente directe au point de vente',
      customer_info: { fullName: finalCustomerName }
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
      
      // Reduce stock (note: we don't handle stock per option here yet, just product stock)
      for (const item of cart) {
        await supabase.from('products').update({ stock: item.product.stock - item.quantity }).eq('id', item.product.id);
        await supabase.from('inventory_movements').insert({
          product_id: item.product.id, movement_type: 'sale', quantity: -item.quantity, reason: 'Vente POS',
        });
      }
      
      setPrintDoc({ order: { ...order, order_items: insertedItems || [] } as OrderWithItems, type: 'invoice' });
    }
    setCart([]);
    setCustomerName('');
  };

  const isModalValid = selectedProduct?.product_options?.every(
    (opt) => !opt.required || selectedOptions[opt.id]
  );

  return (
    <div className="animate-fade-in">

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Product grid (more compact for cashier) */}
        <div className="lg:col-span-2">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Scanner ou rechercher un produit..." className="input-field pl-10 text-sm py-2.5" />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 gap-2 max-h-[75vh] overflow-y-auto pb-4 pr-1 scrollbar-thin">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => handleProductClick(p)}
                disabled={p.stock === 0}
                className="glass-card p-2 text-left hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed group relative"
              >
                <div className="aspect-square rounded mb-2 overflow-hidden bg-slate-100 dark:bg-brand-900/30 relative">
                  {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <Barcode className="w-full h-full p-4 text-slate-300" />}
                  {p.product_options && p.product_options.length > 0 && (
                    <div className="absolute top-1 right-1 bg-brand-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                      OPTIONS
                    </div>
                  )}
                </div>
                <p className="text-[11px] font-medium text-slate-900 dark:text-white line-clamp-2 leading-tight">{p.name}</p>
                <p className="text-xs font-bold text-brand-600 dark:text-brand-400 mt-1">{formatPrice(p.promo_price ?? p.base_price)}</p>
                <div className="text-[9px] text-slate-500 mt-0.5">Stock: {p.stock}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="lg:col-span-1">
          <div className="glass-card p-4 sticky top-24 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/10 shrink-0">
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" /> Ticket
              </h3>
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-xs font-semibold text-slate-400 hover:text-error-500 transition-colors">VIDER</button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-slate-400 flex-1">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Panier vide</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4 flex-1 overflow-y-auto pr-1 scrollbar-thin">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-3 glass p-2 rounded-xl">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-brand-900/30 shrink-0">
                        {item.product.images?.[0] && <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">{item.product.name}</p>
                        {item.options.length > 0 && (
                          <div className="text-[9px] text-slate-500 mt-0.5 leading-tight">
                            {item.options.map(o => `${o.value}`).join(' · ')}
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-1.5">
                          <button onClick={() => updateQty(item.id, -1)} className="w-5 h-5 rounded bg-white dark:bg-brand-800 shadow-sm flex items-center justify-center hover:bg-slate-50 dark:hover:bg-brand-700 transition-colors"><Minus className="w-2.5 h-2.5" /></button>
                          <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="w-5 h-5 rounded bg-white dark:bg-brand-800 shadow-sm flex items-center justify-center hover:bg-slate-50 dark:hover:bg-brand-700 transition-colors"><Plus className="w-2.5 h-2.5" /></button>
                        </div>
                      </div>
                      <div className="text-right flex flex-col justify-between shrink-0">
                        <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-error-500 self-end p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                        <p className="text-xs font-bold text-brand-600 dark:text-brand-400">{formatPrice(item.unitPrice * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 dark:border-white/10 pt-3 space-y-1.5 text-xs shrink-0">
                  <div className="flex justify-between text-slate-500"><span>Sous-total</span><span>{formatPrice(subtotal)}</span></div>
                  <div className="flex justify-between text-slate-500"><span>TVA (19%)</span><span>{formatPrice(vat)}</span></div>
                  <div className="flex justify-between font-bold text-base text-slate-900 dark:text-white border-t border-slate-100 dark:border-white/10 pt-2 mt-1"><span>Total</span><span>{formatPrice(total)}</span></div>
                </div>

                {/* Customer Info */}
                <div className="mt-4 shrink-0 border-t border-slate-100 dark:border-white/10 pt-3">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Nom du client (Optionnel)</label>
                  <input 
                    type="text" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Client Passager"
                    className="input-field w-full text-sm py-2 bg-slate-50 dark:bg-brand-900/40 border-slate-200 dark:border-white/10"
                  />
                </div>

                <button onClick={() => setShowCheckout(true)} className="btn-primary w-full mt-3 py-3 text-sm shrink-0">
                  Encaisser {formatPrice(total)}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Option Selection Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedProduct(null)} />
          <div className="relative glass-card w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white pr-8">
                Configurer: {selectedProduct.name}
              </h2>
              <button onClick={() => setSelectedProduct(null)} className="p-2 rounded-lg glass absolute top-4 right-4"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-6">
              {selectedProduct.product_options?.map((opt) => (
                <div key={opt.id}>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    {opt.name}
                    {opt.required && <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-error-500/10 text-error-600">Requis</span>}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {opt.option_values.map((val) => {
                      const isSelected = selectedOptions[opt.id]?.value === val.value;
                      return (
                        <button
                          key={val.id}
                          onClick={() => {
                            if (!opt.required && isSelected) {
                              // Toggle off if not required
                              const newOpts = { ...selectedOptions };
                              delete newOpts[opt.id];
                              setSelectedOptions(newOpts);
                            } else {
                              setSelectedOptions({
                                ...selectedOptions,
                                [opt.id]: { value: val.value, price_modifier: val.price_modifier },
                              });
                            }
                          }}
                          className={`p-3 text-left rounded-xl border-2 transition-all ${
                            isSelected 
                              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/40' 
                              : 'border-slate-200 dark:border-white/10 glass hover:border-brand-300 dark:hover:border-brand-700'
                          }`}
                        >
                          <div className="flex justify-between items-center gap-2">
                            <span className={`text-xs font-semibold ${isSelected ? 'text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-300'}`}>
                              {val.value}
                            </span>
                            {val.price_modifier > 0 && (
                              <span className="text-[10px] font-bold text-slate-500 shrink-0">+{formatPrice(val.price_modifier)}</span>
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
                className="btn-primary w-full py-3"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter au ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout confirmation */}
      {showCheckout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCheckout(false)} />
          <div className="relative glass-card w-full max-w-md p-6 text-center">
            <button onClick={() => setShowCheckout(false)} className="absolute top-4 right-4 p-2 rounded-lg glass"><X className="w-5 h-5" /></button>
            <h2 className="font-display font-bold text-2xl text-slate-900 dark:text-white mb-2">Validation</h2>
            <p className="text-slate-500 text-sm mb-6">Montant total à encaisser</p>
            <p className="font-display font-extrabold text-5xl text-brand-600 dark:text-brand-400 mb-6 tracking-tight">{formatPrice(total)}</p>
            
            <div className="bg-slate-50 dark:bg-brand-900/20 rounded-xl p-4 mb-6">
              <div className="text-sm text-slate-500 mb-1">Client</div>
              <div className="font-bold text-slate-900 dark:text-white">
                {customerName.trim() || 'Client Passager'}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={checkout} className="btn-primary flex-1 py-3"><Check className="w-5 h-5 mr-2" /> Confirmer l'encaissement</button>
            </div>
          </div>
        </div>
      )}

      {/* Print document modal */}
      {printDoc && (
        <div className="fixed inset-0 z-[62] bg-white overflow-y-auto animate-fade-in">
          <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between print:hidden">
            <div className="flex items-center gap-3">
              <button onClick={() => setPrintDoc(null)} className="flex items-center gap-2 px-4 py-2 rounded-xl glass hover:bg-slate-50 transition-all text-sm font-medium">
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
