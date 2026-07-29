import { useEffect, useState } from 'react';
import { TrendingUp, ShoppingCart, FileText, Package, Users, AlertTriangle, DollarSign, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatDate } from '@/lib/format';
import type { Order, Product } from '@/types/database';

type Stats = {
  totalRevenue: number;
  totalOrders: number;
  pendingQuotes: number;
  pendingOrders: number;
  totalProducts: number;
  lowStockCount: number;
  totalCustomers: number;
  inventoryValue: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<(Order & { order_items: { product_name: string; quantity: number }[] })[]>([]);
  const [topProducts, setTopProducts] = useState<{ product_name: string; sum: number }[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState<'week' | 'month'>('week');
  const [chartData, setChartData] = useState({ week: [] as number[], month: [] as number[] });
  const [weekLabels, setWeekLabels] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const { data: orders } = await supabase.from('orders').select('*');
      const { data: products } = await supabase.from('products').select('*');
      const { count: customersCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });

      const confirmedOrders = (orders || []).filter((o) => o.status === 'paid');
      const revenue = confirmedOrders.reduce((s, o) => s + Number(o.total), 0);
      const invValue = (products || []).reduce((s, p) => s + Number(p.base_price) * p.stock, 0);

      setStats({
        totalRevenue: revenue,
        totalOrders: (orders || []).filter((o) => o.type === 'order').length,
        pendingQuotes: (orders || []).filter((o) => o.type === 'quote' && o.status === 'pending').length,
        pendingOrders: (orders || []).filter((o) => o.type === 'order' && o.status === 'pending').length,
        totalProducts: products?.length || 0,
        lowStockCount: (products || []).filter((p) => p.stock <= p.min_stock).length,
        totalCustomers: customersCount || 0,
        inventoryValue: invValue,
      });

      const currentYear = new Date().getFullYear();
      const monthTotals = new Array(12).fill(0);
      
      const weekTotals = new Array(7).fill(0);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      confirmedOrders.forEach(o => {
        const d = new Date(o.created_at);
        const amount = Number(o.total) || 0;
        
        if (d.getFullYear() === currentYear) {
          monthTotals[d.getMonth()] += amount;
        }

        if (d >= sevenDaysAgo && d <= today) {
          const diffTime = Math.abs(today.getTime() - d.getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          const index = 6 - diffDays;
          if (index >= 0 && index < 7) {
            weekTotals[index] += amount;
          }
        }
      });

      const daysList = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      const dynamicWeekLabels = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + i);
        return daysList[d.getDay()];
      });

      setChartData({ week: weekTotals, month: monthTotals });
      setWeekLabels(dynamicWeekLabels);

      const { data: recent } = await supabase
        .from('orders')
        .select('*, order_items(product_name, quantity)')
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentOrders(recent || []);

      const { data: top } = await supabase
        .from('order_items')
        .select('product_name, quantity, unit_price')
        .limit(50);
      const productMap = new Map<string, number>();
      (top || []).forEach((t) => {
        productMap.set(t.product_name, (productMap.get(t.product_name) || 0) + t.quantity * Number(t.unit_price));
      });
      setTopProducts([...productMap.entries()].map(([product_name, sum]) => ({ product_name, sum })).sort((a, b) => b.sum - a.sum).slice(0, 5));

      setLowStock((products || []).filter((p) => p.stock <= p.min_stock).slice(0, 5));
      setLoading(false);
    })();
  }, []);

  if (loading || !stats) {
    return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="glass-card h-32 animate-shimmer" />)}</div>;
  }

  const cards = [
    { label: 'Chiffre d\'affaires', value: formatPrice(stats.totalRevenue), icon: DollarSign, trend: '+12.5%', up: true, color: 'from-brand-600 to-brand-500' },
    { label: 'Commandes', value: stats.totalOrders, icon: ShoppingCart, trend: '+8.2%', up: true, color: 'from-accent-500 to-accent-400' },
    { label: 'Devis en attente', value: stats.pendingQuotes, icon: FileText, trend: '-3.1%', up: false, color: 'from-amber-500 to-amber-400' },
    { label: 'Valeur stock', value: formatPrice(stats.inventoryValue), icon: Package, trend: '+5.4%', up: true, color: 'from-success-600 to-success-500' },
  ];

  const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

  const currentData = chartView === 'week' ? chartData.week : chartData.month;
  const currentLabels = chartView === 'week' ? weekLabels : monthLabels;
  const maxData = Math.max(...currentData, 1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="glass-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center shadow-lg`}>
                <c.icon className="w-5 h-5 text-white" />
              </div>
              <span className={`text-xs font-bold flex items-center gap-0.5 ${c.up ? 'text-success-600' : 'text-error-500'}`}>
                {c.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {c.trend}
              </span>
            </div>
            <div className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">{c.value}</div>
            <div className="text-xs text-slate-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                Ventes {chartView === 'week' ? 'de la semaine' : 'de l\'année'}
              </h3>
              <p className="text-xs text-slate-500">Commandes {chartView === 'week' ? 'par jour' : 'par mois'} (TND)</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-lg">
              <button
                onClick={() => setChartView('week')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${chartView === 'week' ? 'bg-white dark:bg-brand-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Semaine
              </button>
              <button
                onClick={() => setChartView('month')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${chartView === 'month' ? 'bg-white dark:bg-brand-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Mois
              </button>
            </div>
          </div>
          <div className="flex items-end justify-between gap-1 sm:gap-2 h-48">
            {currentData.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-brand-700 to-brand-400 hover:from-brand-600 hover:to-brand-300 transition-all cursor-pointer relative group"
                    style={{ height: `${(v / maxData) * 100}%` }}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-900 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      {v > 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap max-w-full">{currentLabels[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="glass-card p-6">
          <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-4">Top produits</h3>
          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune vente enregistrée</p>
            ) : (
              topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-brand-100 dark:bg-brand-800/40 flex items-center justify-center text-xs font-bold text-brand-600 dark:text-brand-300">{i + 1}</span>
                  <span className="text-sm text-slate-700 dark:text-slate-200 truncate flex-1">{p.product_name}</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatPrice(p.sum)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-4">Commandes récentes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100 dark:border-white/10">
                  <th className="pb-3 font-semibold">Réf.</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Statut</th>
                  <th className="pb-3 font-semibold">Total</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-slate-400">Aucune commande</td></tr>
                ) : (
                  recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-slate-50 dark:border-white/5 hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 font-mono text-xs text-slate-600 dark:text-slate-300">#{o.id.slice(0, 8).toUpperCase()}</td>
                      <td className="py-3"><span className="text-xs">{o.type === 'quote' ? 'Devis' : 'Commande'}</span></td>
                      <td className="py-3"><StatusBadge status={o.status} /></td>
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">{formatPrice(Number(o.total))}</td>
                      <td className="py-3 text-xs text-slate-500">{formatDate(o.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-warning-500" />
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Alertes stock</h3>
          </div>
          <div className="space-y-3">
            {lowStock.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune alerte</p>
            ) : (
              lowStock.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-warning-500/10">
                  <Package className="w-4 h-4 text-warning-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-slate-500">Stock: {p.stock} / Min: {p.min_stock}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Commandes en attente', value: stats.pendingOrders, icon: Clock },
          { label: 'Produits totaux', value: stats.totalProducts, icon: Package },
          { label: 'Clients', value: stats.totalCustomers, icon: Users },
          { label: 'Alertes stock', value: stats.lowStockCount, icon: AlertTriangle },
        ].map((s, i) => (
          <div key={i} className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-800/40 flex items-center justify-center">
              <s.icon className="w-5 h-5 text-brand-600 dark:text-brand-300" />
            </div>
            <div>
              <div className="font-display font-bold text-xl text-slate-900 dark:text-white">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-600',
    accepted: 'bg-success-500/10 text-success-600',
    rejected: 'bg-error-500/10 text-error-500',
    cancelled: 'bg-slate-500/10 text-slate-500',
    preparing: 'bg-brand-500/10 text-brand-600',
    delivered: 'bg-success-500/10 text-success-600',
    completed: 'bg-success-500/10 text-success-600',
  };
  const labels: Record<string, string> = {
    pending: 'En attente', accepted: 'Accepté', rejected: 'Rejeté', cancelled: 'Annulé',
    preparing: 'Préparation', delivered: 'Livré', completed: 'Terminé',
  };
  return <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${colors[status] || 'bg-slate-500/10 text-slate-500'}`}>{labels[status] || status}</span>;
}
