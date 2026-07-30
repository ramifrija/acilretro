import { useState, type ReactNode } from 'react';
import { LayoutDashboard, Package, ShoppingCart, FileText, Users, Warehouse, Settings, Menu, X, Store, BarChart3, ArrowLeft, LogOut, Car } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({ children, section }: { children: ReactNode; section: string }) {
  const { navigate } = useRouter();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nav = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, path: '/admin' },
    { id: 'products', label: 'Produits', icon: Package, path: '/admin/products' },
    { id: 'vehicles', label: 'Véhicules', icon: Car, path: '/admin/vehicles' },
    { id: 'orders', label: 'Commandes', icon: ShoppingCart, path: '/admin/orders' },
    { id: 'quotes', label: 'Devis', icon: FileText, path: '/admin/quotes' },
    { id: 'inventory', label: 'Inventaire', icon: Warehouse, path: '/admin/inventory' },
    { id: 'customers', label: 'Clients', icon: Users, path: '/admin/customers' },
    { id: 'pos', label: 'Point de vente', icon: Store, path: '/admin/pos' },
    { id: 'users', label: 'Utilisateurs', icon: Users, path: '/admin/users' },
    { id: 'settings', label: 'Paramètres', icon: Settings, path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-brand-950 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-brand-950 text-brand-100 z-50 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center">
              <span className="text-white font-display font-extrabold text-lg">A</span>
            </div>
            <div>
              <div className="font-display font-extrabold text-sm text-white">ACIL RETRO</div>
              <div className="text-[10px] text-brand-400 uppercase tracking-wide">ERP Admin</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg glass">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => { navigate(n.path); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                section === n.id
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                  : 'text-brand-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <n.icon className="w-4.5 h-4.5 shrink-0" />
              {n.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-brand-300 hover:bg-white/5 hover:text-white transition-all">
            <ArrowLeft className="w-4 h-4" /> Retour au site
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 glass border-b border-white/10 px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg glass">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-display font-bold text-lg text-slate-900 dark:text-white capitalize">
              {nav.find((n) => n.id === section)?.label || 'Admin'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 mr-4">
              <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold text-sm uppercase">
                {user?.email?.[0] || 'A'}
              </div>
              <div className="text-sm">
                <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
                  {user?.email || 'Admin'}
                </div>
                <div className="text-xs text-slate-500">Administrateur</div>
              </div>
            </div>
            <button
              onClick={async () => {
                await signOut();
                navigate('/admin/login');
              }}
              className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
