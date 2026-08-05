import { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, X, Check } from 'lucide-react';
import { useCart, optionsKey } from '@/context/CartContext';
import { useRouter } from '@/context/RouterContext';
import { formatPrice } from '@/lib/format';

const SHIPPING = 7;
const VAT_RATE = 0.19;

export default function CartPage() {
  const { items, removeItem, updateQty, subtotal, count } = useCart();
  const { navigate } = useRouter();
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<number | null>(null);
  const [promoError, setPromoError] = useState('');

  const applyPromo = () => {
    const codes: Record<string, number> = { ACIL10: 0.1, RETRO20: 0.2 };
    const discount = codes[promoCode.toUpperCase()];
    if (discount) {
      setAppliedPromo(discount);
      setPromoError('');
    } else {
      setPromoError('Code promo invalide');
      setAppliedPromo(null);
    }
  };

  const discount = appliedPromo ? subtotal * appliedPromo : 0;
  const afterDiscount = subtotal - discount;
  const vat = afterDiscount * VAT_RATE;
  const timbre = subtotal > 0 ? 1 : 0;
  const ras = (afterDiscount + vat + timbre) * 0.01;
  const total = afterDiscount + vat + timbre + ras;

  if (count === 0) {
    return (
      <div className="container-x py-20 text-center animate-fade-in">
        <div className="w-24 h-24 rounded-3xl glass flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-12 h-12 text-slate-300" />
        </div>
        <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">Votre panier est vide</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">Découvrez nos produits et ajoutez-les à votre panier</p>
        <button onClick={() => navigate('/catalog')} className="btn-primary">
          Explorer le catalogue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="container-x py-8 animate-fade-in">
      <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white mb-8">Mon panier ({count})</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const key = optionsKey(item.options);
            return (
              <div key={`${item.productId}-${key}`} className="glass-card p-4 flex gap-4">
                <button onClick={() => navigate(`/product/${item.slug}`)} className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-brand-900/30">
                  {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <ShoppingBag className="w-full h-full p-8 text-slate-300" />}
                </button>
                <div className="flex-1 min-w-0">
                  <button onClick={() => navigate(`/product/${item.slug}`)} className="font-semibold text-slate-900 dark:text-white hover:text-brand-500 transition-colors text-left line-clamp-2">
                    {item.name}
                  </button>
                  {item.options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {item.options.map((o, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-lg glass text-slate-600 dark:text-slate-300">
                          {o.option}: {o.value}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center glass rounded-lg">
                      <button onClick={() => updateQty(item.productId, key, item.quantity - 1)} className="px-3 py-2 text-slate-500 hover:text-brand-500"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="px-3 text-sm font-semibold text-slate-900 dark:text-white">{item.quantity}</span>
                      <button onClick={() => updateQty(item.productId, key, item.quantity + 1)} className="px-3 py-2 text-slate-500 hover:text-brand-500"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="flex items-center gap-6">
                      <button onClick={() => removeItem(item.productId, key)} className="p-2 rounded-lg text-slate-400 hover:text-error-500 hover:bg-error-500/10 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 sticky top-24">
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-4">Récapitulatif</h3>





            <div className="flex flex-col gap-3 mt-6">
              <button onClick={() => navigate('/checkout?type=order')} className="btn-primary w-full">
                Commander <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => navigate('/checkout?type=quote')} className="btn-ghost w-full">
                Demander un devis
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


