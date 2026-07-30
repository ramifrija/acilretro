import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Car, Search, X, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Brand } from '@/types/database';

export default function AdminVehicles() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logo_url: '',
  });
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const imageBitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      ctx.drawImage(imageBitmap, 0, 0);

      const webpBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.85);
      });

      if (!webpBlob) throw new Error('Failed to convert image to WebP');

      const fileName = `${Math.random().toString(36).substring(2, 15)}.webp`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, webpBlob, { contentType: 'image/webp' });

      if (uploadError) {
        alert("Erreur lors de l'upload de l'image.");
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
      setFormData({ ...formData, logo_url: publicUrl });
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la conversion ou de l'upload de l'image.");
    } finally {
      setUploading(false);
    }
  };

  const loadBrands = async () => {
    setLoading(true);
    const { data } = await supabase.from('brands').select('*').order('name');
    if (data) setBrands(data);
    setLoading(false);
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const handleOpenModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({ name: brand.name, slug: brand.slug, logo_url: brand.logo_url || '' });
    } else {
      setEditingBrand(null);
      setFormData({ name: '', slug: '', logo_url: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) return alert('Le nom et le slug sont obligatoires');

    if (editingBrand) {
      const { error } = await supabase.from('brands').update(formData).eq('id', editingBrand.id);
      if (error) return alert('Erreur lors de la modification');
    } else {
      const { error } = await supabase.from('brands').insert([formData]);
      if (error) return alert('Erreur lors de l\'ajout');
    }

    setIsModalOpen(false);
    loadBrands();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette marque ? Cela supprimera également tous les modèles associés.')) return;
    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (error) alert('Erreur lors de la suppression');
    else loadBrands();
  };

  const filteredBrands = brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filteredBrands.length / ITEMS_PER_PAGE);
  const paginatedBrands = filteredBrands.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-900 dark:text-white flex items-center gap-2">
            <Car className="w-6 h-6 text-brand-500" /> Gestion des Marques
          </h2>
          <p className="text-slate-500 text-sm mt-1">Ajoutez, modifiez ou supprimez des marques de véhicules.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          <Plus className="w-4 h-4" /> Nouvelle Marque
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une marque..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="input-field pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Logo</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Marque</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Slug</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">Chargement...</td>
                </tr>
              ) : paginatedBrands.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Aucune marque trouvée.</td>
                </tr>
              ) : (
                paginatedBrands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      {brand.logo_url ? (
                        <img src={brand.logo_url} alt={brand.name} className="w-8 h-8 object-contain" />
                      ) : (
                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-slate-400">
                          {brand.name.charAt(0)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {brand.name}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {brand.slug}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(brand)}
                          className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(brand.id)}
                          className="p-2 text-slate-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-500">
              Affichage de {((currentPage - 1) * ITEMS_PER_PAGE) + 1} à {Math.min(currentPage * ITEMS_PER_PAGE, filteredBrands.length)} sur {filteredBrands.length}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => {
                // Pour éviter d'avoir trop de pages affichées si on a beaucoup de données
                if (
                  totalPages > 7 &&
                  i !== 0 &&
                  i !== totalPages - 1 &&
                  Math.abs(i + 1 - currentPage) > 1
                ) {
                  if (Math.abs(i + 1 - currentPage) === 2) {
                    return <span key={i} className="px-2 text-slate-400">...</span>;
                  }
                  return null;
                }
                
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      currentPage === i + 1
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white dark:bg-brand-900 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">{editingBrand ? 'Modifier la marque' : 'Nouvelle marque'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
                  className="input-field"
                  placeholder="ex: Renault"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="input-field"
                  placeholder="ex: renault"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Logo</label>
                <div className="flex gap-4 items-center mt-2">
                  <label className={`w-24 h-24 shrink-0 flex flex-col items-center justify-center rounded-xl glass border-2 border-dashed border-slate-300 dark:border-white/20 cursor-pointer hover:border-brand-500 hover:text-brand-500 transition-colors text-slate-400 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {uploading ? <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" /> : <Upload className="w-6 h-6 mb-2" />}
                    <span className="text-xs font-semibold">{uploading ? 'Envoi...' : 'Upload'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                  {formData.logo_url && (
                    <div className="w-24 h-24 rounded-xl glass p-2 flex items-center justify-center relative group">
                      <img src={formData.logo_url} alt="Aperçu" className="w-full h-full object-contain" />
                      <button onClick={(e) => { e.preventDefault(); setFormData({ ...formData, logo_url: '' }); }} className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsModalOpen(false)} className="btn-ghost">Annuler</button>
              <button onClick={handleSave} className="btn-primary">Sauvegarder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
