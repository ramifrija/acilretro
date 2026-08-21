import { useEffect, useState } from 'react';
import { Search, ShoppingCart, Menu, X, Phone, Mail, MapPin, ChevronDown } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useRouter } from '@/context/RouterContext';
import { supabase } from '@/lib/supabase';
import type { Brand } from '@/types/database';

export default function Header() {
  const { count } = useCart();
  const { navigate, path } = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState({
    email: 'king-glass@hotmail.com',
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
      className={`text-sm font-semibold transition-colors relative group py-2 ${path === to
        ? 'text-white'
        : 'text-white hover:text-white/80'
        }`}
    >
      {label}
      {path === to && (
        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white rounded-full" />
      )}
    </button>
  );

  return (
    <>
      {/* Top bar */}
      <div className="hidden lg:block bg-[#3d6eff] text-white text-sm">
        <div className="container-x flex items-center justify-between py-3">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> {settings.phone}</span>
            <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> {settings.email}</span>
            <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {settings.address}</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-white">
              Livraison rapide partout en Tunisie</span>
            <button onClick={() => navigate('/admin')} className="hover:text-white transition-colors">
              Espace Pro
            </button>
          </div>
        </div>
      </div>

      <header className={`sticky top-0 z-50 transition-all duration-300 bg-[#3d6eff] ${scrolled ? 'shadow-md border-b border-[#2d58d9]' : ''}`}>
        <div className="container-x">
          <div className="flex items-center justify-between gap-4 py-3">
            {/* Logo */}
            <button onClick={() => navigate('/')} className="flex items-center gap-3 shrink-0">
              <div className="w-24 h-24 shrink-0">
                <img src="/images/acil_logo.png" alt="ACIL RETRO Logo" className="w-full h-full object-contain" />
              </div>
              <div className="text-left leading-none">
                <div className="font-display font-extrabold text-3xl text-white tracking-tight">ACIL RETRO</div>
                <div className="text-sm text-white/90 font-medium tracking-wide uppercase mt-1">Spécialiste du Rétroviseur</div>
              </div>
            </button>

            {/* Nav (desktop) */}
            <nav className="hidden md:flex flex-1 items-center justify-center gap-8 mx-4">
              {navLink('/', 'Accueil')}
              {navLink('/catalog', 'Catalogue')}
              {navLink('/brands', 'Marques')}
              {navLink('/contact', 'Contact')}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate('/cart')}
                className="relative p-2.5 rounded-xl hover:bg-white/10 transition-all"
                aria-label="Cart"
              >
                <ShoppingCart className="w-5 h-5 text-white" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center animate-scale-in">
                    {count}
                  </span>
                )}
              </button>
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2.5 rounded-xl hover:bg-white/10 transition-all"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>


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
            <div className="flex flex-col gap-1">
              {[
                ['/', 'Accueil'],
                ['/catalog', 'Catalogue'],
                ['/brands', 'Marques'],
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
