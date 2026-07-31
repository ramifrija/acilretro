import { useState, useEffect } from 'react';
import { Users, Search, Plus, Trash2, Edit2, ArrowLeft, Package, FileText, X, Phone, Mail, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatDate } from '@/lib/format';
import { customAlert, customConfirm } from '@/lib/dialogs';

export default function AdminCustomers() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [clientOrders, setClientOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', num_tel: '' });

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalClients, setTotalClients] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    fetchClients();
  }, [currentPage, searchQuery]);

  const fetchClients = async () => {
    setLoading(true);
    let query = supabase.from('client').select('*', { count: 'exact' });
    
    if (searchQuery.trim()) {
      const s = `%${searchQuery.trim()}%`;
      query = query.or(`nom.ilike.${s},prenom.ilike.${s},email.ilike.${s},num_tel.ilike.${s}`);
    }
    
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
      
    if (!error) {
      setClients(data || []);
      setTotalClients(count || 0);
    }
    setLoading(false);
  };

  const fetchClientOrders = async (client: any) => {
    setLoadingOrders(true);
    let query = supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
    
    // On cherche les commandes liées par client_id (POS) OU par email/téléphone (Site)
    if (client.email && client.num_tel) {
      query = query.or(`client_id.eq.${client.id},customer_info->>email.eq.${client.email},customer_info->>phone.eq.${client.num_tel}`);
    } else if (client.email) {
      query = query.or(`client_id.eq.${client.id},customer_info->>email.eq.${client.email}`);
    } else if (client.num_tel) {
      query = query.or(`client_id.eq.${client.id},customer_info->>phone.eq.${client.num_tel}`);
    } else {
      query = query.eq('client_id', client.id);
    }

    const { data } = await query;
    setClientOrders(data || []);
    setLoadingOrders(false);
  };

  const handleSelectClient = (c: any) => {
    setSelectedClient(c);
    fetchClientOrders(c);
  };

  const openAddModal = () => {
    setForm({ nom: '', prenom: '', email: '', num_tel: '' });
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (c: any) => {
    setForm({ 
      nom: c.nom || '', 
      prenom: c.prenom || '', 
      email: c.email || '', 
      num_tel: c.num_tel || ''
    });
    setEditingId(c.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!(await customConfirm('Voulez-vous vraiment supprimer ce client ?'))) return;
    const { error } = await supabase.from('client').delete().eq('id', id);
    if (!error) fetchClients();
    else customAlert('Erreur: ' + error.message);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      nom: form.nom,
      prenom: form.prenom,
      email: form.email,
      num_tel: form.num_tel
    };

    let error;
    if (editingId) {
      const res = await supabase.from('client').update(payload).eq('id', editingId);
      error = res.error;
    } else {
      const res = await supabase.from('client').insert([payload]);
      error = res.error;
    }

    if (!error) {
      setShowModal(false);
      fetchClients();
      if (selectedClient && selectedClient.id === editingId) {
        setSelectedClient({ ...selectedClient, ...payload });
      }
    } else {
      customAlert('Erreur: ' + error.message);
    }
    setSaving(false);
  };

  const totalPages = Math.ceil(totalClients / itemsPerPage);

  // --- RENDERS ---

  if (selectedOrder) {
    return (
      <div className="space-y-6 animate-fade-in relative">
        <button onClick={() => setSelectedOrder(null)} className="flex items-center gap-2 text-slate-500 hover:text-brand-500 transition-colors mb-4">
          <ArrowLeft className="w-5 h-5" />
          Retour à la fiche client
        </button>
        <div className="glass-card p-6">
          <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-6">
            Détails de la {selectedOrder.type === 'quote' ? 'demande' : 'commande'} #{selectedOrder.id.slice(0, 8)}
          </h2>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-slate-500 mb-1">Date</p>
              <p className="font-medium text-slate-900 dark:text-white">{formatDate(selectedOrder.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Statut</p>
              <p className="font-medium text-slate-900 dark:text-white uppercase">{selectedOrder.status}</p>
            </div>
          </div>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/10">
                  <th className="text-left py-3 font-semibold">Produit</th>
                  <th className="text-center py-3 font-semibold">Qté</th>
                  <th className="text-right py-3 font-semibold">Prix unitaire</th>
                  <th className="text-right py-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.order_items?.map((item: any) => (
                  <tr key={item.id} className="border-b border-slate-50 dark:border-white/5 last:border-0">
                    <td className="py-3 font-medium text-slate-900 dark:text-white">
                      {item.product_name}
                      {item.options_snapshot && item.options_snapshot.map((opt: any, i: number) => (
                        <div key={i} className="text-xs text-slate-500 font-normal">
                          {opt.option}: {opt.value}
                        </div>
                      ))}
                    </td>
                    <td className="py-3 text-center text-slate-600 dark:text-slate-300">{item.quantity}</td>
                    <td className="py-3 text-right text-slate-600 dark:text-slate-300">{formatPrice(item.unit_price)}</td>
                    <td className="py-3 text-right font-medium text-slate-900 dark:text-white">{formatPrice(item.quantity * item.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 dark:border-white/10 pt-4 flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Sous-total:</span><span>{formatPrice(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>TVA:</span><span>{formatPrice(selectedOrder.vat)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>Timbre fiscal:</span><span>{formatPrice(1)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>RAS (1%):</span><span className="text-brand-600 dark:text-brand-400">+{formatPrice((selectedOrder.subtotal + selectedOrder.vat + 1) * 0.01)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-white/10">
                <span>Total:</span><span className="text-brand-600 dark:text-brand-400">{formatPrice(selectedOrder.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedClient) {
    return (
      <div className="space-y-6 animate-fade-in relative">
        <button onClick={() => setSelectedClient(null)} className="flex items-center gap-2 text-slate-500 hover:text-brand-500 transition-colors mb-4">
          <ArrowLeft className="w-5 h-5" />
          Retour à la liste des clients
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-6">
              <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-brand-600" />
              </div>
              <h2 className="font-display font-bold text-2xl text-slate-900 dark:text-white mb-6">
                {selectedClient.prenom} {selectedClient.nom}
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-300">{selectedClient.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-300">{selectedClient.num_tel || 'N/A'}</span>
                </div>
              </div>

            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6">
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-4">Historique des commandes</h3>
              {loadingOrders ? (
                <div className="text-center py-8 text-slate-400">Chargement...</div>
              ) : clientOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune commande trouvée avec cet email ou téléphone.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clientOrders.map(order => (
                    <div 
                      key={order.id} 
                      onClick={() => setSelectedOrder(order)}
                      className="p-4 rounded-xl border border-slate-100 dark:border-white/5 hover:border-brand-500 hover:shadow-md cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          order.type === 'quote' ? 'bg-amber-100 text-amber-600' : 'bg-brand-50 text-brand-600'
                        }`}>
                          {order.type === 'quote' ? <FileText className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {order.type === 'quote' ? 'Devis' : 'Commande'} #{order.id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-slate-500">{formatDate(order.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-brand-600 dark:text-brand-400">{formatPrice(order.total)}</p>
                        <span className="text-xs uppercase tracking-wider text-slate-400 group-hover:text-brand-500 transition-colors">
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Clients</h2>
          <p className="text-sm text-slate-500">Gérez votre base de clients et leurs commandes</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher (nom, email, tel)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 w-full bg-white dark:bg-slate-900"
            />
          </div>
          <button onClick={openAddModal} className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau client</span>
          </button>
        </div>
      </div>

      <div className="glass-card p-0 overflow-hidden">
        {loading ? (
          <div className="h-64 animate-shimmer" />
        ) : clients.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3" />
            <p>Aucun client enregistré</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-xs text-slate-500 uppercase bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10">
                  <th className="p-4 font-semibold">Nom</th>
                  <th className="p-4 font-semibold">Prénom</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Téléphone</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5 cursor-pointer transition-colors">
                    <td className="p-4 font-medium text-slate-900 dark:text-white" onClick={() => handleSelectClient(c)}>
                      {c.nom}
                    </td>
                    <td className="p-4 text-slate-900 dark:text-white" onClick={() => handleSelectClient(c)}>
                      {c.prenom}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300" onClick={() => handleSelectClient(c)}>{c.email || '-'}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300" onClick={() => handleSelectClient(c)}>{c.num_tel || '-'}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={(e) => { e.stopPropagation(); openEditModal(c); }} className="p-1.5 text-brand-500 hover:text-brand-400 transition-colors" title="Modifier">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className="p-1.5 text-red-500 hover:text-red-400 transition-colors" title="Supprimer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Page {currentPage} sur {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                Précédent
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                {editingId ? 'Modifier client' : 'Nouveau client'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nom</label>
                <input required type="text" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} className="input-field" placeholder="Nom de famille" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Prénom</label>
                <input required type="text" value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} className="input-field" placeholder="Prénom" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input-field" placeholder="email@exemple.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Téléphone</label>
                <input type="tel" value={form.num_tel} onChange={e => setForm({...form, num_tel: e.target.value})} className="input-field" placeholder="+216 XX XXX XXX" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
