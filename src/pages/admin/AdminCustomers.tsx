import { useState, useEffect, useRef } from "react";
import {
  Users, Search, Plus, Trash2, Edit2, ArrowLeft, Package,
  FileText, X, Phone, Mail, MapPin, ChevronLeft, ChevronRight,
  MoreVertical, Eye, Building2, CreditCard, Calendar, TrendingUp
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatPrice, formatDate } from "@/lib/format";
import { customAlert, customConfirm } from "@/lib/dialogs";

function getInitials(prenom: string, nom: string) {
  return `${(prenom?.[0] || "").toUpperCase()}${(nom?.[0] || "").toUpperCase()}`;
}
const AVATAR_COLORS = ["bg-blue-500","bg-emerald-500","bg-violet-500","bg-amber-500","bg-rose-500","bg-cyan-500","bg-indigo-500","bg-orange-500"];
function getAvatarColor(id: string) {
  const sum = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function ClientAvatar({ client, size = "md" }: { client: any; size?: "sm"|"md"|"lg" }) {
  const sizes = { sm: "w-9 h-9 text-xs", md: "w-11 h-11 text-sm", lg: "w-16 h-16 text-xl" };
  return (
    <div className={`${sizes[size]} ${getAvatarColor(client.id)} rounded-full flex items-center justify-center font-bold text-white shrink-0`}>
      {getInitials(client.prenom, client.nom)}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 dark:border-white/5">
      <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-36 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
        <div className="h-3 w-48 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
      </div>
      <div className="hidden md:block w-32 space-y-1.5">
        <div className="h-3 w-24 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
        <div className="h-3 w-20 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
      </div>
      <div className="w-20 h-3 bg-slate-100 dark:bg-white/5 rounded animate-pulse" />
    </div>
  );
}

function ActionMenu({ position = "bottom", onView, onEdit, onDelete }: { position?: "top" | "bottom"; onView:()=>void; onEdit:()=>void; onDelete:()=>void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100" aria-label="Actions">
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className={`absolute right-0 ${position === "top" ? "bottom-full mb-1.5 origin-bottom-right" : "top-full mt-1.5 origin-top-right"} w-44 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-fade-in`}>
          <button onClick={() => { onView(); setOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
            <Eye className="w-4 h-4 text-slate-400" /> Voir la fiche
          </button>
          <button onClick={() => { onEdit(); setOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
            <Edit2 className="w-4 h-4 text-slate-400" /> Modifier
          </button>
          <div className="my-1 border-t border-slate-100 dark:border-white/5" />
          <button onClick={() => { onDelete(); setOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
        </div>
      )}
    </div>
  );
}

const INPUT_CLS = "w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 dark:focus:border-brand-400 transition-all";

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-rose-500 normal-case tracking-normal font-bold">*</span>}
      </label>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function AdminCustomers() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<any|null>(null);
  const [clientOrders, setClientOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any|null>(null);
  const [ordersPage, setOrdersPage] = useState(1);
  const ORDERS_PER_PAGE = 4;
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nom:"", prenom:"", email:"", num_tel:"", tax_id:"", adresse:"" });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalClients, setTotalClients] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);
  useEffect(() => { fetchClients(); }, [currentPage, searchQuery]);

  const fetchClients = async () => {
    setLoading(true);
    let q = supabase.from("client").select("*", { count: "exact" });
    if (searchQuery.trim()) {
      const s = `%${searchQuery.trim()}%`;
      q = q.or(`nom.ilike.${s},prenom.ilike.${s},email.ilike.${s},num_tel.ilike.${s}`);
    }
    const from = (currentPage - 1) * itemsPerPage;
    const { data, count, error } = await q.order("created_at", { ascending: false }).range(from, from + itemsPerPage - 1);
    if (!error) { setClients(data || []); setTotalClients(count || 0); }
    setLoading(false);
  };

  const fetchClientOrders = async (client: any) => {
    setLoadingOrders(true);
    let q = supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
    if (client.email && client.num_tel) {
      q = q.or(`client_id.eq.${client.id},customer_info->>email.eq.${client.email},customer_info->>phone.eq.${client.num_tel}`);
    } else if (client.email) {
      q = q.or(`client_id.eq.${client.id},customer_info->>email.eq.${client.email}`);
    } else if (client.num_tel) {
      q = q.or(`client_id.eq.${client.id},customer_info->>phone.eq.${client.num_tel}`);
    } else {
      q = q.eq("client_id", client.id);
    }
    const { data } = await q;
    setClientOrders(data || []);
    setLoadingOrders(false);
  };

  const handleSelectClient = (c: any) => { setSelectedClient(c); setOrdersPage(1); fetchClientOrders(c); };
  const openAddModal = () => { setForm({ nom:"", prenom:"", email:"", num_tel:"", tax_id:"", adresse:"" }); setEditingId(null); setShowModal(true); };
  const openEditModal = (c: any) => { setForm({ nom:c.nom||"", prenom:c.prenom||"", email:c.email||"", num_tel:c.num_tel||"", tax_id:c.tax_id||"", adresse:c.adresse||"" }); setEditingId(c.id); setShowModal(true); };

  const handleDelete = async (client: any) => {
    if (!(await customConfirm(<span>Supprimer <span className="text-red-500 font-bold">{client.prenom} {client.nom}</span> ?</span>))) return;
    const { error } = await supabase.from("client").delete().eq("id", client.id);
    if (!error) fetchClients(); else customAlert("Erreur: " + error.message);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const payload = { nom:form.nom, prenom:form.prenom, email:form.email, num_tel:form.num_tel, tax_id:form.tax_id, adresse:form.adresse };
    let error;
    if (editingId) { ({ error } = await supabase.from("client").update(payload).eq("id", editingId)); }
    else { ({ error } = await supabase.from("client").insert([payload])); }
    if (!error) {
      setShowModal(false); fetchClients();
      if (selectedClient && selectedClient.id === editingId) setSelectedClient({ ...selectedClient, ...payload });
    } else customAlert("Erreur: " + error.message);
    setSaving(false);
  };

  const totalPages = Math.ceil(totalClients / itemsPerPage);

  const renderFormModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-start justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">{editingId ? "Modifier le client" : "Ajouter un client"}</h3>
            <p className="text-sm text-slate-500 mt-0.5">{editingId ? "Mettez à jour les informations." : "Renseignez les informations du nouveau client."}</p>
          </div>
          <button onClick={() => setShowModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/10 transition-all" aria-label="Fermer"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSave}>
          <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Informations personnelles</p>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Nom" required><input required type="text" value={form.nom} onChange={e => setForm({...form,nom:e.target.value})} className={INPUT_CLS} placeholder="Dupont" /></FormField>
                <FormField label="Prénom" required><input required type="text" value={form.prenom} onChange={e => setForm({...form,prenom:e.target.value})} className={INPUT_CLS} placeholder="Jean" /></FormField>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Contact</p>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Téléphone"><input type="tel" value={form.num_tel} onChange={e => setForm({...form,num_tel:e.target.value})} className={INPUT_CLS} placeholder="+216 XX XXX XXX" /></FormField>
                <FormField label="Email"><input type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} className={INPUT_CLS} placeholder="email@exemple.com" /></FormField>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Fiscal &amp; Adresse</p>
              <div className="space-y-4">
                <FormField label="Matricule Fiscal / RC"><input type="text" value={form.tax_id} onChange={e => setForm({...form,tax_id:e.target.value})} className={INPUT_CLS} placeholder="Ex: 1234567M/A/M000" /></FormField>
                <FormField label="Adresse complète"><input type="text" value={form.adresse} onChange={e => setForm({...form,adresse:e.target.value})} className={INPUT_CLS} placeholder="Rue, ville, code postal..." /></FormField>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 flex justify-end gap-3 bg-slate-50/50 dark:bg-white/2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-5">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary px-5 flex items-center gap-2 min-w-[185px] justify-center">
              {saving ? <><Spinner /> Enregistrement...</> : (editingId ? "Enregistrer les modifications" : "Créer le client")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ORDER DETAIL VIEW
  if (selectedOrder) {
    return (
      <div className="space-y-6 animate-fade-in">
        <button onClick={() => setSelectedOrder(null)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-medium"><ArrowLeft className="w-4 h-4" /> Retour à la fiche client</button>
        <div className="glass-card p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white">{selectedOrder.type === "quote" ? "Devis" : "Commande"} #{selectedOrder.id.slice(0,8).toUpperCase()}</h2>
              <p className="text-sm text-slate-500 mt-1">{formatDate(selectedOrder.created_at)}</p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${selectedOrder.status === "completed" ? "bg-emerald-100 text-emerald-700" : selectedOrder.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{selectedOrder.status}</span>
          </div>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead><tr className="text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100 dark:border-white/10">
                <th className="text-left py-3">Produit</th><th className="text-center py-3 w-16">Qté</th><th className="text-right py-3 w-32">Prix unit.</th><th className="text-right py-3 w-32">Total</th>
              </tr></thead>
              <tbody>
                {selectedOrder.order_items?.map((item: any) => (
                  <tr key={item.id} className="border-b border-slate-50 dark:border-white/5 last:border-0">
                    <td className="py-3 font-medium text-slate-900 dark:text-white">{item.product_name}{item.options_snapshot?.map((o: any, i: number) => <div key={i} className="text-xs text-slate-400 font-normal">{o.option}: {o.value}</div>)}</td>
                    <td className="py-3 text-center text-slate-600 dark:text-slate-300">{item.quantity}</td>
                    <td className="py-3 text-right text-slate-600 dark:text-slate-300">{formatPrice(item.unit_price)}</td>
                    <td className="py-3 text-right font-semibold text-slate-900 dark:text-white">{formatPrice(item.quantity * item.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 dark:border-white/10 pt-4 flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm text-slate-500"><span>Sous-total</span><span>{formatPrice(selectedOrder.subtotal)}</span></div>
              <div className="flex justify-between text-sm text-slate-500"><span>TVA</span><span>{formatPrice(selectedOrder.vat)}</span></div>
              <div className="flex justify-between text-sm text-slate-500"><span>Timbre fiscal</span><span>{formatPrice(1)}</span></div>
              <div className="flex justify-between text-sm text-slate-500"><span>RAS (1%)</span><span className="text-brand-600 dark:text-brand-400">+{formatPrice((selectedOrder.subtotal + selectedOrder.vat + 1) * 0.01)}</span></div>
              <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-white/10"><span>Total TTC</span><span className="text-brand-600 dark:text-brand-400">{formatPrice(selectedOrder.total)}</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CLIENT DETAIL VIEW
  if (selectedClient) {
    const totalRevenue = clientOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const lastOrder = clientOrders[0];
    return (
      <div className="space-y-6 animate-fade-in">
        <button onClick={() => setSelectedClient(null)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-medium"><ArrowLeft className="w-4 h-4" /> Retour aux clients</button>
        <div className="glass-card p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <ClientAvatar client={selectedClient} size="lg" />
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-bold text-2xl text-slate-900 dark:text-white">{selectedClient.prenom} {selectedClient.nom}</h2>
              {selectedClient.tax_id && <div className="flex items-center gap-1.5 mt-1"><CreditCard className="w-3.5 h-3.5 text-slate-400" /><span className="text-sm text-slate-500 font-mono">{selectedClient.tax_id}</span></div>}
            </div>
            <button onClick={() => openEditModal(selectedClient)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"><Edit2 className="w-4 h-4" /> Modifier</button>
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-5">
            <div className="glass-card p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Coordonnées</h3>
              <div className="space-y-3.5">
                {[{ icon: Mail, label: "Email", val: selectedClient.email }, { icon: Phone, label: "Téléphone", val: selectedClient.num_tel }, { icon: MapPin, label: "Adresse", val: selectedClient.adresse }].map(({ icon: Ic, label, val }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0"><Ic className="w-4 h-4 text-slate-500" /></div>
                    <div><p className="text-[11px] text-slate-400 font-medium">{label}</p><p className="text-sm text-slate-900 dark:text-white">{val || "—"}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Statistiques</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between"><div className="flex items-center gap-2.5"><Package className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-600 dark:text-slate-400">Commandes</span></div><span className="text-sm font-bold text-slate-900 dark:text-white">{clientOrders.length}</span></div>
                <div className="flex items-center justify-between"><div className="flex items-center gap-2.5"><TrendingUp className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-600 dark:text-slate-400">CA total</span></div><span className="text-sm font-bold text-brand-600 dark:text-brand-400">{formatPrice(totalRevenue)}</span></div>
                {lastOrder && <div className="flex items-center justify-between"><div className="flex items-center gap-2.5"><Calendar className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-600 dark:text-slate-400">Dernière cmd</span></div><span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{formatDate(lastOrder.created_at)}</span></div>}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="glass-card p-5">
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white mb-5">Historique des commandes</h3>
              {loadingOrders ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />)}</div>
              ) : clientOrders.length === 0 ? (
                <div className="text-center py-14">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4"><Package className="w-7 h-7 text-slate-300" /></div>
                  <p className="font-medium text-slate-500">Aucune commande</p>
                  <p className="text-sm text-slate-400 mt-1">Ce client n'a pas encore de commandes.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {clientOrders.slice((ordersPage-1)*ORDERS_PER_PAGE, ordersPage*ORDERS_PER_PAGE).map(order => (
                    <div key={order.id} onClick={() => setSelectedOrder(order)} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-white/5 hover:border-brand-400 hover:bg-brand-50/30 dark:hover:bg-brand-500/5 cursor-pointer transition-all group">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${order.type === "quote" ? "bg-amber-100 text-amber-600" : "bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"}`}>{order.type === "quote" ? <FileText className="w-4 h-4" /> : <Package className="w-4 h-4" />}</div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{order.type === "quote" ? "Devis" : "Commande"} #{order.id.slice(0,8).toUpperCase()}</p>
                          <p className="text-xs text-slate-400">{formatDate(order.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-brand-600 dark:text-brand-400">{formatPrice(order.total)}</p>
                        <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${order.status === "completed" ? "bg-emerald-100 text-emerald-600" : order.status === "pending" ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"}`}>{order.status}</span>
                      </div>
                    </div>
                  ))}
                  {clientOrders.length > ORDERS_PER_PAGE && (
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                      <span className="text-xs text-slate-400">{((ordersPage-1)*ORDERS_PER_PAGE)+1}–{Math.min(ordersPage*ORDERS_PER_PAGE, clientOrders.length)} sur {clientOrders.length}</span>
                      <div className="flex gap-2">
                        <button onClick={() => setOrdersPage(p => Math.max(1,p-1))} disabled={ordersPage===1} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-white/10 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">← Préc.</button>
                        <button onClick={() => setOrdersPage(p => Math.min(Math.ceil(clientOrders.length/ORDERS_PER_PAGE),p+1))} disabled={ordersPage===Math.ceil(clientOrders.length/ORDERS_PER_PAGE)} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-white/10 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">Suiv. →</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {showModal && renderFormModal()}
      </div>
    );
  }

  // MAIN LIST VIEW
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Clients</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gérez vos clients, leurs coordonnées et historique.</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"><Plus className="w-4 h-4" /> Ajouter un client</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Users, label: "Total clients", val: String(totalClients), color: "bg-brand-100 dark:bg-brand-500/20", ic: "text-brand-600 dark:text-brand-400" },
          { icon: Building2, label: "Cette page", val: String(clients.length), color: "bg-emerald-100 dark:bg-emerald-500/20", ic: "text-emerald-600 dark:text-emerald-400" },
        ].map(({ icon: Ic, label, val, color, ic }) => (
          <div key={label} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-3"><div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center`}><Ic className={`w-4 h-4 ${ic}`} /></div><span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span></div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{val}</p>
          </div>
        ))}
        <div className="glass-card p-5 hidden lg:block">
          <div className="flex items-center gap-3 mb-3"><div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center"><FileText className="w-4 h-4 text-violet-600 dark:text-violet-400" /></div><span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Page</span></div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{currentPage}<span className="text-base font-semibold text-slate-400"> / {totalPages||1}</span></p>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input type="text" placeholder="Rechercher par nom, prénom, email ou téléphone..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all" />
          {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-4 h-4" /></button>}
        </div>
        {searchQuery && <p className="text-xs text-slate-500 mt-2 px-1">{totalClients} résultat{totalClients!==1?"s":""} pour « {searchQuery} »</p>}
      </div>

      <div className="glass-card">
        <div className="hidden md:grid grid-cols-[1fr_180px_120px_48px] items-center px-6 py-3 bg-slate-50/70 dark:bg-white/3 border-b border-slate-100 dark:border-white/5 rounded-t-2xl">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Client</span>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Contact</span>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">MF / RC</span>
          <span className="sr-only">Actions</span>
        </div>
        {loading ? (
          <div>{[1,2,3,4,5].map(i => <SkeletonRow key={i} />)}</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-5"><Users className="w-8 h-8 text-slate-300" /></div>
            {searchQuery ? (
              <><p className="font-semibold text-slate-600 dark:text-slate-300">Aucun client trouvé</p><p className="text-sm text-slate-400 mt-1">Essayez de modifier votre recherche.</p><button onClick={() => setSearchQuery("")} className="mt-4 text-sm text-brand-600 dark:text-brand-400 hover:underline font-medium">Réinitialiser</button></>
            ) : (
              <><p className="font-semibold text-slate-600 dark:text-slate-300">Aucun client enregistré</p><p className="text-sm text-slate-400 mt-1">Commencez par ajouter votre premier client.</p><button onClick={openAddModal} className="btn-primary mt-5 flex items-center gap-2 mx-auto"><Plus className="w-4 h-4" /> Ajouter un client</button></>
            )}
          </div>
        ) : (
          <div>
            {clients.map((c, idx) => (
              <div key={c.id} onClick={() => handleSelectClient(c)} className={`group flex items-center gap-4 px-6 py-4 cursor-pointer transition-all hover:bg-slate-50/80 dark:hover:bg-white/3 ${idx!==clients.length-1?"border-b border-slate-100 dark:border-white/5":""}`}>
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <ClientAvatar client={c} size="md" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{c.prenom} {c.nom}</p>
                    {c.adresse && <p className="text-xs text-slate-400 truncate mt-0.5">{c.adresse}</p>}
                  </div>
                </div>
                <div className="hidden md:flex flex-col gap-1 w-44 shrink-0">
                  {c.num_tel && <div className="flex items-center gap-1.5 text-xs text-slate-500"><Phone className="w-3 h-3 text-slate-400 shrink-0" /><span className="truncate">{c.num_tel}</span></div>}
                  {c.email && <div className="flex items-center gap-1.5 text-xs text-slate-500"><Mail className="w-3 h-3 text-slate-400 shrink-0" /><span className="truncate">{c.email}</span></div>}
                  {!c.num_tel && !c.email && <span className="text-xs text-slate-300">—</span>}
                </div>
                <div className="hidden md:block w-28 shrink-0">
                  {c.tax_id ? <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded">{c.tax_id}</span> : <span className="text-xs text-slate-300">—</span>}
                </div>
                <div className="shrink-0"><ActionMenu position={idx >= Math.max(0, clients.length - 2) ? "top" : "bottom"} onView={() => handleSelectClient(c)} onEdit={() => openEditModal(c)} onDelete={() => handleDelete(c)} /></div>
              </div>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/2 rounded-b-2xl">
            <span className="text-xs text-slate-500">{((currentPage-1)*itemsPerPage)+1}–{Math.min(currentPage*itemsPerPage,totalClients)} sur <span className="font-semibold">{totalClients}</span> clients</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentPage(p => Math.max(1,p-1))} disabled={currentPage===1} className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 disabled:opacity-30 hover:bg-white dark:hover:bg-white/5 transition-colors" aria-label="Page précédente"><ChevronLeft className="w-4 h-4" /></button>
              {Array.from({length:totalPages},(_,i)=>i+1).filter(n=>n===1||n===totalPages||Math.abs(n-currentPage)<=1).reduce<(number|"...")[]>((acc,n,i,arr)=>{if(i>0&&(n as number)-(arr[i-1] as number)>1)acc.push("...");acc.push(n);return acc;},[]).map((n,i)=>n==="..."?(<span key={`e${i}`} className="px-1 text-slate-400 text-xs">…</span>):(<button key={n} onClick={()=>setCurrentPage(n as number)} className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${currentPage===n?"bg-brand-gradient text-white shadow-md":"border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/5"}`}>{n}</button>))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages,p+1))} disabled={currentPage===totalPages} className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 disabled:opacity-30 hover:bg-white dark:hover:bg-white/5 transition-colors" aria-label="Page suivante"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
      {showModal && renderFormModal()}
    </div>
  );
}
