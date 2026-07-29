import { useState } from 'react';
import { Building2, User, ArrowLeft, ArrowRight, Check, FileText, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useRouter } from '@/context/RouterContext';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';

const SHIPPING = 7;
const VAT_RATE = 0.19;

export default function CheckoutPage() {
  const { items, subtotal, clear, count } = useCart();
  const { query, navigate } = useRouter();
  const [type, setType] = useState<'order' | 'quote'>(query.get('type') === 'quote' ? 'quote' : 'order');
  const [customerType, setCustomerType] = useState<'individual' | 'company'>('individual');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string>('');

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', address: '', city: '', postalCode: '', country: 'Tunisie', notes: '',
    companyName: '', taxId: '', vatNumber: '', rcNumber: '', contactPerson: '',
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const vat = subtotal * VAT_RATE;
  const shipping = subtotal > 0 ? SHIPPING : 0;
  const total = subtotal + vat + shipping;

  const handleSubmit = async () => {
    setSubmitting(true);
    const orderData = {
      customer_type: customerType,
      status: 'pending',
      type,
      subtotal,
      vat,
      shipping,
      total,
      notes: form.notes || null,
      customer_info: form,
      expires_at: type === 'quote' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
    };

    const { data: order, error } = await supabase.from('orders').insert(orderData).select().single();
    if (error || !order) {
      setSubmitting(false);
      return;
    }

    const itemRows = items.map((i) => ({
      order_id: order.id,
      product_id: i.productId,
      product_name: i.name,
      quantity: i.quantity,
      unit_price: i.unitPrice,
      options_snapshot: i.options,
    }));
    await supabase.from('order_items').insert(itemRows);

    setOrderId(order.id);
    setSuccess(true);
    clear();
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="container-x py-20 text-center animate-fade-in">
        <div className="w-24 h-24 rounded-3xl bg-success-500/20 flex items-center justify-center mx-auto mb-6 animate-scale-in">
          <Check className="w-12 h-12 text-success-600" />
        </div>
        <h2 className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">
          {type === 'quote' ? 'Demande de devis envoyée!' : 'Commande passée avec succès!'}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 mb-2">
          {type === 'quote'
            ? 'Notre équipe va préparer votre devis et vous contacter sous 24-48h.'
            : 'Merci ! Nous avons bien reçu votre commande. Notre équipe va vous appeler dans les plus brefs délais pour la confirmer.'}
        </p>
        <p className="text-xs text-slate-400 mb-6">Référence: {orderId.slice(0, 8).toUpperCase()}</p>
        <button onClick={() => navigate('/')} className="btn-primary">Retour à l'accueil</button>
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="container-x py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="font-bold text-xl text-slate-900 dark:text-white">Panier vide</h2>
        <button onClick={() => navigate('/catalog')} className="btn-primary mt-4">Voir le catalogue</button>
      </div>
    );
  }

  return (
    <div className="container-x py-8 animate-fade-in">
      <button onClick={() => navigate('/cart')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand-500 mb-6">
        <ArrowLeft className="w-4 h-4" /> Retour au panier
      </button>

      <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white mb-8">
        {type === 'quote' ? 'Demander un devis' : 'Finaliser la commande'}
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Order type toggle */}
          <div className="glass-card p-5">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">Type de demande</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setType('order')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${type === 'order' ? 'border-brand-500 bg-brand-50 dark:bg-brand-800/40' : 'border-slate-200 dark:border-white/10 glass'}`}
              >
                <ShoppingBag className={`w-5 h-5 mb-2 ${type === 'order' ? 'text-brand-500' : 'text-slate-400'}`} />
                <div className="font-semibold text-sm text-slate-900 dark:text-white">Commande</div>
                <div className="text-xs text-slate-500 mt-0.5">Achat immédiat</div>
              </button>
              <button
                onClick={() => setType('quote')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${type === 'quote' ? 'border-brand-500 bg-brand-50 dark:bg-brand-800/40' : 'border-slate-200 dark:border-white/10 glass'}`}
              >
                <FileText className={`w-5 h-5 mb-2 ${type === 'quote' ? 'text-brand-500' : 'text-slate-400'}`} />
                <div className="font-semibold text-sm text-slate-900 dark:text-white">Devis</div>
                <div className="text-xs text-slate-500 mt-0.5">Demander un prix</div>
              </button>
            </div>
          </div>

          {/* Customer type toggle */}
          <div className="glass-card p-5">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">Vous êtes</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setCustomerType('individual')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${customerType === 'individual' ? 'border-brand-500 bg-brand-50 dark:bg-brand-800/40' : 'border-slate-200 dark:border-white/10 glass'}`}
              >
                <User className={`w-5 h-5 mb-2 ${customerType === 'individual' ? 'text-brand-500' : 'text-slate-400'}`} />
                <div className="font-semibold text-sm text-slate-900 dark:text-white">Particulier</div>
              </button>
              <button
                onClick={() => setCustomerType('company')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${customerType === 'company' ? 'border-brand-500 bg-brand-50 dark:bg-brand-800/40' : 'border-slate-200 dark:border-white/10 glass'}`}
              >
                <Building2 className={`w-5 h-5 mb-2 ${customerType === 'company' ? 'text-brand-500' : 'text-slate-400'}`} />
                <div className="font-semibold text-sm text-slate-900 dark:text-white">Entreprise</div>
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="glass-card p-6 space-y-4 animate-fade-in" key={customerType}>
            {customerType === 'individual' ? (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Nom complet" value={form.fullName} onChange={(v) => set('fullName', v)} placeholder="Karim Ben Salah" />
                  <Field label="Téléphone" value={form.phone} onChange={(v) => set('phone', v)} placeholder="+216 22 000 000" />
                </div>
                <Field label="Email" value={form.email} onChange={(v) => set('email', v)} placeholder="email@exemple.com" type="email" />
                <Field label="Adresse" value={form.address} onChange={(v) => set('address', v)} placeholder="Rue, numéro" />
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="Ville" value={form.city} onChange={(v) => set('city', v)} placeholder="Tunis" />
                  <Field label="Code postal" value={form.postalCode} onChange={(v) => set('postalCode', v)} placeholder="1000" />
                  <Field label="Pays" value={form.country} onChange={(v) => set('country', v)} />
                </div>
              </>
            ) : (
              <>
                <Field label="Raison sociale" value={form.companyName} onChange={(v) => set('companyName', v)} placeholder="Société XYZ SARL" />
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="Matricule fiscal" value={form.taxId} onChange={(v) => set('taxId', v)} placeholder="0000000A" />
                  <Field label="TVA" value={form.vatNumber} onChange={(v) => set('vatNumber', v)} placeholder="0000000" />
                  <Field label="Registre commerce" value={form.rcNumber} onChange={(v) => set('rcNumber', v)} placeholder="B0000000" />
                </div>
                <Field label="Adresse" value={form.address} onChange={(v) => set('address', v)} placeholder="Adresse de l'entreprise" />
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="Ville" value={form.city} onChange={(v) => set('city', v)} placeholder="Tunis" />
                  <Field label="Code postal" value={form.postalCode} onChange={(v) => set('postalCode', v)} placeholder="1000" />
                  <Field label="Pays" value={form.country} onChange={(v) => set('country', v)} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Personne à contacter" value={form.contactPerson} onChange={(v) => set('contactPerson', v)} placeholder="Nom du contact" />
                  <Field label="Téléphone" value={form.phone} onChange={(v) => set('phone', v)} placeholder="+216 22 000 000" />
                </div>
                <Field label="Email" value={form.email} onChange={(v) => set('email', v)} placeholder="contact@societe.com" type="email" />
              </>
            )}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Notes (optionnel)</label>
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={3}
                placeholder="Instructions de livraison, informations complémentaires..."
                className="input-field resize-none"
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="glass-card p-6 sticky top-24">
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-4">Votre {type === 'quote' ? 'devis' : 'commande'}</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
              {items.map((i, idx) => (
                <div key={idx} className="flex gap-3 text-sm">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-brand-900/30 shrink-0">
                    {i.image && <img src={i.image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">{i.name}</p>
                    <p className="text-xs text-slate-500">x{i.quantity}</p>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">{formatPrice(i.unitPrice * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm border-t border-slate-100 dark:border-white/10 pt-4">
              <div className="flex justify-between text-slate-600 dark:text-slate-300"><span>Sous-total</span><span className="font-semibold">{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300"><span>TVA (19%)</span><span className="font-semibold">{formatPrice(vat)}</span></div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300"><span>Livraison</span><span className="font-semibold">{formatPrice(shipping)}</span></div>
            </div>
            <div className="flex justify-between items-baseline border-t border-slate-100 dark:border-white/10 pt-4 mt-4">
              <span className="font-display font-bold text-lg">Total</span>
              <span className="font-display font-extrabold text-2xl text-brand-700 dark:text-brand-200">{formatPrice(total)}</span>
            </div>
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full mt-6">
              {submitting ? 'Envoi en cours...' : (
                <>
                  {type === 'quote' ? 'Demander le devis' : 'Confirmer la commande'} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input-field" />
    </div>
  );
}
