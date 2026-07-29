import { Users, Settings, BarChart3, TrendingUp, ShoppingCart, Package, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import { useEffect, useState } from 'react';

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

export function AdminReports() {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, avgOrder: 0, products: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: orders } = await supabase.from('orders').select('*').eq('type', 'order');
      const { count: products } = await supabase.from('products').select('*', { count: 'exact', head: true });
      const confirmed = (orders || []).filter((o) => ['accepted', 'delivered', 'completed'].includes(o.status));
      const revenue = confirmed.reduce((s, o) => s + Number(o.total), 0);
      setStats({ revenue, orders: (orders || []).length, avgOrder: confirmed.length ? revenue / confirmed.length : 0, products: products || 0 });
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="glass-card h-64 animate-shimmer" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'CA total', value: formatPrice(stats.revenue), icon: DollarSign, color: 'from-brand-600 to-brand-500' },
          { label: 'Commandes', value: stats.orders, icon: ShoppingCart, color: 'from-accent-500 to-accent-400' },
          { label: 'Panier moyen', value: formatPrice(stats.avgOrder), icon: TrendingUp, color: 'from-success-600 to-success-500' },
          { label: 'Produits actifs', value: stats.products, icon: Package, color: 'from-amber-500 to-amber-400' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <div className="font-display font-extrabold text-xl text-slate-900 dark:text-white">{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="glass-card p-6">
        <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Analyse des ventes</h3>
        <p className="text-sm text-slate-500">Rapports détaillés disponibles avec données historiques. Connectez une source de données pour générer des rapports mensuels, trimestriels et annuels.</p>
      </div>
    </div>
  );
}

export function AdminSettings() {
  const [settings, setSettings] = useState({ email: '', phone: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('site_settings').select('*').limit(1).then(({ data }) => {
      if (data && data[0]) {
        setSettings({ email: data[0].email, phone: data[0].phone, address: data[0].address });
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // Since there's only one row, we can just update the one that exists
    await supabase.from('site_settings').update({ 
      email: settings.email, 
      phone: settings.phone, 
      address: settings.address 
    }).neq('id', '00000000-0000-0000-0000-000000000000'); // hacky way to update all or just eq the single ID
    // Better yet, update where email is not null (updates all rows, which is 1)
    await supabase.from('site_settings').update({
      email: settings.email,
      phone: settings.phone,
      address: settings.address
    }).not('id', 'is', null);
    
    // toast or alert
    alert('Paramètres sauvegardés avec succès');
    setSaving(false);
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
          <div><label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Email</label><input value={settings.email} onChange={(e) => setSettings({...settings, email: e.target.value})} className="input-field" /></div>
          <div><label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Téléphone</label><input value={settings.phone} onChange={(e) => setSettings({...settings, phone: e.target.value})} className="input-field" /></div>
          <div className="sm:col-span-2"><label className="text-xs font-semibold text-slate-500 uppercase mb-1.5 block">Adresse</label><input value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})} className="input-field" /></div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary mt-6">
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}
