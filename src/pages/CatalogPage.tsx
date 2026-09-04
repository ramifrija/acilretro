import { useEffect, useState, useCallback } from 'react';
import { Filter, X, SlidersHorizontal, Search, PackageSearch } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Brand, Category } from '@/types/database';
import ProductCard from '@/components/ProductCard';
import VehicleSelector from '@/components/VehicleSelector';
import { useRouter } from '@/context/RouterContext';

const getLogoUrl = (brand: Brand) => {
  const slug = brand.slug.replace(/[-_ ]/g, '').toLowerCase();
  return `/logos/${slug}.png`;
};

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

  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const itemsPerPage = 15;

  const totalPages = Math.max(1, Math.ceil(totalProducts / itemsPerPage));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [q, brandFilter, categoryFilter, filterType, priceRange, sortBy]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    let pq = supabase.from('products_with_price').select('*', { count: 'exact' });

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
        setTotalProducts(0);
        setLoading(false);
        return;
      }
    }

    // Price filter server-side using the view active_price
    pq = pq.gte('active_price', priceRange[0]).lte('active_price', priceRange[1]);

    // Sort server-side
    if (sortBy === 'price-asc') pq = pq.order('active_price', { ascending: true });
    else if (sortBy === 'price-desc') pq = pq.order('active_price', { ascending: false });
    else if (sortBy === 'rating') pq = pq.order('rating', { ascending: false });
    else pq = pq.order('created_at', { ascending: false });

    // Pagination server-side
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    const { data, count } = await pq.range(from, to);

    setProducts(data || []);
    setTotalProducts(count || 0);
    setLoading(false);
  }, [q, brandFilter, modelFilter, categoryFilter, filterType, sortBy, priceRange, brands, currentPage]);

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
          {loading ? 'Chargement...' : `${totalProducts} produit(s) trouvé(s)`}
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
                className={`flex-shrink-0 flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200/50 hover:border-brand-500/50 transition-all min-w-[100px] ${
                  brandFilter === b.slug ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/50 dark:bg-brand-900/20' : 'bg-white/40 dark:bg-slate-900/40'
                }`}
              >
                {getLogoUrl(b) ? (
                  <img 
                    src={getLogoUrl(b)!} 
                    alt={b.name} 
                    onError={(e) => {
                      if (b.logo_url && e.currentTarget.src !== b.logo_url) {
                        e.currentTarget.src = b.logo_url;
                      } else {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }
                    }}
                    className={`w-12 h-12 object-contain mb-2 mix-blend-multiply dark:mix-blend-screen dark:invert opacity-80 group-hover:opacity-100 transition-all ${
                      ['chrysler', 'ds'].includes(b.name.toLowerCase()) ? 'scale-[2.25]' : 
                      ['ford', 'nissan', 'saab', 'skoda', 'smart', 'dodge', 'suzuki', 'subaru', 'volvo'].includes(b.name.toLowerCase()) ? 'scale-[1.75]' : 
                      ['peugeot'].includes(b.name.toLowerCase()) ? 'scale-125' : ''
                    } ${
                      ['peugeot', 'subaru', 'suzuki'].includes(b.name.toLowerCase()) ? 'contrast-200 brightness-110 grayscale' : ''
                    }`} 
                  />
                ) : b.logo_url ? (
                  <img 
                    src={b.logo_url} 
                    alt={b.name} 
                    className={`w-12 h-12 object-contain mb-2 mix-blend-multiply dark:mix-blend-screen dark:invert opacity-80 group-hover:opacity-100 transition-all ${
                      ['chrysler', 'ds'].includes(b.name.toLowerCase()) ? 'scale-[2.25]' : 
                      ['ford', 'nissan', 'saab', 'skoda', 'smart', 'dodge', 'suzuki', 'subaru', 'volvo'].includes(b.name.toLowerCase()) ? 'scale-[1.75]' : 
                      ['peugeot'].includes(b.name.toLowerCase()) ? 'scale-125' : ''
                    } ${
                      ['peugeot', 'subaru', 'suzuki'].includes(b.name.toLowerCase()) ? 'contrast-200 brightness-110 grayscale' : ''
                    }`} 
                  />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full mb-2">
                    <span className="font-bold text-slate-400 text-lg">{b.name.charAt(0)}</span>
                  </div>
                )}
                {/* Fallback container if image fails completely */}
                <div className="w-12 h-12 hidden items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full mb-2">
                  <span className="font-bold text-slate-400 text-lg">{b.name.charAt(0)}</span>
                </div>
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


        {/* Main */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-end gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 hidden sm:block">Trier par:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field text-sm py-2 w-auto">
                <option value="relevance">Pertinence</option>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 dark:border-white/10">
              <span className="text-xs text-slate-500">
                Affichage {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalProducts)} sur {totalProducts} produits
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  ← Préc.
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(n => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
                  .reduce<(number | '...')[]>((acc, n, i, arr) => {
                    if (i > 0 && (n as number) - (arr[i - 1] as number) > 1) acc.push('...');
                    acc.push(n);
                    return acc;
                  }, [])
                  .map((n, i) =>
                    n === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-slate-400 text-xs">…</span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => setCurrentPage(n as number)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all
                          ${currentPage === n ? 'bg-brand-gradient text-white shadow-md shadow-brand-500/20' : 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                      >
                        {n}
                      </button>
                    )
                  )
                }
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  Suiv. →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
