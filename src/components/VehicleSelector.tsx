import { useEffect, useState, useRef } from 'react';
import { Car, ChevronDown, Search, X } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { supabase } from '@/lib/supabase';
import type { Brand, Model } from '@/types/database';

type Props = { variant?: 'hero' | 'compact'; onClose?: () => void };

export default function VehicleSelector({ variant = 'hero', onClose }: Props) {
  const { navigate } = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [fuel, setFuel] = useState('');
  const [category, setCategory] = useState('');
  
  const [isBrandOpen, setIsBrandOpen] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const brandDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target as Node)) {
        setIsBrandOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredBrands = brands.filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase()));

  useEffect(() => {
    supabase.from('brands').select('*').order('name').then(({ data }) => data && setBrands(data));
  }, []);

  useEffect(() => {
    if (!brand) { setModels([]); return; }
    supabase.from('models').select('*').eq('brand_id', brands.find((b) => b.slug === brand)?.id).order('name')
      .then(({ data }) => setModels(data || []));
  }, [brand, brands]);

  const years: number[] = [];
  const selectedModel = models.find((m) => m.slug === model);
  if (selectedModel?.start_year) {
    const end = selectedModel.end_year || new Date().getFullYear();
    for (let y = end; y >= selectedModel.start_year; y--) years.push(y);
  }

  const search = () => {
    const params = new URLSearchParams();
    if (brand) params.set('brand', brand);
    if (model) params.set('model', model);
    if (year) params.set('year', year);
    if (fuel) params.set('fuel', fuel);
    if (category) params.set('category', category);
    navigate(`/catalog?${params.toString()}`);
    onClose?.();
  };

  const selectClass = variant === 'hero'
    ? 'w-full px-4 py-3.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:ring-2 focus:ring-[#3d6eff]/40 outline-none transition-all appearance-none cursor-pointer hover:bg-slate-100'
    : 'input-field';

  return (
    <div className={variant === 'hero' ? 'bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-2xl shadow-[#3d6eff]/10' : 'glass-card p-4'}>
      {variant === 'hero' && (
        <div className="flex items-center gap-3 mb-6">
          <Car className="w-5 h-5 text-[#3d6eff]" />
          <h3 className="font-bold text-slate-900 text-base">Trouvez votre pièce</h3>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3">
        <div className="relative" ref={brandDropdownRef}>
          <div
            onClick={() => setIsBrandOpen(!isBrandOpen)}
            className={`${selectClass} flex items-center justify-between min-h-[46px] cursor-pointer`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              {brand ? (
                <>
                  {brands.find(b => b.slug === brand)?.logo_url && (
                    <img src={brands.find(b => b.slug === brand)?.logo_url!} alt="" className="w-5 h-5 object-contain" />
                  )}
                  <span className="truncate font-medium">{brands.find(b => b.slug === brand)?.name}</span>
                </>
              ) : (
                <span className="text-slate-500">Marque de la pièce</span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isBrandOpen ? 'rotate-180' : ''}`} />
          </div>
          
          {isBrandOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-brand-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 max-h-64 flex flex-col overflow-hidden">
              <div className="p-2 border-b border-slate-100 dark:border-white/5 relative shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher une marque..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-500"
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto p-1 custom-scrollbar">
                {filteredBrands.length === 0 ? (
                  <div className="p-3 text-center text-sm text-slate-500">Aucune marque trouvée</div>
                ) : (
                  filteredBrands.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setBrand(b.slug);
                        setModel('');
                        setIsBrandOpen(false);
                        setBrandSearch('');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      {b.logo_url ? (
                        <div className="w-8 h-8 shrink-0 bg-white rounded-md border border-slate-100 flex items-center justify-center overflow-hidden p-1 shadow-sm">
                          <img src={b.logo_url} alt={b.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 shrink-0 bg-slate-100 dark:bg-white/10 rounded-md flex items-center justify-center border border-slate-200 dark:border-white/5">
                          <Car className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{b.name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className={`flex gap-3 mt-5 ${variant === 'hero' ? 'justify-start' : ''}`}>
        <button 
          onClick={search} 
          className={variant === 'hero' 
            ? "bg-[#3d6eff] hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors w-auto shadow-md shadow-[#3d6eff]/30" 
            : "btn-primary flex-1 sm:flex-none"}
        >
          <Search className="w-4 h-4" /> Rechercher
        </button>
        {onClose && (
          <button onClick={onClose} className="btn-ghost">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
