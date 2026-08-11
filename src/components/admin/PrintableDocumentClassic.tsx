import type { Order, OrderItem } from '@/types/database';
// @ts-ignore
import writtenNumber from 'written-number';

type Props = {
  order: Order & { order_items: OrderItem[] };
  documentType: 'invoice' | 'quote';
};

const COMPANY = {
  name: 'Ste ACIL "SARL"',
  tagline: 'FAB Pièces et Accessoires Autos',
  address: '04, Rue De Syrie Ben Arous Tunisie',
  phone: '(+216) 24244061',
  email: 'king-glass@hotmail.com',
  rc: 'B02199672013',
  mf: '1321313H/A/M000',
};

function formatNumber(num: number) {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(num);
}

function formatDateString(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function PrintableDocumentClassic({ order, documentType }: Props) {
  const isInvoice = documentType === 'invoice';
  const docNumber = order.id.slice(0, 8).toUpperCase();
  const docLabel = isInvoice ? 'Facture' : 'Devis';

  const customerInfo = (order.customer_info as any) || {};
  const customerName = customerInfo.fullName || customerInfo.companyName || (order.customer_type === 'company' ? 'Entreprise' : 'Client Passager');

  // Recalculate accurately based on items
  const totalHT = order.order_items.reduce((sum, item) => sum + (Number(item.unit_price) * item.quantity), 0);
  const fodec = totalHT * 0.01;
  const baseTva = totalHT + fodec;
  const totalTVA = baseTva * 0.19;
  const timbre = totalHT > 0 ? 1 : 0;
  const finalTotal = baseTva + totalTVA + timbre;

  const dinars = Math.floor(finalTotal);
  const millimes = Math.round((finalTotal - dinars) * 1000);
  const dinarsText = writtenNumber(dinars, { lang: 'fr' });
  const millimesText = writtenNumber(millimes, { lang: 'fr' });
  const amountInWords = `${dinarsText} Dinars${millimes > 0 ? ` et ${millimesText} Millimes` : ''}`;
  const amountInWordsCapitalized = amountInWords.charAt(0).toUpperCase() + amountInWords.slice(1);

  const emptyRows = Math.max(0, 10 - (order.order_items?.length || 0));

  return (
    <div id="printable-document" className="bg-white text-black p-8 max-w-4xl mx-auto text-[13px]" style={{ fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        @media print {
          @page { margin: 0.5cm; }
          body { padding: 0; margin: 0; }
          body * { visibility: hidden; }
          #printable-document, #printable-document * { visibility: visible; }
          #printable-document { position: absolute; left: 0; top: 0; width: 100%; margin: 0; }
        }
      `}</style>

      {/* Top Header */}
      <div className="flex justify-between items-start mb-6">
        {/* Left: Logo + Invoice Number */}
        <div className="flex flex-col">
          <div className="w-40 mb-6">
            <img src="/images/Logo_facture.png" alt="Logo" className="w-full h-auto object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-[20px] mb-1">{docLabel} N° : {isInvoice ? 'FV' : 'DV'}{new Date(order.created_at).getFullYear()}/{docNumber}</h1>
            <div className="font-bold text-[14px]">Le : {formatDateString(order.created_at)}</div>
          </div>
        </div>

        {/* Right: Company Info + Client Box */}
        <div className="w-[360px] flex flex-col gap-5">
          {/* Company Info */}
          <div>
            <div className="font-bold text-[18px]">{COMPANY.name}</div>
            <div className="text-[12px] font-bold text-[#173e7c] mb-1">{COMPANY.tagline}</div>
            <div className="flex text-[12px]"><span className="font-bold w-16">RC :</span> <span>{COMPANY.rc}</span></div>
            <div className="flex text-[12px]"><span className="font-bold w-16">MF :</span> <span>{COMPANY.mf}</span></div>
            <div className="flex mt-0.5 text-[12px]"><span className="font-bold w-16">ADRESSE:</span> <span>{COMPANY.address}</span></div>
            <div className="flex mt-0.5 text-[12px]"><span className="font-bold w-16">TÉL:</span> <span className="font-bold">{COMPANY.phone}</span></div>
            <div className="flex mt-0.5 text-[12px]"><span className="font-bold w-16">EMAIL:</span> <span>{COMPANY.email}</span></div>
          </div>

          {/* Client Info Box */}
          <div className="border-[1.5px] border-black rounded-[10px] p-3 bg-slate-50">
            <div className="flex mb-1"><span className="font-bold w-20 text-[12px]">CLIENT :</span> <span className="font-bold text-[12px] uppercase">{customerName}</span></div>
            <div className="flex mb-1"><span className="font-bold w-20 text-[12px]">ADRESSE :</span> <span className="text-[12px]">{customerInfo.address || customerInfo.city || '-'}</span></div>
            <div className="flex mb-1"><span className="font-bold w-20 text-[12px]">TÉL :</span> <span className="font-bold text-[12px]">{customerInfo.phone || '-'}</span></div>
            <div className="flex"><span className="font-bold w-20 text-[12px]">MF :</span> <span className="font-bold text-[12px]">{customerInfo.taxId || '-'}</span></div>
          </div>
        </div>
      </div>

      {/* Date & MF line */}
      <div className="flex justify-between items-center mb-2 text-[12px]">
        <span className="font-bold text-[#1e9eb9]">Le : {formatDateString(order.created_at)}</span>
        <div className="flex items-center gap-2">
          <span className="font-bold">MF :</span>
          <span className="border border-black px-8 py-0.5 min-w-[140px] inline-block">{customerInfo.taxId || ''}</span>
        </div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse mb-2 border border-black text-center text-[12px]">
        <thead>
          <tr className="bg-[#1e9eb9] text-white">
            <th className="py-1.5 px-2 border border-black font-bold w-[10%]">Quantité</th>
            <th className="py-1.5 px-2 border border-black font-bold uppercase">Désignation</th>
            <th className="py-1.5 px-2 border border-black font-bold w-[15%]">Prix HT</th>
            <th className="py-1.5 px-2 border border-black font-bold w-[20%]">Montant</th>
          </tr>
        </thead>
        <tbody>
          {order.order_items.map((item: any) => {
            const unitPrice = Number(item.unit_price);
            const montantHT = unitPrice * item.quantity;
            return (
              <tr key={item.id} className="align-top h-8">
                <td className="py-1 px-2 border border-black">{item.quantity}</td>
                <td className="py-1 px-2 border border-black text-left">{item.product_name}</td>
                <td className="py-1 px-2 border border-black text-right">{formatNumber(unitPrice)}</td>
                <td className="py-1 px-2 border border-black text-right">{formatNumber(montantHT)}</td>
              </tr>
            );
          })}
          {Array.from({ length: emptyRows }).map((_, i) => (
            <tr key={`empty-${i}`} className="align-top h-7">
              <td className="border border-black"></td>
              <td className="border border-black"></td>
              <td className="border border-black"></td>
              <td className="border border-black"></td>
            </tr>
          ))}

          {/* Totals merged with MERCI cell */}
          <tr>
            <td colSpan={2} rowSpan={5} className="border border-black font-bold text-center text-[13px] uppercase align-middle">
              MERCI POUR VOTRE CONFIANCE
            </td>
            <td className="py-1 px-2 border border-black font-bold text-left bg-slate-50">TOTAL HT</td>
            <td className="py-1 px-2 border border-black font-bold text-right">{formatNumber(totalHT)}</td>
          </tr>
          <tr>
            <td className="py-1 px-2 border border-black font-bold text-left bg-slate-50">FODEC 1%</td>
            <td className="py-1 px-2 border border-black font-bold text-right">{formatNumber(fodec)}</td>
          </tr>
          <tr>
            <td className="py-1 px-2 border border-black font-bold text-left bg-slate-50">TVA 19%</td>
            <td className="py-1 px-2 border border-black font-bold text-right">{formatNumber(totalTVA)}</td>
          </tr>
          <tr>
            <td className="py-1 px-2 border border-black font-bold text-left bg-slate-50">TIMBRE</td>
            <td className="py-1 px-2 border border-black font-bold text-right">{formatNumber(timbre)}</td>
          </tr>
          <tr>
            <td className="py-1 px-2 border border-black font-bold text-left bg-[#1e9eb9] text-white">TOTAL TTC</td>
            <td className="py-1 px-2 border border-black font-bold text-right text-[#1e9eb9]">{formatNumber(finalTotal)}</td>
          </tr>
        </tbody>
      </table>

      {/* Footer: Amount in words + QR */}
      <div className="mt-4 flex justify-between items-end">
        <div className="font-bold text-[11px] uppercase max-w-[65%]">
          Arrêtée la présente {docLabel.toLowerCase()} à la somme de :{' '}
          <span className="text-[#173e7c]">{amountInWordsCapitalized} TTC</span>
        </div>
        <div className="w-20 h-20 border border-gray-200 p-0.5">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('https://acilretro.netlify.app')}`}
            alt="QR Code"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}
