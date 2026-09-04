import { useState, useEffect } from 'react';
import { Building2, User, ArrowLeft, ArrowRight, Check, FileText, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useRouter } from '@/context/RouterContext';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import { toast } from 'react-hot-toast';

const SHIPPING = 7;
const VAT_RATE = 0.19;

const t = {
  fr: {
    fullName: "Nom complet", phone: "Téléphone", email: "Email", address: "Adresse", city: "Ville", postalCode: "Code postal", country: "Pays", notes: "Notes (optionnel)",
    companyName: "Raison sociale", taxId: "Matricule fiscal", vatNumber: "TVA", rcNumber: "Registre commerce", contactPerson: "Personne à contacter",
    phFullName: "Karim Ben Salah", phPhone: "+216 22 000 000", phEmail: "email@exemple.com", phAddress: "Rue, numéro", phCity: "Tunis", phPostalCode: "1000",
    phCompanyName: "Société XYZ SARL", phTaxId: "0000000A", phVatNumber: "0000000", phRcNumber: "B0000000", phContactPerson: "Nom du contact", phNotes: "Instructions de livraison..."
  },
  ar: {
    fullName: "الاسم الكامل", phone: "رقم الهاتف", email: "البريد الإلكتروني", address: "العنوان", city: "المدينة", postalCode: "الرمز البريدي", country: "البلد", notes: "ملاحظات (اختياري)",
    companyName: "اسم الشركة", taxId: "المعرف الجبائي", vatNumber: "الأداء على القيمة المضافة", rcNumber: "السجل التجاري", contactPerson: "جهة الاتصال",
    phFullName: "كريم بن صالح", phPhone: "+216 22 000 000", phEmail: "email@exemple.com", phAddress: "الشارع، الرقم", phCity: "تونس", phPostalCode: "1000",
    phCompanyName: "شركة XYZ", phTaxId: "0000000A", phVatNumber: "0000000", phRcNumber: "B0000000", phContactPerson: "اسم المسؤول", phNotes: "تعليمات التوصيل، معلومات إضافية..."
  }
};

export default function CheckoutPage() {
  const { items, subtotal, clear, count } = useCart();
  const { query, navigate } = useRouter();
  const [type, setType] = useState<'order' | 'quote'>(query.get('type') === 'quote' ? 'quote' : 'order');
  const [customerType, setCustomerType] = useState<'individual' | 'company'>('individual');
  const [lang, setLang] = useState<'fr' | 'ar'>('fr');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [waUrl, setWaUrl] = useState<string>('');

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', address: '', city: '', postalCode: '', country: 'Tunisie', notes: '',
    companyName: '', taxId: '', vatNumber: '', rcNumber: '', contactPerson: '',
  });

  const [whatsappPhone, setWhatsappPhone] = useState('+216 71 000 000');
  useEffect(() => {
    supabase.from('site_settings').select('phone').limit(1).then(({ data }) => {
      if (data && data[0]) setWhatsappPhone(data[0].phone);
    });
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const fodec = subtotal * 0.01;
  const vat = (subtotal + fodec) * VAT_RATE;
  const timbre = subtotal > 0 ? 1 : 0; // 1 DT

  let baseTotal = subtotal + fodec + vat + timbre;
  const ras = baseTotal * 0.01; // 1% of TTC
  const total = baseTotal + ras;

  const handleSubmit = async () => {
    // Basic validation
    if (customerType === 'individual') {
      if (!form.fullName || !form.phone || !form.address) {
        toast.error(lang === 'fr' ? 'Veuillez remplir tous les champs obligatoires' : 'الرجاء ملء جميع الحقول الإجبارية');
        return;
      }
    } else {
      if (!form.companyName || !form.taxId || !form.address || !form.contactPerson || !form.phone) {
        toast.error(lang === 'fr' ? 'Veuillez remplir tous les champs obligatoires' : 'الرجاء ملء جميع الحقول الإجبارية');
        return;
      }
    }

    setSubmitting(true);

    // Prepare WhatsApp text
    let clientInfoText = '';
    if (customerType === 'individual') {
      clientInfoText = `*Client :* ${form.fullName}
*Tél :* ${form.phone}
*Adresse :* ${form.address}, ${form.city}`;
    } else {
      clientInfoText = `*Société :* ${form.companyName} (MF: ${form.taxId})
*Tél :* ${form.phone}
*Adresse :* ${form.address}, ${form.city}`;
    }

    const wText = `Bonjour, voici ma demande de ${type === 'quote' ? 'devis' : 'commande'} :

${clientInfoText}

*Produits sélectionnés :*
${items.map(i => {
      const opts = i.options && i.options.length ? `\n  - Options : ${i.options.map(o => `${o.option} : ${o.value}`).join(' | ')}` : '';
      return `- ${i.quantity}x ${i.name}${opts}`;
    }).join('\n')}

Merci pour votre confiance.`;

    const cleanPhone = whatsappPhone.replace(/\D/g, '');
    const generatedWaUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(wText)}`;
    setWaUrl(generatedWaUrl);

    // Open WhatsApp synchronously to bypass popup blockers completely
    try {
      window.open(generatedWaUrl, '_blank');
    } catch (e) {
      console.error('Popup blocked', e);
    }

    const newOrderId = crypto.randomUUID();
    const orderData = {
      id: newOrderId,
      customer_type: customerType,
      status: 'pending',
      type,
      subtotal,
      vat,
      shipping: 0,
      total,
      notes: form.notes || null,
      customer_info: form,
      expires_at: type === 'quote' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
    };

    const { error } = await supabase.from('orders').insert(orderData);
    if (error) {
      console.error(error);
      toast.error('La sauvegarde de la commande a échoué, mais WhatsApp devrait s\'ouvrir.');
      setSubmitting(false);
      return;
    }

    const itemRows = items.map((i) => ({
      order_id: newOrderId,
      product_id: i.productId,
      product_name: i.name,
      quantity: i.quantity,
      unit_price: i.unitPrice,
      options_snapshot: i.options,
    }));

    try {
      await supabase.from('order_items').insert(itemRows);
    } catch (e) {
      console.error(e);
    }

    setOrderId(newOrderId);
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

        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mb-4 w-full sm:w-auto inline-flex"
            style={{ backgroundColor: '#25D366' }}
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Envoyer sur WhatsApp
          </a>
        )}
        <br />
        <button onClick={() => navigate('/')} className="btn-ghost">Retour à l'accueil</button>
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
            <div className="flex justify-end mb-4">
              <div className="inline-flex bg-slate-100 dark:bg-brand-900/40 rounded-lg p-1">
                <button
                  onClick={() => setLang('fr')}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${lang === 'fr' ? 'bg-white dark:bg-brand-700 shadow-sm text-brand-600 dark:text-white' : 'text-slate-500'}`}
                >
                  Français
                </button>
                <button
                  onClick={() => setLang('ar')}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${lang === 'ar' ? 'bg-white dark:bg-brand-700 shadow-sm text-brand-600 dark:text-white' : 'text-slate-500'}`}
                >
                  العربية
                </button>
              </div>
            </div>

            <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className={lang === 'ar' ? 'text-right font-arabic' : ''}>
              {customerType === 'individual' ? (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label={t[lang].fullName} value={form.fullName} onChange={(v) => set('fullName', v)} placeholder={t[lang].phFullName} rtl={lang === 'ar'} required />
                    <Field label={t[lang].phone} value={form.phone} onChange={(v) => set('phone', v)} placeholder={t[lang].phPhone} rtl={lang === 'ar'} required />
                  </div>
                  <Field label={t[lang].email} value={form.email} onChange={(v) => set('email', v)} placeholder={t[lang].phEmail} type="email" rtl={lang === 'ar'} />
                  <Field label={t[lang].address} value={form.address} onChange={(v) => set('address', v)} placeholder={t[lang].phAddress} rtl={lang === 'ar'} required />
                  <div className="grid sm:grid-cols-3 gap-4">
                    <Field label={t[lang].city} value={form.city} onChange={(v) => set('city', v)} placeholder={t[lang].phCity} rtl={lang === 'ar'} />
                    <Field label={t[lang].postalCode} value={form.postalCode} onChange={(v) => set('postalCode', v)} placeholder={t[lang].phPostalCode} rtl={lang === 'ar'} />
                    <Field label={t[lang].country} value={form.country} onChange={(v) => set('country', v)} rtl={lang === 'ar'} />
                  </div>
                </>
              ) : (
                <>
                  <Field label={t[lang].companyName} value={form.companyName} onChange={(v) => set('companyName', v)} placeholder={t[lang].phCompanyName} rtl={lang === 'ar'} required />
                  <div className="grid sm:grid-cols-3 gap-4">
                    <Field label={t[lang].taxId} value={form.taxId} onChange={(v) => set('taxId', v)} placeholder={t[lang].phTaxId} rtl={lang === 'ar'} required />
                    <Field label={t[lang].vatNumber} value={form.vatNumber} onChange={(v) => set('vatNumber', v)} placeholder={t[lang].phVatNumber} rtl={lang === 'ar'} />
                    <Field label={t[lang].rcNumber} value={form.rcNumber} onChange={(v) => set('rcNumber', v)} placeholder={t[lang].phRcNumber} rtl={lang === 'ar'} />
                  </div>
                  <Field label={t[lang].address} value={form.address} onChange={(v) => set('address', v)} placeholder={t[lang].phAddress} rtl={lang === 'ar'} required />
                  <div className="grid sm:grid-cols-3 gap-4">
                    <Field label={t[lang].city} value={form.city} onChange={(v) => set('city', v)} placeholder={t[lang].phCity} rtl={lang === 'ar'} />
                    <Field label={t[lang].postalCode} value={form.postalCode} onChange={(v) => set('postalCode', v)} placeholder={t[lang].phPostalCode} rtl={lang === 'ar'} />
                    <Field label={t[lang].country} value={form.country} onChange={(v) => set('country', v)} rtl={lang === 'ar'} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label={t[lang].contactPerson} value={form.contactPerson} onChange={(v) => set('contactPerson', v)} placeholder={t[lang].phContactPerson} rtl={lang === 'ar'} required />
                    <Field label={t[lang].phone} value={form.phone} onChange={(v) => set('phone', v)} placeholder={t[lang].phPhone} rtl={lang === 'ar'} required />
                  </div>
                  <Field label={t[lang].email} value={form.email} onChange={(v) => set('email', v)} placeholder={t[lang].phEmail} type="email" rtl={lang === 'ar'} />
                </>
              )}
              <div className="mt-4">
                <label className={`text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block ${lang === 'ar' ? 'text-right' : ''}`}>{t[lang].notes}</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  rows={3}
                  placeholder={t[lang].phNotes}
                  className={`input-field resize-none ${lang === 'ar' ? 'text-right placeholder:text-right' : ''}`}
                />
              </div>

              {/* Order Type Radio - Modern Style */}
              <div className={`mt-8 pt-6 border-t border-slate-100 dark:border-white/10 ${lang === 'ar' ? 'text-right' : ''}`}>
                <label className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-4 block">
                  {lang === 'fr' ? 'Type de demande' : 'نوع الطلب'}
                </label>
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${lang === 'ar' ? 'sm:flex-row-reverse' : ''}`}>

                  {/* Option: Commande */}
                  <label className="cursor-pointer group relative">
                    <input
                      type="radio"
                      name="orderType"
                      value="order"
                      checked={type === 'order'}
                      onChange={() => setType('order')}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${lang === 'ar' ? 'flex-row-reverse' : ''} ${type === 'order'
                        ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/30 shadow-md shadow-brand-500/10'
                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-transparent hover:border-brand-300 dark:hover:border-brand-700 hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${type === 'order' ? 'bg-brand-500 text-white' : 'bg-slate-100 dark:bg-brand-900/40 text-slate-500'
                        }`}>
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                        <div className={`font-bold text-sm ${type === 'order' ? 'text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-300'}`}>
                          {lang === 'fr' ? 'Commande' : 'طلب شراء'}
                        </div>
                        <div className={`text-xs mt-0.5 ${type === 'order' ? 'text-brand-600/80 dark:text-brand-400/80' : 'text-slate-500'}`}>
                          {lang === 'fr' ? 'Achat immédiat' : 'شراء فوري'}
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* Option: Devis */}
                  <label className="cursor-pointer group relative">
                    <input
                      type="radio"
                      name="orderType"
                      value="quote"
                      checked={type === 'quote'}
                      onChange={() => setType('quote')}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${lang === 'ar' ? 'flex-row-reverse' : ''} ${type === 'quote'
                        ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/30 shadow-md shadow-brand-500/10'
                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-transparent hover:border-brand-300 dark:hover:border-brand-700 hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${type === 'quote' ? 'bg-brand-500 text-white' : 'bg-slate-100 dark:bg-brand-900/40 text-slate-500'
                        }`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
                        <div className={`font-bold text-sm ${type === 'quote' ? 'text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-300'}`}>
                          {lang === 'fr' ? 'Devis' : 'عرض سعر'}
                        </div>
                        <div className={`text-xs mt-0.5 ${type === 'quote' ? 'text-brand-600/80 dark:text-brand-400/80' : 'text-slate-500'}`}>
                          {lang === 'fr' ? 'Demander un prix' : 'طلب تسعيرة'}
                        </div>
                      </div>
                    </div>
                  </label>

                </div>
              </div>
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
                    {i.image && <img src={i.image} alt="" className="w-full h-full object-contain" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">{i.name}</p>
                    <p className="text-xs text-slate-500">x{i.quantity}</p>
                  </div>
                </div>
              ))}
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

function Field({ label, value, onChange, placeholder, type = 'text', rtl = false, required = false }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; rtl?: boolean; required?: boolean }) {
  return (
    <div className="mb-4">
      <label className={`text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block ${rtl ? 'text-right' : ''}`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`input-field ${rtl ? 'text-right placeholder:text-right' : ''}`} />
    </div>
  );
}
