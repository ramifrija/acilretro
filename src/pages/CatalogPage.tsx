import { useEffect, useState, useCallback } from 'react';
import { Filter, X, SlidersHorizontal, Search, PackageSearch } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Brand, Category } from '@/types/database';
import ProductCard from '@/components/ProductCard';
import VehicleSelector from '@/components/VehicleSelector';
import { useRouter } from '@/context/RouterContext';

export default function CatalogPage() {
  const { query } = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showVehicle, setShowVehicle] = useState(false);

  const q = query.get('q') || '';
  const brandFilter = query.get('brand') || '';
  const modelFilter = query.get('model') || '';
  const categoryFilter = query.get('category') || '';
  const filterType = query.get('filter') || '';

  const [sortBy, setSortBy] = useState('relevance');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 300]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    let pq = supabase.from('products').select('*');

    if (q) {
      pq = pq.or(`name.ilike.%${q}%,sku.ilike.%${q}%,oem_ref.ilike.%${q}%,manufacturer_ref.ilike.%${q}%`);
    }
    if (categoryFilter) {
      const cat = await supabase.from('categories').select('id').eq('slug', categoryFilter).maybeSingle();
      if (cat.data) pq = pq.eq('category_id', cat.data.id);
    }
    if (filterType === 'promo') pq = pq.eq('is_promo', true);
    if (filterType === 'best') pq = pq.eq('best_seller', true);
    if (filterType === 'new') pq = pq.eq('new_arrival', true);

    if (brandFilter) {
      const brand = brands.find((b) => b.slug === brandFilter);
      if (brand) {
        pq = pq.eq('brand_id', brand.id);
      } else {
        setProducts([]);
        setLoading(false);
        return;
      }
    }

    const { data } = await pq.order('created_at', { ascending: false });
    let result = data || [];

    // Price filter client-side
    result = result.filter((p) => {
      const price = p.promo_price ?? p.base_price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sort
    if (sortBy === 'price-asc') result = [...result].sort((a, b) => (a.promo_price ?? a.base_price) - (b.promo_price ?? b.base_price));
    if (sortBy === 'price-desc') result = [...result].sort((a, b) => (b.promo_price ?? b.base_price) - (a.promo_price ?? a.base_price));
    if (sortBy === 'rating') result = [...result].sort((a, b) => b.rating - a.rating);

    setProducts(result);
    setLoading(false);
  }, [q, brandFilter, modelFilter, categoryFilter, filterType, sortBy, priceRange, brands]);

  useEffect(() => {
    supabase.from('brands').select('*').order('name').then(({ data }) => data && setBrands(data));
    supabase.from('categories').select('*').order('name').then(({ data }) => data && setCategories(data));
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const activeFilters: string[] = [];
  if (brandFilter) activeFilters.push(`Marque: ${brands.find((b) => b.slug === brandFilter)?.name || brandFilter}`);
  if (modelFilter) activeFilters.push(`Modèle: ${modelFilter}`);
  if (categoryFilter) activeFilters.push(`Catégorie: ${categories.find((c) => c.slug === categoryFilter)?.name || categoryFilter}`);
  if (filterType === 'promo') activeFilters.push('Promotions');
  if (q) activeFilters.push(`Recherche: "${q}"`);

  return (
    <div className="container-x py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-3xl text-slate-900 dark:text-white">
          {filterType === 'promo' ? 'Promotions' : filterType === 'best' ? 'Meilleures ventes' : filterType === 'new' ? 'Nouveautés' : 'Catalogue'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {loading ? 'Chargement...' : `${products.length} produit(s) trouvé(s)`}
        </p>
      </div>

      {/* Brands Bar */}
      {brands.length > 0 && (
        <div className="mb-6 overflow-x-auto pb-4 hide-scrollbar">
          <div className="flex gap-4">
            {brands.map((b) => (
              <a
                key={b.id}
                href={`#/catalog?brand=${b.slug}`}
                className={`flex-shrink-0 flex flex-col items-center justify-center p-4 glass-card hover:border-brand-500/50 transition-all min-w-[100px] ${
                  brandFilter === b.slug ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/50 dark:bg-brand-900/20' : ''
                }`}
              >
                {b.logo_url ? (
                  <img src={b.logo_url} alt={b.name} className="w-12 h-12 object-contain mb-2" />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full mb-2">
                    <span className="font-bold text-slate-400 text-lg">{b.name.charAt(0)}</span>
                  </div>
                )}
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{b.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {activeFilters.map((f, i) => (
            <span key={i} className="px-3 py-1.5 rounded-lg glass text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              {f}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar filters (desktop) */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="glass-card p-5 sticky top-24">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Filtres
            </h3>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Prix (TND)</label>
                <div className="flex items-center gap-2 mt-2">
                  <input type="number" value={priceRange[0]} onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])} className="input-field text-sm py-2" placeholder="Min" />
                  <span className="text-slate-400">-</span>
                  <input type="number" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], +e.target.value])} className="input-field text-sm py-2" placeholder="Max" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Catégories</label>
                <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                  {categories.map((c) => (
                    <a key={c.id} href={`#/catalog?category=${c.slug}`} className="block text-sm text-slate-600 dark:text-slate-300 hover:text-brand-500 transition-colors py-1">
                      {c.name}
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Marques</label>
                <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                  {brands.map((b) => (
                    <a key={b.id} href={`#/catalog?brand=${b.slug}`} className="block text-sm text-slate-600 dark:text-slate-300 hover:text-brand-500 transition-colors py-1">
                      {b.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <button onClick={() => setShowFilters(true)} className="lg:hidden btn-ghost text-sm py-2 px-4">
              <SlidersHorizontal className="w-4 h-4" /> Filtres
            </button>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 hidden sm:block">Trier par:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field text-sm py-2 w-auto">
                <option value="relevance">Pertinence</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
                <option value="rating">Mieux notés</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="glass-card aspect-[4/3] animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:1000px_100%]" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="glass-card p-16 text-center">
              <PackageSearch className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Aucun produit trouvé</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Essayez de modifier vos filtres ou votre recherche</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filters drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85%] bg-white dark:bg-brand-950 shadow-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <span className="font-display font-bold text-lg">Filtres</span>
              <button onClick={() => setShowFilters(false)} className="p-2 rounded-lg glass"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Prix (TND)</label>
                <div className="flex items-center gap-2 mt-2">
                  <input type="number" value={priceRange[0]} onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])} className="input-field text-sm py-2" />
                  <span>-</span>
                  <input type="number" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], +e.target.value])} className="input-field text-sm py-2" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Catégories</label>
                <div className="mt-2 space-y-1.5">
                  {categories.map((c) => (
                    <a key={c.id} href={`#/catalog?category=${c.slug}`} onClick={() => setShowFilters(false)} className="block text-sm text-slate-600 dark:text-slate-300 hover:text-brand-500 py-1">
                      {c.name}
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Marques</label>
                <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                  {brands.map((b) => (
                    <a key={b.id} href={`#/catalog?brand=${b.slug}`} onClick={() => setShowFilters(false)} className="block text-sm text-slate-600 dark:text-slate-300 hover:text-brand-500 py-1">
                      {b.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
