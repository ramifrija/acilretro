import { useEffect, useState } from 'react';
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
    ? 'w-full px-4 py-3 rounded-xl bg-white/90 dark:bg-brand-900/60 border border-white/30 dark:border-white/10 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-brand-500/40 outline-none transition-all appearance-none cursor-pointer'
    : 'input-field';

  return (
    <div className={variant === 'hero' ? 'glass-card p-6' : 'glass-card p-4'}>
      {variant === 'hero' && (
        <div className="flex items-center gap-2 mb-4">
          <Car className="w-5 h-5 text-brand-500" />
          <h3 className="font-display font-bold text-brand-900 dark:text-white">Trouvez votre pièce</h3>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3">
        <div className="relative">
          <select value={brand} onChange={(e) => { setBrand(e.target.value); setModel(''); }} className={selectClass}>
            <option value="">Marque</option>
            {brands.map((b) => <option key={b.id} value={b.slug}>{b.name}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button onClick={search} className="btn-primary flex-1 sm:flex-none">
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
