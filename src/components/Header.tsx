import { useEffect, useState } from 'react';
import { Search, ShoppingCart, Moon, Sun, Menu, X, Phone, Mail, MapPin, ChevronDown } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useRouter } from '@/context/RouterContext';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import type { Brand } from '@/types/database';

export default function Header() {
  const { count } = useCart();
  const { navigate, path } = useRouter();
  const { dark, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState({ 
    email: 'contact@acilretro.com', 
    phone: '+216 71 000 000', 
    address: 'Zone Industrielle, Tunis' 
  });

  useEffect(() => {
    supabase.from('site_settings').select('*').limit(1).then(({ data }) => {
      if (data && data[0]) setSettings(data[0]);
    });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    supabase.from('brands').select('id, name, slug, logo_url, country').order('name').then(({ data }) => data && setBrands(data));
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/catalog?q=${encodeURIComponent(search.trim())}`);
  };

  const navLink = (to: string, label: string) => (
    <button
      onClick={() => navigate(to)}
      className={`text-sm font-medium transition-colors hover:text-brand-500 ${
        path === to ? 'text-brand-500' : 'text-slate-700 dark:text-slate-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      {/* Top bar */}
      <div className="hidden lg:block bg-brand-950 text-brand-100 text-xs">
        <div className="container-x flex items-center justify-between py-2">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {settings.phone}</span>
            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {settings.email}</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {settings.address}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Livraison rapide partout en Tunisie</span>
            <button onClick={() => navigate('/admin')} className="hover:text-white transition-colors">
              Espace Pro
            </button>
          </div>
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass shadow-glass' : 'bg-transparent'
        }`}
      >
        <div className="container-x">
          <div className="flex items-center justify-between gap-4 py-3">
            {/* Logo */}
            <button onClick={() => navigate('/')} className="flex items-center gap-2.5 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-brand-600/30">
                <span className="text-white font-display font-extrabold text-lg">A</span>
              </div>
              <div className="text-left leading-none">
                <div className="font-display font-extrabold text-lg text-brand-900 dark:text-white tracking-tight">ACIL RETRO</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase">Pièces Auto Premium</div>
              </div>
            </button>

            {/* Search (desktop) */}
            <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-xl mx-4">
              <div className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par référence, pièce, véhicule..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl glass text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500/40 outline-none transition-all"
                />
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={toggle}
                className="p-2.5 rounded-xl glass hover:bg-white/90 dark:hover:bg-white/10 transition-all"
                aria-label="Toggle theme"
              >
                {dark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-brand-700" />}
              </button>
              <button
                onClick={() => navigate('/cart')}
                className="relative p-2.5 rounded-xl glass hover:bg-white/90 dark:hover:bg-white/10 transition-all"
                aria-label="Cart"
              >
                <ShoppingCart className="w-5 h-5 text-brand-700 dark:text-brand-200" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center animate-scale-in">
                    {count}
                  </span>
                )}
              </button>
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2.5 rounded-xl glass"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Nav (desktop) */}
          <nav className="hidden md:flex items-center justify-between pb-3 gap-6">
            <div className="flex items-center gap-6">
              {navLink('/', 'Accueil')}
              <div className="relative group">
                <button className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1 hover:text-brand-500 transition-colors">
                  Sélectionner véhicule <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-64 glass-card p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 max-h-96 overflow-y-auto">
                  {brands.map((b) => (
                    <button
                      key={b.slug}
                      onClick={() => navigate(`/catalog?brand=${b.slug}`)}
                      className="block w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-brand-50 dark:hover:bg-white/10 transition-colors"
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
              {navLink('/catalog', 'Catalogue')}
              {navLink('/catalog?filter=promo', 'Promotions')}
              {navLink('/quote', 'Demander un devis')}
              {navLink('/contact', 'Contact')}
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden animate-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85%] bg-white dark:bg-brand-950 shadow-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <span className="font-display font-bold text-lg">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg glass">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitSearch} className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="input-field pl-10"
                />
              </div>
            </form>
            <div className="flex flex-col gap-1">
              {[
                ['/', 'Accueil'],
                ['/catalog', 'Catalogue'],
                ['/catalog?filter=promo', 'Promotions'],
                ['/quote', 'Demander un devis'],
                ['/contact', 'Contact'],
                ['/admin', 'Espace Pro'],
              ].map(([to, label]) => (
                <button
                  key={to}
                  onClick={() => { navigate(to); setMobileOpen(false); }}
                  className="text-left px-4 py-3 rounded-xl hover:bg-brand-50 dark:hover:bg-white/10 font-medium transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
