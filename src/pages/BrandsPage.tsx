import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { supabase } from '@/lib/supabase';
import type { Brand } from '@/types/database';

export default function BrandsPage() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const { navigate } = useRouter();
  const itemsPerPage = 12;

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name', { ascending: true });
        
      if (!error && data) {
        setBrands(data);
      }
      setLoading(false);
    })();
  }, []);

  const filteredBrands = useMemo(() => {
    return brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));
  }, [brands, search]);

  // Reset page to 1 when search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filteredBrands.length / itemsPerPage);
  const currentBrands = filteredBrands.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container-x">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 font-display tracking-tight">Toutes les marques</h1>
            <p className="text-slate-500 mt-2 text-lg max-w-xl">Trouvez la pièce exacte pour votre véhicule parmi nos marques constructeurs partenaires.</p>
          </div>
          <div className="relative shrink-0 w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une marque..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-4 py-3.5 w-full bg-white border-2 border-slate-200 rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all outline-none font-medium text-slate-800 placeholder:font-normal"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="w-12 h-12 animate-spin text-brand-600" />
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 md:p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Aucun résultat</h3>
            <p className="text-slate-500 max-w-md">Nous n'avons trouvé aucune marque correspondant à "{search}".</p>
            <button 
              onClick={() => setSearch('')}
              className="mt-6 px-6 py-2.5 bg-brand-50 text-brand-600 font-bold rounded-xl hover:bg-brand-100 transition-colors"
            >
              Effacer la recherche
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mb-12">
              {currentBrands.map((brand, i) => (
                <button
                  key={i}
                  onClick={() => navigate(`/catalog?brand=${brand.name.toLowerCase()}`)}
                  className="group bg-white rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center border border-slate-200 hover:border-brand-300 shadow-sm hover:shadow-xl transition-all duration-300 aspect-video relative overflow-hidden"
                >
                  {brand.logo_url ? (
                    <img 
                      src={brand.logo_url} 
                      alt={brand.name} 
                      className={`max-w-[120px] max-h-[70px] object-contain opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 z-10 ${['suzuki', 'subaru', 'peugeot'].includes(brand.name.toLowerCase()) ? 'mix-blend-multiply' : ''}`} 
                    />
                  ) : (
                    <div className="text-2xl font-black text-slate-300 group-hover:text-brand-400 group-hover:scale-110 transition-all duration-500 z-10">
                      {brand.name}
                    </div>
                  )}
                  {/* Brand name */}
                  <span className="mt-4 text-sm font-bold text-slate-500 group-hover:text-[#3d6eff] transition-colors z-10 duration-300">
                    {brand.name}
                  </span>
                  
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2.5 rounded-xl bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex gap-1.5 px-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-11 h-11 rounded-xl text-sm font-bold transition-all ${
                        currentPage === i + 1 
                          ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 border-2 border-brand-600 scale-110' 
                          : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2.5 rounded-xl bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
