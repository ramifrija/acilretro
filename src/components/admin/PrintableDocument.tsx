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
  const fodec = totalHT * 0.01;
  const totalTVA = Number(order.vat);
  const totalTTC = Number(order.total);

  // Use a base to calculate vat rate so it returns 19 instead of 19.19
  const baseTva = totalHT + fodec;
  const calculatedVatRate = baseTva > 0 ? Math.round((totalTVA / baseTva) * 100) : 0;

  const timbre = (totalHT > 0 && !isDelivery) ? 1 : 0;

  // finalTotal should visually match the sum of printed lines
  const finalTotal = totalHT + fodec + totalTVA + timbre;
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
            {/* Bank Details - Horizontal */}
            <div className="mt-1.5 border border-[#1e9eb9] rounded px-2.5 py-1.5 bg-[#f0fbfd] text-[11px] text-gray-700">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5">
                <span className="font-bold text-[#1e9eb9] whitespace-nowrap">Coordonnées Bancaires :</span>
                <span className="whitespace-nowrap"><span className="font-bold">Banque :</span> BNA</span>
                <span className="text-gray-300">|</span>
                <span className="whitespace-nowrap"><span className="font-bold">RIB :</span> 12 345 678 901 234 567 89 01</span>
                <span className="text-gray-300">|</span>
                <span className="whitespace-nowrap"><span className="font-bold">IBAN :</span> TN59 1234 5678 9012 3456 7890 1234</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Invoice Label & Details */}
        <div className="flex flex-col items-end text-[13px] shrink-0">
          <div className={`text-[#1e9eb9] font-bold tracking-wider mb-2 uppercase leading-tight text-right ${isDelivery ? 'text-[24px] sm:text-[28px]' : 'text-[32px] sm:text-[42px]'}`}>{docLabel}</div>
          <div className="font-bold text-[14px] mb-1 text-black">N° : {prefix}{new Date(order.created_at).getFullYear()}/{docNumber}</div>
          <div className="text-gray-500 mb-3">Date : {formatDateString(order.created_at)}</div>
          <div className="w-20 h-20">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('https://acilretro.com')}`} alt="QR Code" className="w-full h-full object-contain" />
          </div>
        </div>
      </div>

      <div className="w-full h-[3px] bg-[#1e9eb9] my-4"></div>

      {/* Client Info */}
      <div className="mb-2">
        <div className="bg-[#f8f9fa] rounded-xl p-2.5 w-full border border-gray-100">
          <div className="font-bold text-[15px] mb-1.5 uppercase text-black">Client : {customerName}</div>
          <div className="flex flex-col gap-y-0.5 text-[12px] text-black">
            <span><span className="font-bold">Adresse :</span> {customerInfo.city ? customerInfo.city : (customerInfo.address || '-')}</span>
            <span><span className="font-bold">MF :</span> {customerInfo.taxId || '-'}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full mb-2 text-[12px]">
        <thead>
          <tr className="bg-[#1e9eb9] text-white">
            <th className="py-1 px-2 font-semibold text-center w-[10%]">Qté</th>
            <th className="py-1 px-2 font-semibold text-left uppercase">DÉSIGNATION</th>
            <th className="py-1 px-2 font-semibold text-right w-[15%]">P.U.HT</th>
            <th className="py-1 px-2 font-semibold text-right w-[20%]">Montant HT</th>
          </tr>
        </thead>
        <tbody>
          {order.order_items.map((item: any) => {
            const unitPrice = Number(item.unit_price);
            const montantHT = unitPrice * item.quantity;
            return (
              <tr key={item.id} className="border-b border-gray-200 last:border-b-0 break-inside-avoid">
                <td className="py-0.5 px-2 text-center text-black">{item.quantity}</td>
                <td className="py-0.5 px-2 text-left">
                  <span className="font-medium text-black">{item.product_name}</span>
                  {item.options_snapshot && item.options_snapshot.length > 0 && (
                    <span className="text-[11px] text-gray-500 ml-1">
                      ({item.options_snapshot.map((o: any) => `${o.option} : ${o.value}`).join(' | ')})
                    </span>
                  )}
                </td>
                <td className="py-0.5 px-2 text-right text-gray-600">{formatNumber(unitPrice)}</td>
                <td className="py-0.5 px-2 text-right font-bold text-black">{formatNumber(montantHT)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Bottom Section (Totals & Bank Details) */}
      <div className="mt-auto pt-2 break-inside-avoid">
        {/* Footer / Totals */}
        <div className="flex mb-3 gap-4 items-stretch">
          {/* Merci */}
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-[#e8f6f9] border border-[#bce4ec] rounded-xl p-3 w-[260px] flex items-center justify-center text-center shadow-sm">
              <span className="text-[#173e7c] font-bold text-[13px] leading-relaxed uppercase">Merci pour votre<br />confiance</span>
            </div>
          </div>

          {/* Totals Box */}
          <div className="w-[320px] shrink-0 text-[12px] flex flex-col justify-center">
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="font-bold text-gray-600">Total HT</span>
              <span className="font-bold text-black">{formatNumber(totalHT)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="font-bold text-gray-600">FODEC 1%</span>
              <span className="font-bold text-black">{formatNumber(fodec)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="font-bold text-gray-600">TVA {calculatedVatRate}%</span>
              <span className="font-bold text-black">{formatNumber(totalTVA)}</span>
            </div>
            {!isDelivery && (
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="font-bold text-gray-600">Timbre Fiscal</span>
                <span className="font-bold text-black">{formatNumber(timbre)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-1.5 px-4 mt-1 bg-[#e8f6f9] rounded-xl text-[#1e9eb9]">
              <span className="font-bold text-[14px] uppercase">TOTAL TTC</span>
              <span className="font-bold text-[16px]">{formatNumber(finalTotal)}</span>
            </div>
          </div>
        </div>

        {/* Arrêtée Text */}
        <div className="mt-2 mb-2 text-center w-full">
          <div className="text-gray-500 text-[10px] font-bold uppercase mb-0.5">ARRÊTÉE LA PRÉSENTE {docLabel} À LA SOMME DE :</div>
          <div className="text-[#173e7c] font-bold text-[11px] leading-tight">{amountInWordsCapitalized} TTC</div>
        </div>

        {/* Bank Details Footer 
        <div className="pt-4 border-t border-gray-200 text-[11px] text-gray-700 flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
          <span className="whitespace-nowrap"><span className="font-bold">Banque :</span> BNA</span>
          <span className="text-gray-300">|</span>
          <span className="whitespace-nowrap"><span className="font-bold">RIB :</span> 12 345 678 901 234 567 89 01</span>
          <span className="text-gray-300">|</span>
          <span className="whitespace-nowrap"><span className="font-bold">IBAN :</span> TN59 1234 5678 9012 3456 7890 1234</span>
        </div>
        */}
      </div>
    </div>
  );
}
