import { useState, useEffect } from 'react';
import { Truck, ShieldCheck, Phone, Search, Wrench, Layers, Maximize, ArrowRight, CheckCircle2, ChevronRight, Zap, CreditCard, ShoppingCart, Headset } from 'lucide-react';
import VehicleSelector from '@/components/VehicleSelector';
import { useRouter } from '@/context/RouterContext';
import { brandLogos } from '@/data/brands';
import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/types/database';

export default function LandingPage() {
  const { navigate } = useRouter();

  const [activePromo, setActivePromo] = useState(0);
  const [activeTopBarIndex, setActiveTopBarIndex] = useState(0);
  const promos = [
    "/images/1.png",
    "/images/2.png",
    "/images/3.png"
  ];

  useEffect(() => {
    const promoTimer = setInterval(() => {
      setActivePromo(prev => (prev + 1) % promos.length);
    }, 5000);
    const topBarTimer = setInterval(() => {
      setActiveTopBarIndex(prev => (prev + 1) % 3);
    }, 4000);
    return () => {
      clearInterval(promoTimer);
      clearInterval(topBarTimer);
    };
  }, [promos.length]);

  const [topProducts, setTopProducts] = useState<Product[]>([]);

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('best_seller', true)
      .limit(8)
      .then(({ data }) => {
        if (data) setTopProducts(data);
      });
  }, []);


  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen font-sans">

      {/* Top Banner (Reassurance) - Marquee */}
      <div className="bg-brand-600 text-white text-[13px] font-medium overflow-hidden whitespace-nowrap">
        <div className="animate-marquee inline-block py-2">
          {/* We duplicate the content twice to make the loop seamless */}
          {[1, 2].map((i) => (
            <span key={i} className="inline-flex items-center">
              <span className="inline-flex items-center gap-2 mx-6">
                <Truck className="w-4 h-4" />
                Livraison 24/48h sur toute la Tunisie
              </span>
              <span className="opacity-50">|</span>
              <span className="inline-flex items-center gap-2 mx-6">
                <ShieldCheck className="w-4 h-4" />
                Satisfait ou remboursé
              </span>
              <span className="opacity-50">|</span>
              <a
                href="https://wa.me/21627804642"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mx-6 hover:text-brand-200 transition-colors cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                Besoin d'aide ? 27 804 642
              </a>
              {/* Space before next duplicate starts */}
              <span className="mx-6"></span>
            </span>
          ))}
        </div>
      </div>

      {/* ===== HERO E-COMMERCE ===== */}
      <section
        className="relative border-b border-brand-900 pt-10 pb-16 bg-brand-950 bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
      >
        {/* Dark overlay just in case the background is too busy */}
        <div className="absolute inset-0 bg-brand-900/60 mix-blend-multiply pointer-events-none" />

        <div className="container-x relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: Text & Action */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1e2a52]/80 text-brand-100 rounded-full text-[11px] font-semibold mb-6 border border-white/5 backdrop-blur-sm shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> N°1 du rétroviseur en Tunisie
              </div>

              <h1 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-white mb-6 drop-shadow-sm">
                Les bonnes pièces.<br />
                <span className="text-[#38bdf8]">Pour la bonne voiture.</span>
              </h1>

              <p className="text-lg md:text-xl text-brand-100/90 mb-8 max-w-[500px] leading-relaxed">
                Spécialiste des rétroviseurs et pièces détachées automobiles.<br className="hidden md:block" />
                Trouvez la pièce exacte pour votre véhicule en quelques clics.
              </p>

              {/* Features List / Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                <button onClick={() => navigate('/catalog')} className="flex items-center gap-2 bg-[#2563eb] hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium text-base transition-colors shadow-lg shadow-blue-900/20">
                  Explorer le catalogue <ArrowRight className="w-5 h-5" />
                </button>
                <button onClick={() => navigate('/contact')} className="bg-[#273568]/60 hover:bg-[#273568]/80 text-white border border-[#3b4b86] px-6 py-3 rounded-lg font-medium text-base transition-colors backdrop-blur-sm">
                  Demander un devis
                </button>
              </div>
            </div>

            {/* Right: The Selector Tool */}
            <div className="lg:pl-6 xl:pl-12">
              <VehicleSelector variant="hero" />
            </div>

          </div>
        </div>
      </section>

      {/* ===== PROMO SECTION (Carousel + Grid) ===== */}
      <section className="py-4 md:py-6">
        <div className="container-x mb-2">
          {/* Carousel */}
          <div className="relative w-full h-[180px] md:h-[280px] overflow-hidden group border border-slate-200">
            {promos.map((promo, idx) => (
              <img
                key={idx}
                src={promo}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === activePromo ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                alt={`Promo ${idx + 1}`}
              />
            ))}
            {/* Overlay gradient for aesthetics */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent z-10 pointer-events-none" />

            {/* Navigation dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-20">
              {promos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePromo(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 shadow-sm ${idx === activePromo ? 'bg-brand-500 w-6' : 'bg-white/80 hover:bg-white'}`}
                  aria-label={`Aller à la diapositive ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 4-Block Grid */}
        <div className="container-x">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full">

            {/* Block 1: Dark Gray Text */}
            <div className="bg-[#595959] text-white p-5 lg:p-6 flex flex-col justify-between aspect-[4/3] lg:aspect-auto lg:h-[220px]">
              <h3 className="font-display font-bold text-xl lg:text-2xl leading-tight uppercase tracking-tight">Un concept<br />novateur</h3>
              <p className="text-right text-xs lg:text-sm font-medium leading-relaxed mt-2">
                Vente, peinture, installation :<br />
                tous les produits et services liés au rétroviseur en un seul site.
              </p>
            </div>

            {/* Block 2: Image Mirror */}
            <div className="aspect-[4/3] lg:aspect-auto lg:h-[220px] bg-slate-200">
              <img
                src="/images/retro-paysage.jpg"
                className="w-full h-full object-cover"
                alt="Rétroviseur paysage"
              />
            </div>

            {/* Block 3: Blue Text (was Red) */}
            <div className="bg-brand-950 text-white p-5 lg:p-6 flex flex-col justify-between aspect-[4/3] lg:aspect-auto lg:h-[220px]">
              <h3 className="font-display font-bold text-xl lg:text-2xl leading-tight uppercase tracking-tight">La qualité<br />Acil Retro</h3>
              <p className="text-left text-xs lg:text-sm font-medium leading-relaxed mt-2">
                Un large choix de références, une qualité de service et de conseil.<br />
                Une solution intelligente pour une intervention rapide.
              </p>
            </div>

            {/* Block 4: Image Warehouse */}
            <div className="aspect-[4/3] lg:aspect-auto lg:h-[220px] bg-slate-200">
              <img
                src="/images/retro-route.jpg"
                className="w-full h-full object-cover"
                alt="Rétroviseur route"
              />
            </div>

          </div>
        </div>
      </section>



      {/* ===== NEW GUARANTEES & BANNER ===== */}
      <section className="bg-white border-t border-slate-200">
        <div className="container-x py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <Truck className="w-14 h-14 mb-4 text-black" strokeWidth={1.5} />
              <h3 className="font-display font-bold text-[13px] uppercase tracking-wider text-black">Livraison Express</h3>
            </div>
            <div className="flex flex-col items-center justify-center">
              <Wrench className="w-14 h-14 mb-4 text-black" strokeWidth={1.5} />
              <h3 className="font-display font-bold text-[13px] uppercase tracking-wider text-black">Pose Possible</h3>
            </div>
            <div className="flex flex-col items-center justify-center">
              <CreditCard className="w-14 h-14 mb-4 text-black" strokeWidth={1.5} />
              <h3 className="font-display font-bold text-[13px] uppercase tracking-wider text-black">Paiement Sécurisé</h3>
            </div>
            <div className="flex flex-col items-center justify-center">
              <Headset className="w-14 h-14 mb-4 text-black" strokeWidth={1.5} />
              <h3 className="font-display font-bold text-[13px] uppercase tracking-wider text-black">Assistance Téléphonique 7/7</h3>
            </div>
          </div>
        </div>

        {/* The Blue Banner */}
        <div className="bg-brand-950 py-12">
          <div className="container-x flex flex-col justify-center items-center text-center">
            <h2 className="font-display font-black text-4xl md:text-5xl text-white tracking-tighter uppercase mb-1">
              ACIL RETRO
            </h2>
            <p className="text-white font-medium tracking-[0.3em] text-sm md:text-base uppercase">
              Spécialiste du rétroviseur
            </p>
          </div>
        </div>


      </section>

      {/* ===== BRAND LOGO CAROUSEL ===== */}
      <section className="bg-white py-16 border-y border-slate-200 overflow-hidden">
        <div className="container-x">
          <h2 className="text-2xl font-bold text-slate-900 mb-10 text-center">Trouvez les pièces de votre constructeur</h2>

          <div className="relative w-full overflow-hidden">
            <div className="animate-marquee gap-8 md:gap-12 pb-4 pt-2">
              {[...brandLogos, ...brandLogos].map((brand, i) => (
                <div
                  key={i}
                  onClick={() => navigate(`/catalog?brand=${brand.name.toLowerCase()}`)}
                  className="flex-shrink-0 w-48 h-28 md:w-72 md:h-40 bg-white border border-slate-100 shadow-sm rounded-2xl flex items-center justify-center p-8 cursor-pointer hover:border-brand-300 hover:shadow-md transition-all group"
                >
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className={`max-w-full max-h-full object-contain opacity-80 group-hover:opacity-100 transition-all duration-300 ${brand.name === 'Chrysler' ? 'scale-150 group-hover:scale-[1.65]' : 'group-hover:scale-110'}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ===== CATALOGUE TOP VENTES ===== */}
          <section className="container-x py-16">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Notre Catalogue</h2>
                <p className="text-slate-500 text-lg">Découvrez nos produits les plus vendus.</p>
              </div>
              <button onClick={() => navigate('/catalog')} className="hidden md:flex items-center gap-2 text-brand-600 font-semibold hover:text-brand-700 transition-colors">
                Voir tout le catalogue <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {topProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {topProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-10 bg-white rounded-2xl border border-slate-200">
                Aucun produit top vente pour le moment.
              </div>
            )}

            <button onClick={() => navigate('/catalog')} className="md:hidden w-full mt-6 flex justify-center items-center gap-2 bg-slate-100 text-slate-900 font-semibold py-3 rounded-xl hover:bg-slate-200 transition-colors">
              Voir tout le catalogue <ArrowRight className="w-4 h-4" />
            </button>
          </section>

          <div className="text-center mt-10">
            <button onClick={() => navigate('/brands')} className="px-8 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:border-slate-300 transition-colors">
              Voir toutes les marques
            </button>
          </div>
        </div>
      </section>



    </div>
  );
}
