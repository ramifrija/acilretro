import { Users, Settings, BarChart3, TrendingUp, ShoppingCart, Package, DollarSign, Calendar, Lock, Trash2, Edit2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('customers').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setCustomers(data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-5 h-5 text-brand-500" />
          <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Clients ({customers.length})</h3>
        </div>
        {loading ? (
          <p className="text-slate-400 text-sm">Chargement...</p>
        ) : customers.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3" />
            <p>Aucun client enregistré pour le moment</p>
            <p className="text-xs mt-1">Les clients apparaîtront ici après création de compte</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500 uppercase">
                <th className="pb-3">Nom</th><th className="pb-3">Type</th><th className="pb-3">Email</th><th className="pb-3">Téléphone</th>
              </tr></thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-t border-slate-50 dark:border-white/5">
                    <td className="py-3 font-medium text-slate-900 dark:text-white">{c.full_name || c.company_name}</td>
                    <td className="py-3">{c.type === 'company' ? 'Entreprise' : 'Particulier'}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">{c.email}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">{c.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminUsers() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ fullName: '', email: '', password: '' });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    const { data } = await supabase.from('customers').select('*').eq('type', 'admin').order('created_at', { ascending: false });
    setAdmins(data || []);
    setLoading(false);
  };

  const handleEdit = (a: any) => {
    setEditingId(a.id);
    setEditName(a.full_name || '');
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    const { error } = await supabase.from('customers').update({ full_name: editName }).eq('id', id);
    if (!error) {
      setAdmins(admins.map(a => a.id === id ? { ...a, full_name: editName } : a));
    } else {
      alert('Erreur lors de la modification');
    }
    setSaving(false);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cet administrateur ? Il perdra ses droits.')) return;
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
      alert('Erreur: ' + error.message);
    } else {
      setAdmins(admins.filter(a => a.id !== id));
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: newAdmin.email,
      password: newAdmin.password,
      options: {
        data: {
          full_name: newAdmin.fullName,
          account_type: 'admin'
        }
      }
    });

    if (signUpError) {
      alert("Erreur: " + signUpError.message);
    } else {
      alert("Administrateur ajouté avec succès.\nAttention : Supabase vous a connecté sur ce nouveau compte. Veuillez vous reconnecter à votre compte principal si nécessaire.");
      setShowAddModal(false);
      setNewAdmin({ fullName: '', email: '', password: '' });
      fetchAdmins();
    }
    setSaving(false);
  };

  if (loading) return <div className="glass-card h-64 animate-shimmer" />;

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Comptes Administrateurs</h2>
          <p className="text-sm text-slate-500">Gérez les accès à l'interface d'administration</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
          <Users className="w-4 h-4" />
          Ajouter un admin
        </button>
      </div>

      <div className="glass-card p-0 overflow-hidden">
        {admins.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3" />
            <p>Aucun administrateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500 uppercase bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10">
                <th className="p-4 font-semibold">Nom</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Création</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr></thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50 dark:border-white/5 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium text-slate-900 dark:text-white">
                      {editingId === a.id ? (
                        <input 
                          type="text" 
                          value={editName} 
                          onChange={(e) => setEditName(e.target.value)}
                          className="input-field py-1 px-2 text-sm max-w-[200px]"
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {a.full_name?.[0] || a.email?.[0] || 'A'}
                          </div>
                          <span className="truncate">{a.full_name || 'Admin'}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{a.email}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{new Date(a.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="p-4 text-right">
                      {editingId === a.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleSave(a.id)} disabled={saving} className="p-1.5 text-success-500 hover:text-success-600 transition-colors">
                            <Lock className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEdit(a)} className="p-1.5 text-brand-500 hover:text-brand-400 transition-colors" title="Modifier le nom">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(a.id)} className="p-1.5 text-red-500 hover:text-red-400 transition-colors" title="Supprimer l'accès admin">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Nouvel Administrateur</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddAdmin} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nom complet</label>
                <input required type="text" value={newAdmin.fullName} onChange={e => setNewAdmin({...newAdmin, fullName: e.target.value})} className="input-field" placeholder="Ex: Jean Dupont" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email de connexion</label>
                <input required type="email" value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} className="input-field" placeholder="Ex: admin@acil-retro.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Mot de passe provisoire</label>
                <input required type="password" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} className="input-field" placeholder="••••••••" minLength={6} />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Création...' : 'Créer le compte'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({ email: '', phone: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);

  useEffect(() => {
    supabase.from('site_settings').select('*').limit(1).then(({ data }) => {
      if (data && data[0]) {
        setSettings({ email: data[0].email, phone: data[0].phone, address: data[0].address });
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (user?.email) {
      setAccountEmail(user.email);
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('site_settings').update({
      email: settings.email,
      phone: settings.phone,
      address: settings.address
    }).not('id', 'is', null);
    
    alert('Paramètres sauvegardés avec succès');
    setSaving(false);
  };

  const handleSaveAccount = async () => {
    setSavingAccount(true);
    const updates: any = {};
    if (accountEmail && accountEmail !== user?.email) updates.email = accountEmail;
    if (accountPassword) updates.password = accountPassword;
    
    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.auth.updateUser(updates);
      if (error) {
        alert('Erreur: ' + error.message);
      } else {
        alert('Compte mis à jour avec succès !');
        setAccountPassword('');
      }
    }
    setSavingAccount(false);
  };

  if (loading) return <div className="glass-card h-64 animate-shimmer" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-brand-500" />
          <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Paramètres de l'entreprise</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Email de contact</label><input value={settings.email} onChange={(e) => setSettings({...settings, email: e.target.value})} className="input-field" /></div>
          <div><label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Téléphone</label><input value={settings.phone} onChange={(e) => setSettings({...settings, phone: e.target.value})} className="input-field" /></div>
          <div className="sm:col-span-2"><label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Adresse</label><input value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})} className="input-field" /></div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary mt-6">
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      <div className="glass-card p-6 border border-brand-500/20">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-brand-500" />
          <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Sécurité du compte (Admin)</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Email de connexion</label>
            <input type="email" value={accountEmail} disabled className="input-field opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Nouveau mot de passe</label>
            <input type="password" placeholder="Laisser vide pour ne pas modifier" value={accountPassword} onChange={(e) => setAccountPassword(e.target.value)} className="input-field" />
          </div>
        </div>
        <button onClick={handleSaveAccount} disabled={savingAccount} className="btn-primary mt-6">
          {savingAccount ? 'Mise à jour...' : 'Mettre à jour le compte'}
        </button>
      </div>
    </div>
  );
}
