import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, X, Package, AlertTriangle, Upload, Image as ImageIcon, Link as LinkIcon, ListPlus, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import type { Product, Category, Brand, Model } from '@/types/database';
import { customAlert, customConfirm } from '@/lib/dialogs';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'name' | 'brand' | 'price' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 10;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data || []);
    const { data: cats } = await supabase.from('categories').select('*').order('name');
    setCategories(cats || []);
    const { data: brs } = await supabase.from('brands').select('*').order('name');
    setBrands(brs || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleSort = (field: 'name' | 'brand' | 'price') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  let filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.oem_ref?.toLowerCase().includes(search.toLowerCase()),
  );

  if (sortField) {
    filtered.sort((a, b) => {
      let aVal: any = a[sortField === 'brand' ? 'brand_id' : sortField === 'price' ? (a.promo_price ?? a.base_price) : 'name'];
      let bVal: any = b[sortField === 'brand' ? 'brand_id' : sortField === 'price' ? (b.promo_price ?? b.base_price) : 'name'];
      
      if (sortField === 'brand') {
        aVal = brands.find(br => br.id === a.brand_id)?.name || '';
        bVal = brands.find(br => br.id === b.brand_id)?.name || '';
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = async (id: string) => {
    if (!(await customConfirm('Supprimer ce produit?'))) return;
    await supabase.from('products').delete().eq('id', id);
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit..." className="input-field pl-10" />
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Ajouter un produit
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/5">
              <tr className="text-left text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-colors" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">Produit {sortField === 'name' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>)}</div>
                </th>
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-colors" onClick={() => handleSort('brand')}>
                  <div className="flex items-center gap-1">Marque {sortField === 'brand' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>)}</div>
                </th>
                <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-colors" onClick={() => handleSort('price')}>
                  <div className="flex items-center gap-1">Prix {sortField === 'price' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>)}</div>
                </th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-10 text-center text-slate-400">Chargement...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-slate-400"><Package className="w-10 h-10 mx-auto mb-2" />Aucun produit</td></tr>
              ) : (
                paginated.map((p) => (
                  <tr key={p.id} className="border-t border-slate-50 dark:border-white/5 hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-brand-900/30 shrink-0">
                          {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white line-clamp-1">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-xs">{p.sku}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                      {brands.find(b => b.id === p.brand_id)?.name || '-'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {p.promo_price ? (
                        <div>
                          <span>{formatPrice(p.promo_price)}</span>
                          <span className="block text-xs text-slate-400 line-through">{formatPrice(p.base_price)}</span>
                        </div>
                      ) : formatPrice(p.base_price)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${p.stock <= p.min_stock ? 'bg-error-500/10 text-error-500' : 'bg-success-500/10 text-success-600'}`}>
                        {p.stock <= p.min_stock && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setEditing(p); setShowForm(true); }} className="p-2 rounded-lg hover:bg-brand-50 dark:hover:bg-white/10 text-slate-500 hover:text-brand-500 transition-all">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-error-500/10 text-slate-500 hover:text-error-500 transition-all">
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
      </div>

      {totalPages > 1 && (
        <div className="p-4 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Page {currentPage} sur {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              Précédent
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {showForm && <ProductForm product={editing} categories={categories} onClose={() => setShowForm(false)} onSaved={load} />}
    </div>
  );
}

function ProductForm({ product, categories, onClose, onSaved }: { product: Product | null; categories: Category[]; onClose: () => void; onSaved: () => void }) {
  const [activeTab, setActiveTab] = useState<'info'|'images'|'compat'|'options'>('info');
  
  const [form, setForm] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    category_id: product?.category_id || '',
    brand_id: product?.brand_id || '',
    base_price: product?.base_price?.toString() || '',
    promo_price: product?.promo_price?.toString() || '',
    sku: product?.sku || '',
    oem_ref: product?.oem_ref || '',
    manufacturer_ref: product?.manufacturer_ref || '',
    weight: product?.weight || '',
    dimensions: product?.dimensions || '',
    warranty: product?.warranty || '',
    delivery_time: product?.delivery_time || '',
    stock: product?.stock?.toString() || '0',
    min_stock: product?.min_stock?.toString() || '5',
    warehouse_location: product?.warehouse_location || '',
    purchase_price: product?.purchase_price?.toString() || '0',
    featured: product?.featured || false,
    best_seller: product?.best_seller || false,
    new_arrival: product?.new_arrival || false,
    is_promo: product?.is_promo || false,
  });

  const [images, setImages] = useState<string[]>(product?.images || []);
  const [uploading, setUploading] = useState(false);

  // Options
  const [options, setOptions] = useState<any[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('brands').select('*').order('name').then(({ data }) => data && setBrands(data));

    if (product) {
      supabase.from('product_options').select('*, option_values(*)').eq('product_id', product.id).then(({ data }) => {
        if (data) setOptions(data);
      });
    }
  }, [product]);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      // Convert to webp
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
        customAlert("Erreur lors de l'upload de l'image. Le bucket product-images existe-t-il?");
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
      setImages([...images, publicUrl]);
    } catch (err) {
      console.error(err);
      customAlert("Erreur lors de la conversion ou de l'upload de l'image.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Accessories logic
  const addOption = () => setOptions([...options, { id: `new_${Date.now()}`, name: '', required: false, option_values: [] }]);
  const updateOption = (idx: number, field: string, val: any) => {
    const newOpts = [...options];
    newOpts[idx][field] = val;
    setOptions(newOpts);
  };
  const addOptionValue = (optIdx: number) => {
    const newOpts = [...options];
    newOpts[optIdx].option_values.push({ id: `new_val_${Date.now()}`, value: '', description: '', price_modifier: 0, image_url: '' });
    setOptions(newOpts);
  };
  const updateOptionValue = (optIdx: number, valIdx: number, field: string, val: any) => {
    const newOpts = [...options];
    newOpts[optIdx].option_values[valIdx][field] = val;
    setOptions(newOpts);
  };

  const save = async () => {
    if (!form.name || !form.base_price) {
      customAlert('Veuillez remplir les champs obligatoires (Nom, Prix)');
      return;
    }

    // Ensure promo price is cleared if promo is not checked
    const finalPromoPrice = form.is_promo ? form.promo_price : null;

    setSaving(true);
    const finalSlug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const data = {
      name: form.name,
      slug: product ? finalSlug : `${finalSlug}-${Math.random().toString(36).substring(2, 8)}`,
      description: form.description,
      category_id: form.category_id || null,
      brand_id: form.brand_id || null,
      base_price: Number(form.base_price) || 0,
      promo_price: finalPromoPrice ? Number(finalPromoPrice) : null,
      sku: form.sku || null,
      oem_ref: form.oem_ref || null,
      manufacturer_ref: form.manufacturer_ref || null,
      weight: form.weight,
      dimensions: form.dimensions,
      warranty: form.warranty,
      delivery_time: form.delivery_time,
      stock: Number(form.stock) || 0,
      min_stock: Number(form.min_stock) || 5,
      warehouse_location: form.warehouse_location,
      purchase_price: Number(form.purchase_price) || 0,
      images,
      featured: form.featured,
      best_seller: form.best_seller,
      new_arrival: form.new_arrival,
      is_promo: form.is_promo,
    };

    let productId = product?.id;

    if (product) {
      await supabase.from('products').update(data).eq('id', product.id);
    } else {
      const { data: newProd } = await supabase.from('products').insert(data).select().single();
      if (newProd) productId = newProd.id;
    }

    if (productId) {
      await supabase.from('product_options').delete().eq('product_id', productId);
      for (const opt of options) {
        if (!opt.name) continue;
        const { data: newOpt } = await supabase.from('product_options').insert({
          product_id: productId,
          name: opt.name,
          required: opt.required
        }).select().single();

        if (newOpt && opt.option_values.length > 0) {
          const valInserts = opt.option_values.filter((v:any) => v.value).map((v:any) => ({
            option_id: newOpt.id,
            value: v.value,
            description: v.description || null,
            price_modifier: Number(v.price_modifier) || 0,
            image_url: v.image_url || null
          }));
          if (valInserts.length > 0) await supabase.from('option_values').insert(valInserts);
        }
      }
    }

    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5 shrink-0">
          <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white">{product ? 'Modifier' : 'Ajouter'} un produit</h2>
          <button onClick={onClose} className="p-2 rounded-lg glass"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-4 gap-6 border-b border-slate-100 dark:border-white/5 shrink-0">
          {[
            { id: 'info', label: 'Informations', icon: Package },
            { id: 'options', label: 'Accessoires', icon: ListPlus },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors font-medium text-sm ${
                activeTab === t.id ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'info' && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Marque de voiture compatible</label>
                <select 
                  value={form.brand_id} 
                  onChange={(e) => set('brand_id', e.target.value)} 
                  className="input-field"
                >
                  <option value="">Sélectionner une marque...</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <Input label="Nom du produit" value={form.name} onChange={(v) => set('name', v)} />
              <Input label="Référence" value={form.sku} onChange={(v) => set('sku', v)} />
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Description</label>
                <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className="input-field resize-none" />
              </div>
              <Input label="Prix (TND)" value={form.base_price} onChange={(v) => set('base_price', v)} type="number" />
              {form.is_promo && (
                <Input label="Prix promo (TND)" value={form.promo_price} onChange={(v) => set('promo_price', v)} type="number" />
              )}
              <Input label="Stock" value={form.stock} onChange={(v) => set('stock', v)} type="number" />
              <div className="sm:col-span-2 mt-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Badge / Mise en avant</label>
                <div className="flex gap-4">
                  {[
                    { id: 'none', label: 'Aucun' },
                    { id: 'new_arrival', label: 'Nouveau' },
                    { id: 'best_seller', label: 'Top vente' },
                    { id: 'is_promo', label: 'Promo' }
                  ].map(b => (
                    <label key={b.id} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input 
                        type="radio" 
                        name="badge" 
                        checked={b.id === 'none' ? (!form.is_promo && !form.new_arrival && !form.best_seller) : (form[b.id as keyof typeof form] as boolean)} 
                        onChange={() => {
                          setForm(f => ({
                            ...f,
                            is_promo: b.id === 'is_promo',
                            new_arrival: b.id === 'new_arrival',
                            best_seller: b.id === 'best_seller',
                            ...(b.id !== 'is_promo' ? { promo_price: '' } : {})
                          }));
                        }}
                        className="accent-brand-600 w-4 h-4"
                      />
                      {b.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2 mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Images du produit</h3>
                <div className="flex gap-4 flex-wrap">
                  {images.map((img, i) => (
                    <div key={i} className="relative w-32 h-32 rounded-xl overflow-hidden glass border-2 border-slate-200 dark:border-white/10 group">
                      <img src={img} className="w-full h-full object-cover" alt="" />
                      <button onClick={(e) => { e.preventDefault(); removeImage(i); }} className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <label className="w-32 h-32 rounded-xl glass border-2 border-dashed border-slate-300 dark:border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 hover:text-brand-500 transition-colors text-slate-400">
                    {uploading ? <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /> : <Upload className="w-6 h-6 mb-2" />}
                    <span className="text-xs font-semibold">{uploading ? 'Envoi...' : 'Ajouter'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'options' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-500">Ajoutez des accessoires ou variantes (ex: Gauche/Droite, Couleur).</p>
                <button onClick={addOption} className="btn-primary py-1.5 text-sm"><Plus className="w-4 h-4" /> Groupe d'options</button>
              </div>
              
              {options.map((opt, optIdx) => (
                <div key={opt.id} className="glass p-4 rounded-xl space-y-4 border border-slate-200 dark:border-white/10">
                  <div className="flex gap-4 items-start">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-slate-500 uppercase">Nom du groupe (ex: Accessoires)</label>
                      <input type="text" value={opt.name} onChange={(e) => updateOption(optIdx, 'name', e.target.value)} className="input-field mt-1" />
                    </div>
                    <div className="flex items-center gap-2 mt-8">
                      <input type="checkbox" checked={opt.required} onChange={(e) => updateOption(optIdx, 'required', e.target.checked)} className="w-4 h-4" />
                      <span className="text-sm">Obligatoire</span>
                    </div>
                    <button onClick={() => setOptions(options.filter((_, i) => i !== optIdx))} className="mt-7 p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>

                  <div className="pl-4 border-l-2 border-brand-500/20 space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Valeurs (Options)</p>
                    {opt.option_values.map((val: any, valIdx: number) => (
                      <div key={val.id} className="bg-white/50 dark:bg-black/20 p-3 rounded-lg flex flex-col gap-3 relative">
                        <button onClick={() => {
                          const n = [...options]; n[optIdx].option_values = n[optIdx].option_values.filter((_:any, i:number) => i !== valIdx); setOptions(n);
                        }} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-6">
                          <input type="text" placeholder="Titre (ex: Housse premium)" value={val.value} onChange={(e) => updateOptionValue(optIdx, valIdx, 'value', e.target.value)} className="input-field py-1.5 text-sm" />
                          <input type="number" placeholder="Prix (TND)" value={val.price_modifier} onChange={(e) => updateOptionValue(optIdx, valIdx, 'price_modifier', e.target.value)} className="input-field py-1.5 text-sm" />
                          <textarea placeholder="Description" value={val.description || ''} onChange={(e) => updateOptionValue(optIdx, valIdx, 'description', e.target.value)} rows={2} className="input-field py-1.5 text-sm sm:col-span-2 resize-none" />
                          <div className="sm:col-span-2 flex items-center gap-2">
                            <input type="text" placeholder="URL de l'image" value={val.image_url || ''} onChange={(e) => updateOptionValue(optIdx, valIdx, 'image_url', e.target.value)} className="input-field py-1.5 text-sm flex-1" />
                            <label className="shrink-0 flex items-center justify-center p-2 rounded-lg glass border border-slate-200 cursor-pointer hover:text-brand-500">
                              <Upload className="w-4 h-4" />
                              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if(!file) return;
                                try {
                                  setUploading(true);
                                  const imageBitmap = await createImageBitmap(file);
                                  const canvas = document.createElement('canvas');
                                  canvas.width = imageBitmap.width; canvas.height = imageBitmap.height;
                                  const ctx = canvas.getContext('2d');
                                  if(!ctx) throw new Error();
                                  ctx.drawImage(imageBitmap, 0, 0);
                                  const webpBlob = await new Promise<Blob|null>(r => canvas.toBlob(r, 'image/webp', 0.85));
                                  if(!webpBlob) throw new Error();
                                  const filePath = `${Math.random().toString(36).substring(2, 15)}.webp`;
                                  await supabase.storage.from('product-images').upload(filePath, webpBlob, { contentType: 'image/webp' });
                                  const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
                                  updateOptionValue(optIdx, valIdx, 'image_url', publicUrl);
                                } catch(err) {
                                  console.error(err);
                                  customAlert("Erreur upload image accessoire");
                                } finally {
                                  setUploading(false);
                                }
                              }} />
                            </label>
                            {val.image_url && <img src={val.image_url} alt="" className="w-8 h-8 rounded object-cover" />}
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => addOptionValue(optIdx)} className="text-sm text-brand-600 dark:text-brand-400 font-medium flex items-center gap-1 hover:underline">
                      <Plus className="w-3.5 h-3.5" /> Ajouter une valeur
                    </button>
                  </div>
                </div>
              ))}
              {options.length === 0 && <div className="text-center p-8 glass rounded-xl text-slate-400 text-sm">Aucun accessoire défini</div>}
            </div>
          )}

        </div>

        <div className="flex gap-3 p-6 border-t border-slate-100 dark:border-white/5 shrink-0">
          <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? 'Sauvegarde...' : 'Sauvegarder'}</button>
          <button onClick={onClose} className="btn-ghost">Annuler</button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input-field" />
    </div>
  );
}
