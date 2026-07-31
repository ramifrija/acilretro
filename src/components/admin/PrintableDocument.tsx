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
  website: 'www.acilretro.tn',
  taxId: '0000000A',
  rc: 'B0000000',
  vatNumber: '0000000',
  bank: 'BNA',
  rib: '12 345 678 901 234 567 89 01',
  iban: 'TN59 1234 5678 9012 3456 7890 1234'
};

export default function PrintableDocument({ order, documentType }: Props) {
  const isInvoice = documentType === 'invoice';
  const docNumber = order.id.slice(0, 8).toUpperCase();
  const docLabel = isInvoice ? 'Facture' : 'Devis';
  
  const customerInfo = order.customer_info as any || {};
  const customerName = customerInfo.fullName || (order.customer_type === 'company' ? 'Entreprise' : 'Client Passager');
  
  const ras = (Number(order.subtotal) + Number(order.vat) + 1) * 0.01;

  return (
    <div id="printable-document" className="bg-white text-slate-900 p-8 lg:p-12 max-w-4xl mx-auto text-[15px]" style={{ fontFamily: 'Arial, sans-serif' }}>
      
      {/* Top Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-20 h-20">
              <img src="/images/acil_logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="font-extrabold text-2xl text-brand-900">{COMPANY.name}</div>
          </div>
          <div className="text-slate-600 leading-snug">
            {COMPANY.address.split(',').map((line, i) => (
              <div key={i}>{line.trim()}</div>
            ))}
          </div>
        </div>
        <div className="text-right">
          <h1 className="font-bold text-2xl text-slate-900">{docLabel} No. {docNumber}</h1>
        </div>
      </div>

      {/* Middle Information Section */}
      <div className="flex gap-8 mb-8">
        {/* Info Box */}
        <div className="w-1/2 bg-slate-100 p-4 rounded text-slate-800">
          <div className="grid grid-cols-[140px_1fr] gap-y-1">
            <div className="font-semibold text-right pr-4">Date de la {docLabel.toLowerCase()}</div>
            <div>{formatDate(order.created_at)}</div>
            
            <div className="font-semibold text-right pr-4">Référence</div>
            <div>{docNumber}</div>
            
            <div className="font-semibold text-right pr-4">Numéro de client</div>
            <div>{order.client_id ? order.client_id.slice(0, 8).toUpperCase() : '-'}</div>
            
            {isInvoice && (
              <>
                <div className="font-semibold text-right pr-4">Paiement dû</div>
                <div>{formatDate(new Date(Date.now() + 15 * 86400000).toISOString())}</div>
                <div className="font-semibold text-right pr-4">Modalité de paiement</div>
                <div>15 jours</div>
              </>
            )}
            
            <div className="font-semibold text-right pr-4">Emis par</div>
            <div>{COMPANY.name}</div>
            
            <div className="font-semibold text-right pr-4">Contact client</div>
            <div>{customerInfo.phone || '-'}</div>
            
            <div className="font-semibold text-right pr-4">Date de vente</div>
            <div>{formatDate(order.created_at)}</div>
          </div>
        </div>

        {/* Destinataire */}
        <div className="w-1/2 pt-2">
          <div className="font-bold text-sm mb-1 text-slate-900">Destinataire :</div>
          <div className="text-slate-800 leading-relaxed">
            {customerInfo.companyName && <div className="font-semibold">{customerInfo.companyName}</div>}
            <div>{customerName}</div>
            {customerInfo.address && <div>{customerInfo.address}</div>}
            {customerInfo.city && <div>{customerInfo.postalCode} {customerInfo.city}</div>}
            {customerInfo.country && <div>{customerInfo.country}</div>}
            {customerInfo.taxId && <div>MF: {customerInfo.taxId}</div>}
          </div>
        </div>
      </div>

      {/* Infos additionnelles */}
      <div className="mb-6">
        <div className="font-bold text-sm text-slate-900 mb-1">Infos additionnelles</div>
        <div className="text-slate-700">
          Merci d'avoir choisi {COMPANY.name} pour vos pièces automobiles.
          {order.notes && <div className="mt-1">Note: {order.notes}</div>}
          {!isInvoice && <div className="mt-1 text-amber-700">Ce devis est valable 30 jours à compter de sa date d'émission.</div>}
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-center border-collapse mb-8 border border-slate-300">
        <thead>
          <tr className="bg-brand-50 text-brand-900 border-b border-slate-300 text-xs font-bold uppercase tracking-wider">
            <th className="py-2 px-2 text-left border-r border-slate-300">Description</th>
            <th className="py-2 px-2 border-r border-slate-300 w-20">Quantités</th>
            <th className="py-2 px-2 border-r border-slate-300 w-16">Unités</th>
            <th className="py-2 px-2 border-r border-slate-300 w-28">Prix unitaire HT</th>
            <th className="py-2 px-2 border-r border-slate-300 w-16">% TVA</th>
            <th className="py-2 px-2 border-r border-slate-300 w-24">TVA</th>
            <th className="py-2 px-2 w-28">TOTAL TTC</th>
          </tr>
        </thead>
        <tbody className="text-slate-700 border-b border-slate-300">
          {order.order_items.map((item, idx) => {
            const unitPrice = Number(item.unit_price);
            const vatAmt = unitPrice * 0.19;
            const rowTTC = (unitPrice + vatAmt) * item.quantity;
            return (
              <tr key={item.id} className="border-b border-slate-200 last:border-0 align-top">
                <td className="py-2 px-2 text-left border-r border-slate-300">
                  <div className="font-medium text-slate-900">{item.product_name}</div>
                  {item.options_snapshot && Array.isArray(item.options_snapshot) && item.options_snapshot.length > 0 && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      {item.options_snapshot.map((o: any) => `${o.option}: ${o.value}`).join(' · ')}
                    </div>
                  )}
                </td>
                <td className="py-2 px-2 border-r border-slate-300">{item.quantity}</td>
                <td className="py-2 px-2 border-r border-slate-300">pce.</td>
                <td className="py-2 px-2 border-r border-slate-300 text-right">{formatPrice(unitPrice)}</td>
                <td className="py-2 px-2 border-r border-slate-300">19%</td>
                <td className="py-2 px-2 border-r border-slate-300 text-right">{formatPrice(vatAmt * item.quantity)}</td>
                <td className="py-2 px-2 text-right">{formatPrice(rowTTC)}</td>
              </tr>
            );
          })}
          {/* Add empty rows to make the table look full if needed, or just let it be */}
        </tbody>
      </table>

      {/* Totals Box */}
      <div className="flex justify-end mb-12">
        <div className="w-72 border-t-2 border-slate-800 pt-2 text-slate-900 text-sm">
          <div className="flex justify-between py-1">
            <span className="font-bold">Total HT</span>
            <span>{formatPrice(Number(order.subtotal))}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-300">
            <span className="font-bold">TVA</span>
            <span>{formatPrice(Number(order.vat))}</span>
          </div>
          {Number(order.subtotal) > 0 && (
            <>
              <div className="flex justify-between py-1">
                <span>Timbre fiscal</span>
                <span>{formatPrice(1)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-300">
                <span>RAS (1%)</span>
                <span>+{formatPrice(ras)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between py-2 font-bold text-[15px] border-b-2 border-slate-800">
            <span>Total TTC</span>
            <span>{formatPrice(Number(order.total))}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-6 border-t border-slate-300 text-[12px] text-slate-600 flex justify-between leading-relaxed">
        <div className="w-1/3 pr-4">
          <div className="font-bold text-slate-800">{COMPANY.name}</div>
          <div>{COMPANY.address}</div>
          <div className="mt-2">Matricule Fiscal : {COMPANY.taxId}</div>
          <div>RC : {COMPANY.rc}</div>
        </div>
        
        <div className="w-1/3 pr-4">
          <div className="font-bold text-slate-800">Contact</div>
          <div>Téléphone : {COMPANY.phone}</div>
          <div>Email : {COMPANY.email}</div>
          <div>{COMPANY.website}</div>
        </div>
        
        <div className="w-1/3">
          <div className="font-bold text-slate-800">Détails bancaires</div>
          <div className="grid grid-cols-[80px_1fr]">
            <div>Banque</div>
            <div>{COMPANY.bank}</div>
            <div>RIB</div>
            <div>{COMPANY.rib}</div>
            <div>IBAN</div>
            <div>{COMPANY.iban}</div>
          </div>
        </div>
      </div>

    </div>
  );
}
