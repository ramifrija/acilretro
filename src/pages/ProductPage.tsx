import { useEffect, useState, useMemo } from 'react';
import { useRouter } from '@/context/RouterContext';
import { Star, ShoppingCart, FileText, Truck, ShieldCheck, ZoomIn, ChevronLeft, ChevronRight, Check, Package, Zap, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';
import type { Product, ProductOption, ProductCompat } from '@/types/database';
import ProductCard from '@/components/ProductCard';

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
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

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

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: currentImage,
      unitPrice: currentPrice,
      quantity: qty,
      options: selectedOptionsArray,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
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
    <div className="container-x py-8 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <button onClick={() => navigate('/')} className="hover:text-brand-500">Accueil</button>
        <span>/</span>
        <button onClick={() => navigate('/catalog')} className="hover:text-brand-500">Catalogue</button>
        <span>/</span>
        <span className="text-slate-900 dark:text-white font-medium truncate">{product.name}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <div>
          <div
            className="relative glass-card overflow-hidden aspect-square cursor-zoom-in group"
            onClick={() => setZoom(!zoom)}
          >
            {currentImage ? (
              <img src={currentImage} alt={product.name} className={`w-full h-full object-cover transition-transform duration-500 ${zoom ? 'scale-150' : 'group-hover:scale-105'}`} />
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
                  <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{product.rating.toFixed(1)}</span>
            </div>
            {product.stock > 0 ? (
              <span className="text-xs font-semibold text-success-600 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-success-500/10">
                <Zap className="w-3 h-3" /> En stock ({product.stock} unités)
              </span>
            ) : (
              <span className="text-xs font-semibold text-error-500 px-2.5 py-1 rounded-lg bg-error-500/10">Rupture de stock</span>
            )}
          </div>

          <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-slate-900 dark:text-white mb-3">{product.name}</h1>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-display font-extrabold text-3xl text-brand-700 dark:text-brand-200">{formatPrice(currentPrice)}</span>
            {product.is_promo && product.promo_price && (
              <span className="text-lg text-slate-400 line-through">{formatPrice(product.base_price)}</span>
            )}
          </div>


          {/* Options */}
          {options.map((o) => (
            <div key={o.id} className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{o.name}</span>
                {o.required && <span className="text-xs text-error-500">* requis</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {o.option_values.map((v) => {
                  const selected = selectedOptions[o.id] === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedOptions((s) => ({ ...s, [o.id]: s[o.id] === v.id ? undefined : v.id }))}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${selected
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-800/40 text-brand-700 dark:text-brand-200'
                          : 'border-slate-200 dark:border-white/10 glass hover:border-brand-300'
                        }`}
                    >
                      {v.value}
                      {v.price_modifier > 0 && <span className="text-xs text-slate-500 ml-1.5">+{formatPrice(v.price_modifier)}</span>}
                      {selected && <Check className="w-3.5 h-3.5 inline ml-1.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quantity + Add */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center glass rounded-xl">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 py-3 text-slate-500 hover:text-brand-500">-</button>
              <span className="px-4 font-semibold text-slate-900 dark:text-white">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="px-4 py-3 text-slate-500 hover:text-brand-500">+</button>
            </div>
            <button onClick={handleAddToCart} className="btn-primary flex-1" disabled={product.stock === 0}>
              {added ? <><Check className="w-4 h-4" /> Ajouté!</> : <><ShoppingCart className="w-4 h-4" /> Ajouter au panier</>}
            </button>
          </div>

          {/* Quick info */}
          <div className="glass-card p-5 space-y-3">
            {[
              { icon: ShieldCheck, label: 'Garantie', value: product.warranty || 'N/A' },
              { icon: Truck, label: 'Délai', value: product.delivery_time || '2-4 jours' },
              { icon: FileText, label: 'Réf. OEM', value: product.oem_ref || 'N/A' },
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

      {/* Product Description Card */}
      {product.description && (
        <div className="mt-12 glass-card p-6">
          <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-4">Description du produit</h2>
          <div className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {product.description}
          </div>
        </div>
      )}

      {/* Compatibility */}
      {compat.length > 0 && (
        <div className="mt-8 glass-card p-6">
          <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-4">Véhicules compatibles</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {compat.map((c) => {
              const m = (c as { models?: { name: string; slug: string; brands?: { name: string } } }).models;
              return (
                <div key={c.id} className="flex items-center gap-2 px-4 py-3 rounded-xl glass">
                  <Check className="w-4 h-4 text-success-500 shrink-0" />
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {m?.brands?.name} {m?.name}
                  </span>
                  <span className="text-xs text-slate-400 ml-auto">
                    {c.year_from}{c.year_to ? `-${c.year_to}` : '+'}
                    {c.fuel_type ? ` · ${c.fuel_type}` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-4">Produits similaires</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
