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
  const docNumber = order.id.slice(0, 8).toUpperCase();
  const docLabel = isInvoice ? 'Facture' : 'Devis';

  const customerInfo = order.customer_info as any || {};
  const customerName = customerInfo.fullName || customerInfo.companyName || (order.customer_type === 'company' ? 'Entreprise' : 'Client Passager');

  const totalHT = Number(order.subtotal);
  const totalTVA = Number(order.vat);
  const totalTTC = Number(order.total);
  const calculatedVatRate = totalHT > 0 ? Math.round((totalTVA / totalHT) * 100) : 0;
  const timbre = totalHT > 0 ? 1 : 0;

  const finalTotal = totalTTC + timbre;
  const dinars = Math.floor(finalTotal);
  const millimes = Math.round((finalTotal - dinars) * 1000);

  const dinarsText = writtenNumber(dinars, { lang: 'fr' });
  const millimesText = writtenNumber(millimes, { lang: 'fr' });

  const amountInWords = `${dinarsText} Dinars${millimes > 0 ? ` et ${millimesText} Millimes` : ''}`;
  const amountInWordsCapitalized = amountInWords.charAt(0).toUpperCase() + amountInWords.slice(1);

  return (
    <div id="printable-document" className="bg-white text-black p-8 lg:p-12 max-w-4xl mx-auto text-[13px]" style={{ fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        @media print {
          @page { margin: 0.5cm; }
          body { padding: 0; margin: 0; }
          body * { visibility: hidden; }
          #printable-document, #printable-document * { visibility: visible; }
          #printable-document { position: absolute; left: 0; top: 0; width: 100%; margin: 0; }
        }
      `}</style>

      {/* Top Header Section */}
      <div className="flex justify-between items-start mb-8">

        {/* Left Column: Logo & Invoice Details */}
        <div className="flex flex-col">
          <div className="w-48 mb-8">
            <img src="/images/Logo_facture.png" alt="Logo" className="w-full h-auto object-contain" />
          </div>
          <div className="pt-4">
            <h1 className="font-bold text-[22px] mb-2">{docLabel} N° : {isInvoice ? 'FV' : 'DV'}{new Date(order.created_at).getFullYear()}/{docNumber}</h1>
            <div className="font-bold text-[15px]">
              Le : {formatDateString(order.created_at)}
            </div>
          </div>
        </div>

        {/* Right Column: Company Info & Client Info */}
        <div className="w-[380px] flex flex-col gap-6">
          {/* Company Info */}
          <div>
            <div className="font-bold text-[20px]">{COMPANY.name}</div>
            <div className="text-[13px] font-bold text-[#173e7c] mb-2">{COMPANY.tagline}</div>
            <div className="flex"><span className="font-bold w-20 text-[13px]">RC :</span> <span className="text-[13px]">{COMPANY.rc}</span></div>
            <div className="flex"><span className="font-bold w-20 text-[13px]">MF :</span> <span className="text-[13px]">{COMPANY.mf}</span></div>
            <div className="flex mt-1"><span className="font-bold w-20 text-[13px]">ADRESSE:</span> <span className="text-[13px] whitespace-pre-wrap leading-tight">{COMPANY.address}</span></div>
            <div className="flex mt-1"><span className="font-bold w-20 text-[13px]">TÉL:</span> <span className="text-[13px] font-bold">{COMPANY.phone}</span></div>
            <div className="flex mt-1"><span className="font-bold w-20 text-[13px]">EMAIL:</span> <span className="text-[13px]">{COMPANY.email}</span></div>
          </div>

          {/* Client Info */}
          <div className="border-[1.5px] border-black rounded-[12px] p-4 bg-slate-50">
            <div className="flex mb-1.5"><span className="font-bold w-24 text-[13px]">CLIENT :</span> <span className="font-bold text-[13px] uppercase">{customerName}</span></div>
            <div className="flex mb-1.5"><span className="font-bold w-24 text-[13px]">ADRESSE :</span> <span className="text-[13px] uppercase">{customerInfo.city ? customerInfo.city : (customerInfo.address || '-')}</span></div>
            <div className="flex mb-1.5"><span className="font-bold w-24 text-[13px]">TÉL :</span> <span className="font-bold text-[13px]">{customerInfo.phone || '-'}</span></div>
            <div className="flex"><span className="font-bold w-24 text-[13px]">MF :</span> <span className="font-bold text-[13px]">{customerInfo.taxId || '-'}</span></div>
          </div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse mb-2 border border-black text-center text-[12px]">
        <thead>
          <tr className="bg-[#1e9eb9] text-white">
            <th className="py-1.5 px-2 border border-black font-bold w-[10%]">Quantité</th>
            <th className="py-1.5 px-2 border border-black font-bold uppercase">Désignation</th>
            <th className="py-1.5 px-2 border border-black font-bold w-[15%]">P.U.HT</th>
            <th className="py-1.5 px-2 border border-black font-bold w-[20%]">Montant</th>
          </tr>
        </thead>
        <tbody className="border-b border-black">
          {order.order_items.map((item: any, idx: number) => {
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
          {Array.from({ length: Math.max(0, 10 - (order.order_items?.length || 0)) }).map((_, i) => (
            <tr key={`empty-${i}`} className="align-top h-6">
              <td className="border border-black"></td>
              <td className="border border-black"></td>
              <td className="border border-black"></td>
              <td className="border border-black"></td>
            </tr>
          ))}

          {/* Totals Section */}
          <tr>
            <td colSpan={2} rowSpan={5} className="border border-black font-bold text-center text-[14px] uppercase align-middle">
              MERCI POUR VOTRE CONFIANCE
            </td>
            <td className="py-1 px-2 border border-black font-bold text-left bg-slate-50">TOTAL HT</td>
            <td className="py-1 px-2 border border-black font-bold text-right">{formatNumber(totalHT)}</td>
          </tr>
          <tr>
            <td className="py-1 px-2 border border-black font-bold text-left bg-slate-50">FODEC 1%</td>
            <td className="py-1 px-2 border border-black font-bold text-right">{formatNumber(totalHT * 0.01)}</td>
          </tr>
          {calculatedVatRate > 0 && (
            <tr>
              <td className="py-1 px-2 border border-black font-bold text-left bg-slate-50">TVA {calculatedVatRate}%</td>
              <td className="py-1 px-2 border border-black font-bold text-right">{formatNumber(totalTVA)}</td>
            </tr>
          )}
          <tr>
            <td className="py-1 px-2 border border-black font-bold text-left bg-slate-50">TIMBRE</td>
            <td className="py-1 px-2 border border-black font-bold text-right">{formatNumber(timbre)}</td>
          </tr>
          <tr>
            <td className="py-1 px-2 border border-black font-bold text-left bg-slate-50">TOTAL TTC</td>
            <td className="py-1 px-2 border border-black font-bold text-right">{formatNumber(totalTTC + timbre)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-6 flex justify-between items-end">
        <div className="font-bold text-[12px] uppercase">
          Arrêtée la présente {docLabel.toLowerCase()} à la somme : {amountInWordsCapitalized} TTC
        </div>
        <div className="w-20 h-20">
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('https://acilretro.netlify.app')}`} alt="Site QR Code" className="w-full h-full object-contain" />
        </div>
      </div>
    </div>
  );
}
