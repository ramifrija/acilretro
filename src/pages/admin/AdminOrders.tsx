import { useEffect, useState } from 'react';
import { Check, X, FileText, ShoppingCart, Eye, Printer, Copy, ArrowRight, Download, Receipt, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatDate } from '@/lib/format';
import type { Order, OrderItem, Product } from '@/types/database';
import PrintableDocument from '@/components/admin/PrintableDocument';
import toast from 'react-hot-toast';

type OrderWithItems = Order & { order_items: OrderItem[] };

export default function AdminOrders({ quotesOnly = false }: { quotesOnly?: boolean }) {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<OrderWithItems | null>(null);
  const [printDoc, setPrintDoc] = useState<{ order: OrderWithItems; type: 'invoice' | 'quote' } | null>(null);
  const [rejecting, setRejecting] = useState<OrderWithItems | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    setLoading(true);
    let q = supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
    if (quotesOnly) q = q.eq('type', 'quote');
    else q = q.eq('type', 'order');
    const { data } = await q;
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { 
    load(); 

    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        toast.success('Nouvelle commande reçue !', { icon: '🔔' });
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [quotesOnly]);

  // Accept order: generate invoice + reduce stock
  const acceptOrder = async (order: OrderWithItems) => {
    // Reduce stock for each item
    for (const item of order.order_items) {
      if (!item.product_id) continue;
      const { data: product } = await supabase.from('products').select('*').eq('id', item.product_id).maybeSingle();
      if (product) {
        const newStock = Math.max(0, (product as Product).stock - item.quantity);
        await supabase.from('products').update({ stock: newStock }).eq('id', item.product_id);
        await supabase.from('inventory_movements').insert({
          product_id: item.product_id,
          movement_type: 'sale',
          quantity: -item.quantity,
          reason: `Vente - Commande #${order.id.slice(0, 8).toUpperCase()}`,
        });
      }
    }
    await supabase.from('orders').update({ status: 'accepted' }).eq('id', order.id);
    load();
    // Show invoice
    const updated = { ...order, status: 'accepted' };
    setPrintDoc({ order: updated, type: 'invoice' });
  };

  const rejectOrder = async (order: OrderWithItems, reason: string) => {
    // If it was accepted/paid, refund stock
    if (order.status === 'accepted' || order.status === 'paid' || order.status === 'completed' || order.status === 'delivered') {
      for (const item of order.order_items) {
        if (!item.product_id) continue;
        const { data: product } = await supabase.from('products').select('*').eq('id', item.product_id).maybeSingle();
        if (product) {
          await supabase.from('products').update({ stock: product.stock + item.quantity }).eq('id', item.product_id);
          await supabase.from('inventory_movements').insert({
            product_id: item.product_id, movement_type: 'return', quantity: item.quantity,
            reason: `Rejet - Commande #${order.id.slice(0, 8).toUpperCase()}`,
          });
        }
      }
    }
    await supabase.from('orders').update({ status: 'rejected', notes: `${order.notes || ''}\n[Motif de refus: ${reason}]`.trim() }).eq('id', order.id);
    setRejecting(null);
    setRejectReason('');
    load();
  };

  const cancelOrder = async (order: OrderWithItems) => {
    if (!confirm('Annuler cette commande? Le stock sera restauré.')) return;
    if (order.status === 'accepted' || order.status === 'paid' || order.status === 'completed' || order.status === 'delivered') {
      for (const item of order.order_items) {
        if (!item.product_id) continue;
        const { data: product } = await supabase.from('products').select('*').eq('id', item.product_id).maybeSingle();
        if (product) {
          await supabase.from('products').update({ stock: product.stock + item.quantity }).eq('id', item.product_id);
          await supabase.from('inventory_movements').insert({
            product_id: item.product_id, movement_type: 'return', quantity: item.quantity,
            reason: `Annulation - Commande #${order.id.slice(0, 8).toUpperCase()}`,
          });
        }
      }
    }
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
    load();
  };

  const convertQuote = async (order: OrderWithItems) => {
    if (!confirm('Convertir ce devis en commande confirmée? Le stock sera réduit.')) return;
    // Reduce stock
    for (const item of order.order_items) {
      if (!item.product_id) continue;
      const { data: product } = await supabase.from('products').select('*').eq('id', item.product_id).maybeSingle();
      if (product) {
        const newStock = Math.max(0, (product as Product).stock - item.quantity);
        await supabase.from('products').update({ stock: newStock }).eq('id', item.product_id);
        await supabase.from('inventory_movements').insert({
          product_id: item.product_id,
          movement_type: 'sale',
          quantity: -item.quantity,
          reason: `Vente - Devis converti #${order.id.slice(0, 8).toUpperCase()}`,
        });
      }
    }
    await supabase.from('orders').update({ status: 'accepted', type: 'order' }).eq('id', order.id);
    load();
    setPrintDoc({ order: { ...order, status: 'accepted', type: 'order' }, type: 'invoice' });
  };

  const duplicate = async (order: OrderWithItems) => {
    const { id, created_at, updated_at, order_items, ...rest } = order;
    const { data: newOrder } = await supabase.from('orders').insert({ ...rest, status: 'pending', type: 'order' }).select().single();
    if (newOrder && order_items.length) {
      await supabase.from('order_items').insert(order_items.map((i) => ({
        product_id: i.product_id,
        product_name: i.product_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        options_snapshot: i.options_snapshot,
        order_id: newOrder.id,
      })));
    }
    load();
  };

  const updateStatus = async (order: OrderWithItems, newStatus: string) => {
    let type = 'order';
    let status = newStatus;
    if (newStatus === 'quote') {
      type = 'quote';
      status = 'pending';
    }
    
    // Check if we need to refund or reduce stock
    const wasStockReduced = order.status === 'accepted' || order.status === 'paid' || order.status === 'completed' || order.status === 'delivered';
    const willStockReduce = status === 'accepted' || status === 'paid' || status === 'completed' || status === 'delivered';
    
    if (wasStockReduced && !willStockReduce && order.type === 'order') {
      // Refund stock
      for (const item of order.order_items) {
        if (!item.product_id) continue;
        const { data: product } = await supabase.from('products').select('*').eq('id', item.product_id).maybeSingle();
        if (product) {
          await supabase.from('products').update({ stock: product.stock + item.quantity }).eq('id', item.product_id);
          await supabase.from('inventory_movements').insert({
            product_id: item.product_id, movement_type: 'return', quantity: item.quantity,
            reason: `Annulation - #${order.id.slice(0, 8).toUpperCase()}`,
          });
        }
      }
    } else if (!wasStockReduced && willStockReduce) {
      // Reduce stock
      for (const item of order.order_items) {
        if (!item.product_id) continue;
        const { data: product } = await supabase.from('products').select('*').eq('id', item.product_id).maybeSingle();
        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity);
          await supabase.from('products').update({ stock: newStock }).eq('id', item.product_id);
          await supabase.from('inventory_movements').insert({
            product_id: item.product_id, movement_type: 'sale', quantity: -item.quantity,
            reason: `Vente - #${order.id.slice(0, 8).toUpperCase()}`,
          });
        }
      }
    }

    await supabase.from('orders').update({ type, status }).eq('id', order.id);
    if (selected?.id === order.id) {
      setSelected({ ...selected, type: type as any, status: status as any });
    }
    load();
  };

  const filtered = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);

  // Simplified statuses per user request: accepté, en attente, annulé, devis
  const statuses = quotesOnly
    ? ['pending', 'accepted', 'cancelled']
    : ['pending', 'accepted', 'cancelled'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${statusFilter === 'all' ? 'bg-brand-600 text-white' : 'glass'}`}
        >
          Tous ({orders.length})
        </button>
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${statusFilter === s ? 'bg-brand-600 text-white' : 'glass'}`}
          >
            {statusLabels[s]} ({orders.filter((o) => o.status === s).length})
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {loading ? (
          <div className="glass-card h-32 animate-shimmer" />
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Aucune {quotesOnly ? 'demande de devis' : 'commande'}</p>
          </div>
        ) : (
          filtered.map((o) => (
            <div key={o.id} className="glass-card p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${o.type === 'quote' ? 'bg-amber-500/10' : 'bg-brand-500/10'}`}>
                    {o.type === 'quote' ? <FileText className="w-5 h-5 text-amber-500" /> : <ShoppingCart className="w-5 h-5 text-brand-500" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">#{o.id.slice(0, 8).toUpperCase()}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-white mt-1">
                      {o.customer_info?.fullName || o.customer_info?.companyName || 'Client Inconnu'}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {formatDate(o.created_at)} · {o.order_items.length} article(s) · {o.customer_type === 'company' ? 'Entreprise' : 'Particulier'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-display font-bold text-lg text-slate-900 dark:text-white">{formatPrice(Number(o.total))}</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => setSelected(o)} className="p-2 rounded-lg glass hover:bg-brand-50 dark:hover:bg-white/10 transition-all" title="Voir détails">
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Pending order: accept / reject */}
                    {o.status === 'pending' && o.type === 'order' && (
                      <>
                        <button onClick={() => acceptOrder(o)} className="p-2 rounded-lg bg-success-500/10 text-success-600 hover:bg-success-500/20 transition-all" title="Accepter et générer facture">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setRejecting(o)} className="p-2 rounded-lg bg-error-500/10 text-error-500 hover:bg-error-500/20 transition-all" title="Refuser">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {/* Pending quote: convert to order or reject */}
                    {o.status === 'pending' && o.type === 'quote' && (
                      <>
                        <button onClick={() => convertQuote(o)} className="p-2 rounded-lg bg-brand-500/10 text-brand-600 hover:bg-brand-500/20 transition-all" title="Convertir en commande">
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button onClick={() => setRejecting(o)} className="p-2 rounded-lg bg-error-500/10 text-error-500 hover:bg-error-500/20 transition-all" title="Refuser">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {/* Accepted order: view/print invoice */}
                    {o.status === 'accepted' && o.type === 'order' && (
                      <button onClick={() => setPrintDoc({ order: o, type: 'invoice' })} className="p-2 rounded-lg bg-brand-500/10 text-brand-600 hover:bg-brand-500/20 transition-all" title="Voir / Imprimer facture">
                        <Receipt className="w-4 h-4" />
                      </button>
                    )}

                    {/* Accepted quote: print quote */}
                    {o.status === 'accepted' && o.type === 'quote' && (
                      <button onClick={() => setPrintDoc({ order: o, type: 'quote' })} className="p-2 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-all" title="Voir / Imprimer devis">
                        <FileText className="w-4 h-4" />
                      </button>
                    )}

                    {/* Pending quote: print quote (no stock change) */}
                    {o.status === 'pending' && o.type === 'quote' && (
                      <button onClick={() => setPrintDoc({ order: o, type: 'quote' })} className="p-2 rounded-lg glass hover:bg-amber-50 dark:hover:bg-white/10 transition-all" title="Imprimer devis (le stock ne change pas)">
                        <Printer className="w-4 h-4" />
                      </button>
                    )}

                    {/* Cancel accepted order */}
                    {o.status === 'accepted' && (
                      <button onClick={() => cancelOrder(o)} className="p-2 rounded-lg bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 transition-all" title="Annuler">
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}

                    <button onClick={() => duplicate(o)} className="p-2 rounded-lg glass hover:bg-brand-50 dark:hover:bg-white/10 transition-all" title="Dupliquer">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white">
                  {selected.type === 'quote' ? 'Devis' : 'Commande'} #{selected.id.slice(0, 8).toUpperCase()}
                </h2>
                <p className="text-sm text-slate-500 mt-1">{formatDate(selected.created_at)}</p>
              </div>
              <div className="flex gap-2 items-center">
                <select
                  value={selected.type === 'quote' ? 'quote' : selected.status}
                  onChange={(e) => updateStatus(selected, e.target.value)}
                  className="input-field text-sm font-semibold py-2 bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-white border-0 cursor-pointer"
                >
                  <option value="pending" className="bg-white text-slate-900 dark:bg-brand-950 dark:text-white">En attente</option>
                  <option value="accepted" className="bg-white text-slate-900 dark:bg-brand-950 dark:text-white">Acceptée</option>
                  <option value="paid" className="bg-white text-slate-900 dark:bg-brand-950 dark:text-white">Payée</option>
                  <option value="cancelled" className="bg-white text-slate-900 dark:bg-brand-950 dark:text-white">Annulée</option>
                  <option value="quote" className="bg-white text-slate-900 dark:bg-brand-950 dark:text-white">Devis</option>
                </select>
                <button onClick={() => setSelected(null)} className="p-2 rounded-lg glass"><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="glass p-4 rounded-xl">
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Type client</div>
                <div className="font-semibold text-slate-900 dark:text-white">{selected.customer_type === 'company' ? 'Entreprise' : 'Particulier'}</div>
              </div>
              <div className="glass p-4 rounded-xl">
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Statut actuel</div>
                <StatusBadge status={selected.type === 'quote' ? 'quote' : selected.status} />
              </div>
            </div>

            <div className="glass p-4 rounded-xl mb-6">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">Informations Client</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Nom / Raison sociale</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{selected.customer_info?.fullName || selected.customer_info?.companyName || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Téléphone</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{selected.customer_info?.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Email</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{selected.customer_info?.email || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Adresse de livraison</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {[selected.customer_info?.address, selected.customer_info?.city, selected.customer_info?.postalCode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
                {selected.customer_type === 'company' && (
                  <>
                    <div>
                      <p className="text-slate-500">Matricule Fiscal</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{selected.customer_info?.taxId || '-'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Personne à contacter</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{selected.customer_info?.contactPerson || '-'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {selected.notes && (
              <div className="glass p-4 rounded-xl mb-6">
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Notes</div>
                <p className="text-sm text-slate-700 dark:text-slate-200">{selected.notes}</p>
              </div>
            )}

            {/* Items */}
            <div className="space-y-3 mb-6">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Articles</h3>
              {selected.order_items.map((item) => (
                <div key={item.id} className="glass p-4 rounded-xl">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{item.product_name}</p>
                      <p className="text-xs text-slate-500 mt-1">Quantité: {item.quantity}</p>
                      {item.options_snapshot && Array.isArray(item.options_snapshot) && item.options_snapshot.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {item.options_snapshot.map((o, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-800/40 text-brand-600 dark:text-brand-300">
                              {o.option}: {o.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">{formatPrice(Number(item.unit_price) * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="glass p-4 rounded-xl space-y-2">
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300"><span>Sous-total</span><span>{formatPrice(Number(selected.subtotal))}</span></div>
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300"><span>TVA</span><span>{formatPrice(Number(selected.vat))}</span></div>
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300"><span>Livraison</span><span>{formatPrice(Number(selected.shipping))}</span></div>
              <div className="flex justify-between font-bold text-lg text-slate-900 dark:text-white border-t border-slate-100 dark:border-white/10 pt-2"><span>Total</span><span>{formatPrice(Number(selected.total))}</span></div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-6">
              <button onClick={() => setPrintDoc({ order: selected, type: selected.type === 'quote' ? 'quote' : 'invoice' })} className="btn-primary">
                <Printer className="w-4 h-4" /> Imprimer {selected.type === 'quote' ? 'Devis' : 'Facture'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject reason modal */}
      {rejecting && (
        <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRejecting(null)} />
          <div className="relative glass-card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">Refuser la {rejecting.type === 'quote' ? 'demande de devis' : 'commande'}</h2>
              <button onClick={() => setRejecting(null)} className="p-2 rounded-lg glass"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Indiquez le motif du refus (visible dans les notes)</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Motif du refus..."
              className="input-field resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => rejectOrder(rejecting, rejectReason || 'Non spécifié')} className="btn-primary flex-1">
                <X className="w-4 h-4" /> Confirmer le refus
              </button>
              <button onClick={() => setRejecting(null)} className="btn-ghost">Annuler</button>
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
              <span className="text-sm text-slate-500">
                {printDoc.type === 'invoice' ? 'Facture' : 'Devis'} #{printDoc.order.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="btn-primary text-sm">
                <Printer className="w-4 h-4" /> Imprimer
              </button>
              <button onClick={() => downloadAsText(printDoc.order, printDoc.type)} className="btn-ghost text-sm">
                <Download className="w-4 h-4" /> Télécharger
              </button>
            </div>
          </div>
          <div className="print:block">
            <PrintableDocument order={printDoc.order} documentType={printDoc.type} />
          </div>
        </div>
      )}
    </div>
  );
}

// Download document as a text file (simple fallback for PDF)
function downloadAsText(order: OrderWithItems, type: 'invoice' | 'quote') {
  const isInvoice = type === 'invoice';
  const label = isInvoice ? 'FACTURE' : 'DEVIS';
  const lines: string[] = [];
  lines.push(`=========================================`);
  lines.push(`            ${label} ${isInvoice ? 'FAC' : 'DEV'}-${order.id.slice(0, 8).toUpperCase()}`);
  lines.push(`=========================================`);
  lines.push(``);
  lines.push(`ACIL RETRO - Pièces Auto Premium`);
  lines.push(`Zone Industrielle, Rue 12, Tunis, Tunisie`);
  lines.push(`Tél: +216 71 000 000 | contact@acilretro.com`);
  lines.push(`MF: 0000000A | RC: B0000000 | TVA: 0000000`);
  lines.push(``);
  lines.push(`Date: ${formatDate(order.created_at)}`);
  if (!isInvoice && order.expires_at) lines.push(`Valable jusqu'au: ${formatDate(order.expires_at)}`);
  lines.push(`Client: ${order.customer_type === 'company' ? 'Entreprise' : 'Particulier'}`);
  lines.push(``);
  lines.push(`-----------------------------------------`);
  lines.push(`Désignation          Qté    P.U.    Total`);
  lines.push(`-----------------------------------------`);
  order.order_items.forEach((item) => {
    const name = item.product_name.substring(0, 20).padEnd(20);
    lines.push(`${name} ${String(item.quantity).padStart(3)} ${formatPrice(Number(item.unit_price)).padStart(8)} ${formatPrice(Number(item.unit_price) * item.quantity).padStart(10)}`);
  });
  lines.push(`-----------------------------------------`);
  lines.push(``);
  lines.push(`Sous-total HT:  ${formatPrice(Number(order.subtotal))}`);
  lines.push(`TVA (19%):      ${formatPrice(Number(order.vat))}`);
  lines.push(`Livraison:      ${formatPrice(Number(order.shipping))}`);
  lines.push(`TOTAL TTC:      ${formatPrice(Number(order.total))}`);
  lines.push(``);
  if (order.notes) { lines.push(`Notes: ${order.notes}`); lines.push(``); }
  lines.push(`=========================================`);
  lines.push(`Merci de votre confiance`);

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${isInvoice ? 'Facture' : 'Devis'}-${order.id.slice(0, 8).toUpperCase()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  accepted: 'Accepté',
  paid: 'Payé',
  cancelled: 'Annulé',
  rejected: 'Rejeté',
  quote: 'Devis',
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-600',
    accepted: 'bg-brand-500/10 text-brand-600',
    paid: 'bg-success-500/10 text-success-600',
    cancelled: 'bg-error-500/10 text-error-500',
    rejected: 'bg-error-500/10 text-error-500',
    quote: 'bg-amber-500/10 text-amber-600',
  };
  return <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${colors[status] || 'bg-slate-500/10 text-slate-500'}`}>{statusLabels[status] || status}</span>;
}
