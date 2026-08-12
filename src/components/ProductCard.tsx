import { Star, ShoppingCart, Zap } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/types/database';
import WatermarkedImage from '@/components/WatermarkedImage';
export default function ProductCard({ product }: { product: Product }) {
  const { navigate } = useRouter();
  const { addItem, clear } = useCart();

  const price = product.promo_price ?? product.base_price;
  const hasPromo = product.is_promo && product.promo_price;

  const quickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    clear();
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images?.[0] ?? '',
      unitPrice: price,
      quantity: 1,
      options: [],
    });
  };

  return (
    <div
      onClick={() => navigate(`/product/${product.slug}`)}
      className="group bg-white dark:bg-brand-900 border border-slate-100 dark:border-white/5 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-brand-500/30 flex flex-col h-full"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-50 dark:bg-brand-950">
        {product.images?.[0] ? (
            <WatermarkedImage
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Star className="w-12 h-12" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {hasPromo && (
            <span className="px-2.5 py-1 rounded-lg bg-error-500 text-white text-[10px] font-bold uppercase tracking-wide shadow-lg">
              Promo
            </span>
          )}
          {product.new_arrival && (
            <span className="px-2.5 py-1 rounded-lg bg-accent-500 text-white text-[10px] font-bold uppercase tracking-wide shadow-lg">
              Nouveau
            </span>
          )}
          {product.best_seller && (
            <span className="px-2.5 py-1 rounded-lg bg-warning-500 text-white text-[10px] font-bold uppercase tracking-wide shadow-lg">
              Top vente
            </span>
          )}
        </div>
        <button
          onClick={quickAdd}
          className="absolute bottom-3 right-3 w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-brand-500"
          aria-label="Ajouter au panier"
        >
          <ShoppingCart className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 flex flex-col flex-1">
        <div className="flex items-center justify-end mb-1">
          {product.stock > 0 ? (
            <span className="text-[10px] font-medium text-success-600 flex items-center gap-0.5">
              <Zap className="w-3 h-3" /> En stock
            </span>
          ) : (
            <span className="text-[10px] font-medium text-error-500">Rupture</span>
          )}
        </div>
        <h3 className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-2 mb-1 group-hover:text-brand-500 transition-colors flex-1">
          {product.name}
        </h3>
        {product.oem_ref && (
          <p className="text-[10px] text-slate-400 mb-2 truncate">OEM: {product.oem_ref}</p>
        )}
        <div className="mt-auto pt-2 flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/product/${product.slug}`);
            }}
            className="flex-1 py-2 bg-[#3d6eff] hover:bg-[#2d58d9] text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center shadow-sm uppercase tracking-wider"
          >
            Commander
          </button>
        </div>
      </div>
    </div>
  );
}
