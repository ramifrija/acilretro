import type { Order, OrderItem } from '@/types/database';
import { formatPrice, formatDate } from '@/lib/format';

type Props = {
  order: Order & { order_items: OrderItem[] };
  documentType: 'invoice' | 'quote';
};

const COMPANY = {
  name: 'ACIL RETRO',
  tagline: 'Pièces Auto Premium',
  address: 'Zone Industrielle, Rue 12, Tunis, Tunisie',
  phone: '+216 71 000 000',
  email: 'contact@acilretro.com',
  taxId: '0000000A',
  rc: 'B0000000',
  vatNumber: '0000000',
};

export default function PrintableDocument({ order, documentType }: Props) {
  const isInvoice = documentType === 'invoice';
  const docNumber = order.id.slice(0, 8).toUpperCase();
  const docLabel = isInvoice ? 'FACTURE' : 'DEVIS';
  const docPrefix = isInvoice ? 'FAC' : 'DEV';

  return (
    <div id="printable-document" className="bg-white text-slate-900 p-8 lg:p-12 max-w-4xl mx-auto" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-10 pb-6 border-b-2 border-brand-900">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #050f33 0%, #1a38b8 100%)' }}>
            <span className="text-white font-extrabold text-2xl">A</span>
          </div>
          <div>
            <div className="font-extrabold text-2xl text-brand-950">{COMPANY.name}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">{COMPANY.tagline}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="inline-block px-4 py-1.5 rounded-lg text-white font-bold text-lg" style={{ background: isInvoice ? '#0a1f5c' : '#d97706' }}>
            {docLabel}
          </div>
          <div className="text-sm text-slate-600 mt-2">N° {docPrefix}-{docNumber}</div>
          <div className="text-xs text-slate-500 mt-1">Date: {formatDate(order.created_at)}</div>
          {isInvoice ? (
            <div className="text-xs text-slate-500">Échéance: {formatDate(new Date(Date.now() + 15 * 86400000).toISOString())}</div>
          ) : (
            order.expires_at && <div className="text-xs text-slate-500">Valable jusqu'au: {formatDate(order.expires_at)}</div>
          )}
        </div>
      </div>

      {/* From / To */}
      <div className="grid grid-cols-2 gap-6 mb-10">
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Émetteur</div>
          <div className="text-sm font-bold text-slate-900">{COMPANY.name}</div>
          <div className="text-xs text-slate-600 mt-1 leading-relaxed">
            {COMPANY.address}<br />
            Tél: {COMPANY.phone}<br />
            Email: {COMPANY.email}<br />
            MF: {COMPANY.taxId}<br />
            RC: {COMPANY.rc}<br />
            TVA: {COMPANY.vatNumber}
          </div>
        </div>
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Client</div>
          <div className="text-sm font-bold text-slate-900">
            {order.customer_type === 'company' ? 'Entreprise' : 'Particulier'}
          </div>
          <div className="text-xs text-slate-600 mt-1 leading-relaxed">
            Type: {order.customer_type === 'company' ? 'Entreprise (B2B)' : 'Particulier (B2C)'}<br />
            {order.notes && <span className="block mt-1">Note: {order.notes}</span>}
          </div>
        </div>
      </div>

      {/* Items table */}
      <table className="w-full text-sm mb-8" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#0a1f5c', color: 'white' }}>
            <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide rounded-l-lg">Désignation</th>
            <th className="text-center py-3 px-4 font-semibold text-xs uppercase tracking-wide">Qté</th>
            <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wide">P.U. HT</th>
            <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wide rounded-r-lg">Total HT</th>
          </tr>
        </thead>
        <tbody>
          {order.order_items.map((item, idx) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td className="py-3 px-4">
                <div className="font-medium text-slate-900">{item.product_name}</div>
                {item.options_snapshot && Array.isArray(item.options_snapshot) && item.options_snapshot.length > 0 && (
                  <div className="text-xs text-slate-500 mt-1">
                    {item.options_snapshot.map((o) => `${o.option}: ${o.value}`).join(' · ')}
                  </div>
                )}
              </td>
              <td className="py-3 px-4 text-center text-slate-700">{item.quantity}</td>
              <td className="py-3 px-4 text-right text-slate-700">{formatPrice(Number(item.unit_price))}</td>
              <td className="py-3 px-4 text-right font-semibold text-slate-900">{formatPrice(Number(item.unit_price) * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-10">
        <div className="w-72 space-y-2">
          <div className="flex justify-between text-sm text-slate-600 py-1">
            <span>Sous-total HT</span>
            <span className="font-medium">{formatPrice(Number(order.subtotal))}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600 py-1">
            <span>TVA (19%)</span>
            <span className="font-medium">{formatPrice(Number(order.vat))}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600 py-1">
            <span>Livraison</span>
            <span className="font-medium">{formatPrice(Number(order.shipping))}</span>
          </div>
          <div className="flex justify-between py-3 px-4 rounded-lg text-white font-bold" style={{ background: '#0a1f5c' }}>
            <span>Total TTC</span>
            <span>{formatPrice(Number(order.total))}</span>
          </div>
        </div>
      </div>

      {/* Payment info */}
      {isInvoice && (
        <div className="mb-8 p-4 rounded-xl" style={{ background: '#f1f5f9' }}>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Informations de paiement</div>
          <div className="text-xs text-slate-600 leading-relaxed">
            Virement bancaire: ACIL RETRO - Banque: BNA - RIB: 12 345 678 901 234 567 890 123<br />
            Chèque à l'ordre de: ACIL RETRO<br />
            Paiement en espèces à notre siège<br />
            <span className="block mt-2 text-slate-500">Règlement sous 15 jours. Passé ce délai, des pénalités de retard de 1% par mois seront appliquées.</span>
          </div>
        </div>
      )}

      {!isInvoice && (
        <div className="mb-8 p-4 rounded-xl" style={{ background: '#fffbeb' }}>
          <div className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Conditions du devis</div>
          <div className="text-xs text-amber-700 leading-relaxed">
            Ce devis est valable 30 jours à compter de la date d'émission.<br />
            Les prix indiqués sont en TND (Dinar Tunisien) et incluent la TVA.<br />
            <span className="block mt-2">Pour accepter ce devis, veuillez nous contacter par téléphone ou email. La commande sera confirmée après validation.</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-6 border-t-2 border-slate-100 text-center">
        <div className="text-sm font-bold text-slate-900 mb-1">{COMPANY.name}</div>
        <div className="text-xs text-slate-500">
          {COMPANY.address} · Tél: {COMPANY.phone} · {COMPANY.email}<br />
          MF: {COMPANY.taxId} · RC: {COMPANY.rc} · TVA: {COMPANY.vatNumber}<br />
          <span className="block mt-2 text-slate-400">Merci de votre confiance</span>
        </div>
      </div>
    </div>
  );
}
