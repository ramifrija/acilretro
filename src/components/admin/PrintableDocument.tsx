import type { Order, OrderItem } from '@/types/database';
// @ts-ignore
import writtenNumber from 'written-number';

type Props = {
  order: Order & { order_items: OrderItem[] };
  documentType: 'invoice' | 'quote' | 'delivery_note';
};

const COMPANY = {
  name: 'Ste ACIL "SARL"',
  tagline: 'FAB Pièces et Accessoires Autos',
  address: '04, Rue De Syrie Ben Arous Tunisie',
  phone: '(+216) 24244061',
  email: 'king-glass@hotmail.com',
  rc: 'B02199672013',
  mf: '1321313H/A/M000',
  taxId: '1321313H/A/M000',
  website: 'www.acilretro.tn',
  bank: 'BNA',
  rib: '12 345 678 901 234 567 89 01',
  iban: 'TN59 1234 5678 9012 3456 7890 1234'
};

function formatNumber(num: number) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(num);
}

function formatDateString(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function PrintableDocument({ order, documentType }: Props) {
  const isInvoice = documentType === 'invoice';
  const isDelivery = documentType === 'delivery_note';
  const docNumber = order.id.slice(0, 8).toUpperCase();
  const docLabel = isInvoice ? 'FACTURE' : (isDelivery ? 'BON DE LIVRAISON' : 'DEVIS');
  const prefix = isInvoice ? 'FV' : (isDelivery ? 'BL' : 'DV');

  const customerInfo = order.customer_info as any || {};
  const customerName = customerInfo.fullName || customerInfo.companyName || (order.customer_type === 'company' ? 'ENTREPRISE' : 'CLIENT PASSAGER');

  const totalHT = Number(order.subtotal);
  const totalTVA = Number(order.vat);
  const totalTTC = Number(order.total);
  const calculatedVatRate = totalHT > 0 ? Math.round((totalTVA / totalHT) * 100) : 0;
  const timbre = (totalHT > 0 && !isDelivery) ? 1 : 0;
  const fodec = totalHT * 0.01;

  const finalTotal = totalTTC + timbre;
  const dinars = Math.floor(finalTotal);
  const millimes = Math.round((finalTotal - dinars) * 1000);

  const dinarsText = writtenNumber(dinars, { lang: 'fr' });
  const millimesText = writtenNumber(millimes, { lang: 'fr' });

  const amountInWords = `${dinarsText} Dinars${millimes > 0 ? ` et ${millimesText} Millimes` : ''}`;
  const amountInWordsCapitalized = amountInWords.charAt(0).toUpperCase() + amountInWords.slice(1);

  return (
    <div id="printable-document" className="bg-white text-gray-800 p-8 lg:p-12 max-w-4xl mx-auto text-[13px] flex flex-col min-h-[297mm]" style={{ fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        @media print {
          @page { margin: 0; size: A4; }
          body { padding: 0; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          #printable-document { padding: 1.5cm; max-width: 100%; width: 100%; min-height: 297mm; display: flex; flex-direction: column; }
        }
      `}</style>

      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        {/* Left Column: Logo & Company Details */}
        <div className="flex gap-6 items-center">
          <div className="w-[120px] shrink-0">
            <img src="/images/acil_logo.png" alt="Logo" className="w-full h-auto object-contain" />
          </div>
          <div className="flex flex-col text-[12px] text-gray-600 gap-0.5">
            <div className="font-bold text-[20px] text-black mb-1">{COMPANY.name}</div>
            <div className="text-[#1e9eb9] font-bold text-[14px] mb-1">{COMPANY.tagline}</div>
            <div>{COMPANY.address}</div>
            <div>Tél : <span className="font-bold">{COMPANY.phone}</span> | Email : {COMPANY.email}</div>
            <div>RC : {COMPANY.rc} | MF : {COMPANY.mf}</div>
          </div>
        </div>

        {/* Right Column: Invoice Label & Details */}
        <div className="flex flex-col items-end text-[13px] shrink-0">
          <div className={`text-[#1e9eb9] font-bold tracking-wider mb-2 uppercase leading-tight text-right ${isDelivery ? 'text-[24px] sm:text-[28px]' : 'text-[32px] sm:text-[42px]'}`}>{docLabel}</div>
          <div className="font-bold text-[14px] mb-1 text-black">N° : {prefix}{new Date(order.created_at).getFullYear()}/{docNumber}</div>
          <div className="text-gray-500 mb-3">Date : {formatDateString(order.created_at)}</div>
          <div className="w-20 h-20">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('https://acilretro.netlify.app')}`} alt="QR Code" className="w-full h-full object-contain" />
          </div>
        </div>
      </div>

      <div className="w-full h-[3px] bg-[#1e9eb9] my-6"></div>

      {/* Facturé À & Merci */}
      <div className="mb-8">
        <div className="text-[#1e9eb9] font-bold uppercase mb-2 text-[14px]">FACTURE À</div>
        <div className="bg-[#f8f9fa] rounded-xl p-5 max-w-[400px]">
          <div className="font-bold text-[15px] mb-4 uppercase text-black">{customerName}</div>
          <div className="grid grid-cols-[80px_1fr] gap-y-2 text-[13px] text-black">
            <div className="font-bold">Adresse :</div>
            <div>{customerInfo.city ? customerInfo.city : (customerInfo.address || '-')}</div>
            <div className="font-bold">Tél :</div>
            <div>{customerInfo.phone || '-'}</div>
            <div className="font-bold">MF :</div>
            <div>{customerInfo.taxId || '-'}</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full mb-8 text-[13px]">
        <thead>
          <tr className="bg-[#1e9eb9] text-white">
            <th className="py-2.5 px-4 font-semibold text-center w-[10%]">Qté</th>
            <th className="py-2.5 px-4 font-semibold text-left uppercase">DÉSIGNATION</th>
            <th className="py-2.5 px-4 font-semibold text-right w-[15%]">P.U.HT</th>
            <th className="py-2.5 px-4 font-semibold text-right w-[20%]">Montant HT</th>
          </tr>
        </thead>
        <tbody>
          {order.order_items.map((item: any) => {
            const unitPrice = Number(item.unit_price);
            const montantHT = unitPrice * item.quantity;
            return (
              <tr key={item.id} className="border-b border-gray-200 last:border-b-0">
                <td className="py-3 px-4 text-center text-black">{item.quantity}</td>
                <td className="py-3 px-4 text-left">
                  <div className="font-medium text-black">{item.product_name}</div>
                  {item.options_snapshot && item.options_snapshot.length > 0 && (
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {item.options_snapshot.map((o: any) => `${o.option} : ${o.value}`).join(' | ')}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-right text-gray-600">{formatNumber(unitPrice)}</td>
                <td className="py-3 px-4 text-right font-bold text-black">{formatNumber(montantHT)}</td>
              </tr>
            );
          })}

        </tbody>
      </table>

      {/* Bottom Section (Totals & Bank Details) */}
      <div className="mt-auto pt-6">
        {/* Footer / Totals */}
        <div className="flex justify-between items-center mb-6 gap-4">
          {/* Merci */}
          <div className="bg-[#e8f6f9] border border-[#bce4ec] rounded-xl p-4 w-[280px] flex items-center justify-center text-center">
            <span className="text-[#173e7c] font-bold text-[13px] leading-relaxed uppercase">Merci pour votre<br />confiance</span>
          </div>

          {/* Totals Box */}
          <div className="w-[320px] text-[12px]">
            <div className="flex justify-between py-1.5 border-b border-gray-200">
              <span className="font-bold text-gray-600">Total HT</span>
              <span className="font-bold text-black">{formatNumber(totalHT)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-200">
              <span className="font-bold text-gray-600">FODEC 1%</span>
              <span className="font-bold text-black">{formatNumber(fodec)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-200">
              <span className="font-bold text-gray-600">TVA {calculatedVatRate}%</span>
              <span className="font-bold text-black">{formatNumber(totalTVA)}</span>
            </div>
            {!isDelivery && (
              <div className="flex justify-between py-1.5 border-b border-gray-200">
                <span className="font-bold text-gray-600">Timbre Fiscal</span>
                <span className="font-bold text-black">{formatNumber(timbre)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2.5 px-4 mt-2 bg-[#e8f6f9] rounded-xl text-[#1e9eb9]">
              <span className="font-bold text-[14px] uppercase">TOTAL TTC</span>
              <span className="font-bold text-[16px]">{formatNumber(finalTotal)}</span>
            </div>
            <div className="mt-2 text-center">
              <div className="text-gray-500 text-[10px] font-bold uppercase mb-0.5">ARRÊTÉE LA PRÉSENTE {docLabel} À LA SOMME DE :</div>
              <div className="text-[#173e7c] font-bold text-[11px] leading-tight">{amountInWordsCapitalized} TTC</div>
            </div>
          </div>
        </div>

        {/* Bank Details Footer */}
        <div className="pt-4 border-t border-gray-200 text-[11px] text-gray-700 flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
          <span className="font-bold text-gray-800 uppercase">Coordonnées Bancaires :</span>
          <span className="flex gap-1.5"><span className="text-gray-500">Banque :</span> <span className="font-bold text-black">{COMPANY.bank}</span></span>
          <span className="flex gap-1.5"><span className="text-gray-500">RIB :</span> <span className="font-bold text-black">{COMPANY.rib}</span></span>
          <span className="flex gap-1.5"><span className="text-gray-500">IBAN :</span> <span className="font-bold text-black">{COMPANY.iban}</span></span>
        </div>
      </div>
    </div>
  );
}
