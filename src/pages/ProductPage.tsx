import { useEffect, useState, useMemo } from 'react';
import { useRouter } from '@/context/RouterContext';
import { Star, ShoppingCart, FileText, Truck, ShieldCheck, ZoomIn, ChevronLeft, ChevronRight, Check, Package, Zap, ArrowLeft, Facebook, Twitter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';
import type { Product, ProductOption, ProductCompat } from '@/types/database';
import ProductCard from '@/components/ProductCard';
import WatermarkedImage from '@/components/WatermarkedImage';
import toast from 'react-hot-toast';
import { customConfirm } from '@/lib/dialogs';

export default function ProductPage() {
  const { path, navigate } = useRouter();
  const slug = path.split('/').pop() || '';
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [compat, setCompat] = useState<ProductCompat[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string | undefined>>({});
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [cote, setCote] = useState<'Droite' | 'Gauche' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'desc' | 'details'>('desc');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setActiveImage(0);
    setSelectedOptions({});

    (async () => {
      const { data: prod } = await supabase.from('products').select('*').eq('slug', slug).maybeSingle();
      if (!prod) { setLoading(false); return; }
      setProduct(prod);

      const { data: opts } = await supabase
        .from('product_options')
        .select('*, option_values(*)')
        .eq('product_id', prod.id);
      setOptions(opts || []);
      // Initialize with first value of each required option
      const init: Record<string, string> = {};
      (opts || []).forEach((o) => { if (o.required && o.option_values.length) init[o.id] = o.option_values[0].id; });
      setSelectedOptions(init);

      const { data: comp } = await supabase
        .from('product_compat')
        .select('*, models(name, slug, brands(name))')
        .eq('product_id', prod.id);
      setCompat(comp || []);

      if (prod.category_id) {
        const { data: rel } = await supabase
          .from('products')
          .select('*')
          .eq('category_id', prod.category_id)
          .neq('id', prod.id)
          .limit(4);
        setRelated(rel || []);
      }

      setLoading(false);
    })();
  }, [slug]);

  // Compute current price based on selected options
  const currentPrice = useMemo(() => {
    if (!product) return 0;
    let price = product.promo_price ?? product.base_price;
    options.forEach((o) => {
      const selId = selectedOptions[o.id];
      if (selId) {
        const val = o.option_values.find((v) => v.id === selId);
        if (val) price += val.price_modifier;
      }
    });
    return price;
  }, [product, options, selectedOptions]);

  // Find image from selected option
  const currentImage = useMemo(() => {
    for (const o of options) {
      const selId = selectedOptions[o.id];
      if (selId) {
        const val = o.option_values.find((v) => v.id === selId);
        if (val?.image_url) return val.image_url;
      }
    }
    return product?.images?.[activeImage] || product?.images?.[0] || '';
  }, [options, selectedOptions, product, activeImage]);

  const allImages = useMemo(() => {
    const imgs = [...(product?.images || [])];
    options.forEach((o) => {
      const selId = selectedOptions[o.id];
      if (selId) {
        const val = o.option_values.find((v) => v.id === selId);
        if (val?.image_url && !imgs.includes(val.image_url)) imgs.unshift(val.image_url);
      }
    });
    return imgs;
  }, [product, options, selectedOptions]);

  const selectedOptionsArray = useMemo(() =>
    options.map((o) => {
      const selId = selectedOptions[o.id];
      const val = o.option_values.find((v) => v.id === selId);
      return val ? { option: o.name, value: val.value, modifier: val.price_modifier } : null;
    }).filter(Boolean) as Array<{ option: string; value: string; modifier: number }>,
    [options, selectedOptions]);

  const handleAddToCart = async () => {
    if (!product) return;
    
    if (product.stock === 0) {
      const confirm = await customConfirm(
        "Ce produit est en rupture de stock. Vous pouvez nous contacter sur WhatsApp pour savoir quand il sera disponible.",
        "Contacter",
        "Annuler"
      );
      if (confirm) {
        const message = `Bonjour, je suis intéressé par le produit "${product.name}" (Réf: ${product.oem_ref || product.sku || 'N/A'}) qui est actuellement en rupture de stock. Pouvez-vous m'informer de sa disponibilité ?`;
        const whatsappUrl = `https://wa.me/21627804642?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
      return;
    }

    if (!cote) {
      setError("Veuillez sélectionner le côté.");
      return;
    }
    setError(null);

    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: currentImage,
      unitPrice: currentPrice,
      quantity: qty,
      options: [
        ...selectedOptionsArray,
        ...(cote ? [{ option: 'Coté', value: cote, modifier: 0 }] : [])
      ],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleShareFacebook = () => {
    const currentUrl = window.location.href;
    const text = `Découvrez ce super produit sur AcilRetro : ${product?.name || ''}`;
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}&quote=${encodeURIComponent(text)}`;
    window.open(facebookShareUrl, '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <div className="container-x py-20">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="glass-card aspect-square animate-shimmer" />
          <div className="space-y-4">
            <div className="h-8 glass rounded animate-shimmer" />
            <div className="h-4 glass rounded w-1/2 animate-shimmer" />
            <div className="h-32 glass rounded animate-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-x py-20 text-center">
        <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="font-bold text-xl text-slate-900 dark:text-white">Produit introuvable</h2>
        <button onClick={() => navigate('/catalog')} className="btn-primary mt-4">Retour au catalogue</button>
      </div>
    );
  }

  return (
    <div className="container-x py-8 animate-fade-in max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <button onClick={() => navigate('/')} className="hover:text-brand-500">Accueil</button>
        <span>/</span>
        <button onClick={() => navigate('/catalog')} className="hover:text-brand-500">Catalogue</button>
        <span>/</span>
        <span className="text-slate-900 dark:text-white font-medium truncate">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-start">
        {/* Gallery */}
        <div className="">
          <div
            className="relative bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden aspect-[4/3] cursor-zoom-in group"
            onClick={() => setZoom(!zoom)}
          >
            {currentImage ? (
              <WatermarkedImage
                src={currentImage}
                alt={product.name}
                watermarkScale={0.5}
                className={`w-full h-full object-contain transition-transform duration-500 ${zoom ? 'scale-150' : 'group-hover:scale-105'}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300"><Package className="w-24 h-24" /></div>
            )}
            <div className="absolute top-4 right-4 glass px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="w-3.5 h-3.5" /> Cliquer pour zoomer
            </div>
            {allImages.length > 1 && !zoom && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImage((a) => (a - 1 + allImages.length) % allImages.length); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-white/90 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImage((a) => (a + 1) % allImages.length); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-white/90 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto no-scrollbar">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${currentImage === img ? 'border-brand-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="">
          <div className="flex items-center gap-3 mb-3">

            {product.stock > 0 ? (
              <span className="text-xs font-semibold text-success-600 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-success-500/10">
                <Zap className="w-3 h-3" /> En stock ({product.stock} unités)
              </span>
            ) : (
              <span className="text-xs font-semibold text-error-500 px-2.5 py-1 rounded-lg bg-error-500/10">Rupture de stock</span>
            )}
          </div>

          <h1 className="font-display font-bold text-2xl lg:text-3xl text-slate-900 dark:text-white mb-6">{product.name}</h1>

          <div className="mb-4">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Côté <span className="text-red-500">*</span></label>
            <select
              value={cote || ''}
              onChange={(e) => {
                setCote(e.target.value ? e.target.value as 'Droite' | 'Gauche' : null);
                if (error) setError(null);
              }}
              className={`w-full sm:w-64 input-field text-sm py-2 bg-white ${error ? 'border-red-500 ring-1 ring-red-500' : ''}`}
            >
              <option value="">-- Sélectionner un côté --</option>
              <option value="Droite">droit / passager</option>
              <option value="Gauche">gauche / conducteur</option>
            </select>
            {error && <div className="text-red-500 text-xs mt-1 font-medium">{error}</div>}
          </div>

          {/* Options */}
          {options.map((o) => (
            <div key={o.id} className="mb-4">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                {o.name} {o.required && <span className="text-error-500">*</span>}
              </label>
              <select
                value={selectedOptions[o.id] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedOptions((s) => {
                    const newS = { ...s };
                    if (!val) {
                      delete newS[o.id];
                    } else {
                      newS[o.id] = val;
                    }
                    return newS;
                  });
                }}
                className="w-full sm:w-64 input-field text-sm py-2 bg-white"
              >
                <option value="">-- {o.required ? `Sélectionner ${o.name.toLowerCase()}` : `Aucun(e) (Annuler)`} --</option>
                {o.option_values.map((v) => (
                  <option key={v.id} value={v.id}>{v.value}</option>
                ))}
              </select>
            </div>
          ))}

          {/* Quantity + Add */}
          <div className="mb-8">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Quantité</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="input-field w-20 text-center py-2 bg-white"
              />
              <button onClick={handleAddToCart} className="btn-primary py-2 px-6 flex items-center gap-2" style={{ backgroundColor: '#2cbcd1' }}>
                {added ? <><Check className="w-4 h-4" /> AJOUTÉ!</> : <><ShoppingCart className="w-4 h-4" /> AJOUTER AU PANIER</>}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-500 mb-8">
            <span>Partager</span>
            <div className="flex gap-2">
              {/* Facebook */}
              <button onClick={handleShareFacebook} className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors text-[#1877F2] shadow-sm">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </button>
              {/* Twitter */}
              <button className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors text-[#1DA1F2] shadow-sm">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </button>
              {/* Google+ (Using generic G or Google colors since G+ is dead) */}
              <button className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors text-[#db4a39] shadow-sm font-bold font-sans text-sm">
                G+
              </button>
              {/* Pinterest */}
              <button className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors text-[#E60023] shadow-sm">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.168 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.633 0 12.017 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Quick info */}
          <div className="glass-card p-5 space-y-3">
            {[
              { icon: Truck, label: 'Délai', value: product.delivery_time || '2-4 jours' },
              { icon: Package, label: 'Réf. interne', value: product.sku || 'N/A' },
            ].map((row, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <row.icon className="w-4 h-4 text-brand-500 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400 w-24">{row.label}</span>
                <span className="font-semibold text-slate-900 dark:text-white">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <div className="border-b border-slate-200 dark:border-white/10 flex items-center gap-6">
          <button
            onClick={() => setActiveTab('desc')}
            className={`px-4 py-3 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'desc' ? 'border-[#2cbcd1] text-[#2cbcd1]' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-3 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'details' ? 'border-[#2cbcd1] text-[#2cbcd1]' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Détails du produit
          </button>
        </div>
        <div className="pt-6">
          {activeTab === 'desc' ? (
            <>
              <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {product.description || 'Aucune description disponible.'}
              </div>

              {compat.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Véhicules compatibles:</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {compat.map((c) => {
                      const m = (c as { models?: { name: string; slug: string; brands?: { name: string } } }).models;
                      return (
                        <div key={c.id} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <Check className="w-4 h-4 text-success-500 shrink-0" />
                          <span>{m?.brands?.name} {m?.name}</span>
                          <span className="text-xs text-slate-400 ml-auto">
                            {c.year_from}{c.year_to ? `-${c.year_to}` : '+'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-slate-600 dark:text-slate-300 text-sm">
              <span className="font-semibold text-slate-900 dark:text-white mr-2">Référence :</span>
              {product.oem_ref || product.sku || 'N/A'}
            </div>
          )}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-white/10 pb-4">Produits similaires</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
