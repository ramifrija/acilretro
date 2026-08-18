import { useState, useEffect, useRef } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { Truck, ShieldCheck, Phone, Wrench, CreditCard, Headset, Star, ArrowRight, Search, CheckCircle2, ChevronLeft, ChevronRight, Mail, MapPin } from 'lucide-react';
import VehicleSelector from '@/components/VehicleSelector';
import { useRouter } from '@/context/RouterContext';
import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/types/database';
import { brandLogos } from '@/data/brands';

export default function NewLandingPage() {
  const { navigate } = useRouter();
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [showCertModal, setShowCertModal] = useState(false);

  const [activePromo, setActivePromo] = useState(0);
  const promos = [
    "/images/1.png",
    "/images/2.png",
    "/images/3.png"
  ];

  useEffect(() => {
    const promoTimer = setInterval(() => {
      setActivePromo(prev => (prev + 1) % promos.length);
    }, 5000);
    return () => clearInterval(promoTimer);
  }, [promos.length]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const reviews = [
    // Page 1
    { name: "Ahmed B.", role: "Propriétaire Peugeot 208", text: "Site très facile à utiliser. J'ai trouvé le rétroviseur pour ma 208 en 2 minutes. Reçu le lendemain et monté moi-même grâce à leurs conseils.", lang: "fr" },
    { name: "Mohamed A.", role: "Propriétaire VW Golf", text: "خدمة ممتازة وتوصيل سريع جداً. قطعة الغيار مطابقة تماماً للأصلية. شكراً لكم!", lang: "ar" },
    // Page 2
    { name: "Karim M.", role: "Chauffeur Taxi", text: "En tant que pro, j'ai besoin de rapidité. Acil Retro m'a toujours livré des pièces fiables en un temps record. Je recommande fortement.", lang: "fr" },
    { name: "Fatma S.", role: "Propriétaire Kia Rio", text: "أفضل موقع لمرآة سيارات في تونس. الأسعار معقولة جداً والجودة لا يعلى عليها. أنصح به بشدة.", lang: "ar" },
    { name: "Thomas L.", role: "Mécanicien", text: "Pièces de très bonne qualité. Le support client est réactif et les livraisons sont toujours dans les délais annoncés.", lang: "fr" },
    { name: "Ramzi Bn.", role: "Propriétaire BMW", text: "Rapide et efficace, je recommande.", lang: "fr" },
  ];

  // Auto-scroll pour les avis désactivé à la demande de l'utilisateur

  const scrollReviews = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('best_seller', true)
      .limit(4)
      .then(({ data }) => {
        if (data) setTopProducts(data);
      });
  }, []);

  const fadeIn: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  return (
    <div className="bg-white text-slate-900 min-h-screen font-sans overflow-x-hidden">



      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-6 pb-12 md:pt-10 md:pb-16 bg-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/images/hero-bg.jpg" alt="Background" className="w-full h-full object-cover opacity-5 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/60" />
        </div>

        <div className="container-x relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">

            {/* TEXT */}
            <motion.div
              className="lg:col-span-7"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#3d6eff]/10 text-[#3d6eff] border border-[#3d6eff]/20 rounded-full text-sm font-semibold mb-6 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3d6eff] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3d6eff]"></span>
                </span>
                Spécialiste N°1 en Tunisie
              </motion.div>

              <motion.h1 variants={fadeIn} className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl text-slate-900 leading-[1.15] mb-6">
                Trouvez le <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3d6eff] to-blue-700 drop-shadow-sm">rétroviseur parfait</span> pour votre voiture en 3 clics.
              </motion.h1>

              <motion.p variants={fadeIn} className="text-lg text-slate-600 max-w-xl mb-8 leading-relaxed">
                Plus besoin de chercher des heures ou de vous déplacer. Sélectionnez votre véhicule, commandez en ligne et recevez votre pièce chez vous, prête à être montée.
              </motion.p>

              <motion.div variants={fadeIn} className="flex flex-wrap gap-4">
                <button onClick={() => navigate('/catalog')} className="bg-[#3d6eff] hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-[#3d6eff]/30 transition-all hover:-translate-y-1 flex items-center gap-2">
                  <Search className="w-5 h-5" /> Explorer le catalogue
                </button>
                <button onClick={() => navigate('/contact')} className="bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center gap-2 shadow-sm">
                  Obtenir un devis gratuit
                </button>
              </motion.div>

              <motion.div variants={fadeIn} className="mt-8 flex items-center gap-4 text-sm text-slate-600">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-[#3d6eff] border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-sm overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                    </div>
                  ))}
                </div>
                <p>Déjà plus de <strong className="text-slate-900">5,000 clients</strong> satisfaits</p>
              </motion.div>
            </motion.div>

            {/* WIDGET RECHERCHE */}
            <motion.div
              className="lg:col-span-5"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="bg-white p-2 rounded-[2rem] shadow-2xl relative">
                <div className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 font-black px-4 py-2 rounded-full transform rotate-12 shadow-lg text-sm border-2 border-white z-10">
                  Recherche Rapide !
                </div>
                <VehicleSelector variant="hero" />
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ===== PROMO SECTION (Carousel + Grid) ===== */}
      <section className="py-4 md:py-6 relative z-20 -mt-6">
        <div className="container-x mb-2">
          {/* Carousel */}
          <div className="relative w-full h-[180px] md:h-[220px] overflow-hidden group border border-slate-200 rounded-2xl md:rounded-[2rem] shadow-2xl">
            {promos.map((promo, idx) => (
              <img
                key={idx}
                src={promo}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === activePromo ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                alt={`Promo ${idx + 1}`}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent z-10 pointer-events-none" />

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-20">
              {promos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePromo(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 shadow-sm ${idx === activePromo ? 'bg-[#3d6eff] w-6' : 'bg-white/80 hover:bg-white'}`}
                  aria-label={`Aller à la diapositive ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 4-Block Grid */}
        <div className="container-x mt-3 md:mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-xl border border-slate-200">

            <div className="bg-[#595959] text-white p-5 md:p-6 flex flex-col justify-center min-h-[180px] lg:min-h-[200px]">
              <h3 className="font-display font-bold text-2xl lg:text-3xl leading-tight uppercase tracking-tight mb-2">Un concept<br />novateur</h3>
              <p className="text-left text-sm md:text-sm font-medium leading-relaxed text-white/90">
                Vente tous type de miroirs de rétroviseurs en un seul site
              </p>
            </div>

            <div className="min-h-[180px] lg:min-h-[200px] bg-slate-200">
              <img
                src="/images/retro-paysage.jpg"
                className="w-full h-full object-cover"
                alt="Rétroviseur paysage"
              />
            </div>

            <div className="bg-[#3d6eff] text-white p-5 md:p-6 flex flex-col justify-center min-h-[180px] lg:min-h-[200px]">
              <h3 className="font-display font-bold text-2xl lg:text-3xl leading-tight uppercase tracking-tight mb-2">La qualité<br />Acil Retro</h3>
              <p className="text-left text-sm md:text-sm font-medium leading-relaxed text-white/90">
                Une Vaste gamme de références.<br className="hidden lg:block" />
                Un Service rapide et un gain de temps précieux.
              </p>
            </div>

            <div className="min-h-[180px] lg:min-h-[200px] bg-slate-200">
              <img
                src="/images/Stock.png"
                className="w-full h-full object-cover"
                alt="Stock"
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
              <img src="/images/camion.png" alt="Livraison Express" className="h-14 w-auto mb-4 object-contain" />
              <h3 className="font-display font-bold text-[13px] uppercase tracking-wider text-black">Livraison Express</h3>
            </div>
            <div className="flex flex-col items-center justify-center">
              <Wrench className="w-14 h-14 mb-4 text-black" strokeWidth={1.5} />
              <h3 className="font-display font-bold text-[13px] uppercase tracking-wider text-black">Pose Possible</h3>
            </div>
            <div className="flex flex-col items-center justify-center">
              <img src="/images/paiement.png" alt="Paiement à la livraison" className="h-14 w-auto mb-4 object-contain" />
              <h3 className="font-display font-bold text-[13px] uppercase tracking-wider text-black">Paiement à la livraison</h3>
            </div>
            <div className="flex flex-col items-center justify-center">
              <Headset className="w-14 h-14 mb-4 text-black" strokeWidth={1.5} />
              <h3 className="font-display font-bold text-[13px] uppercase tracking-wider text-black">Assistance Téléphonique 7/7</h3>
            </div>
          </div>
        </div>

        {/* The Blue Banner */}
        <div className="bg-[#3d6eff] py-12">
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
                  className="flex-shrink-0 w-48 h-28 md:w-72 md:h-40 bg-white border border-slate-100 shadow-sm rounded-2xl flex items-center justify-center p-4 md:p-8 cursor-pointer hover:border-[#3d6eff]/40 hover:shadow-md transition-all group"
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
        </div>
      </section>

      {/* ===== TOP PRODUCTS ===== */}
      <section className="pt-12 pb-4 bg-white">
        <div className="container-x">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 text-brand-600 font-bold mb-2 text-sm uppercase tracking-wider">
                <Star className="w-4 h-4 fill-brand-600" /> Les plus demandés
              </div>
              <h2 className="font-display font-black text-3xl md:text-4xl text-slate-900">Produits Populaires</h2>
            </motion.div>
            <motion.button
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              onClick={() => navigate('/catalog')}
              className="text-brand-600 font-bold hover:text-brand-700 flex items-center gap-2 group bg-brand-50 px-6 py-3 rounded-xl hover:bg-brand-100 transition-colors"
            >
              Voir tout le catalogue <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>

          {topProducts.length > 0 ? (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {topProducts.map((p) => (
                <motion.div key={p.id} variants={fadeIn}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center text-slate-500 py-10 bg-slate-50 rounded-3xl border border-slate-100">
              Chargement des produits populaires...
            </div>
          )}
        </div>
      </section>

      {/* ===== ABOUT / PROJECT ===== */}
      <section className="pt-8 pb-4 bg-slate-50 overflow-hidden relative">
        <div className="container-x relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Image Column */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="relative rounded-3xl overflow-hidden shadow-2xl shadow-[#3d6eff]/10 h-[450px]"
            >
              <img src="/images/retro-paysage.jpg" alt="Atelier Acil Retro" className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <div className="bg-[#3d6eff] text-white font-bold px-4 py-2 rounded-lg inline-block mb-3 shadow-lg">Depuis 1994</div>
                <h3 className="text-2xl font-bold">L'expertise à votre service</h3>
              </div>
            </motion.div>

            {/* Text Column */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col justify-center"
            >
              <div className="inline-flex items-center gap-2 text-[#3d6eff] font-bold mb-2 text-sm uppercase tracking-wider">
                <ShieldCheck className="w-5 h-5" /> À propos de nous
              </div>
              <h2 className="font-display font-black text-3xl md:text-4xl mb-4 leading-tight text-slate-900">
                L'expert du miroir de rétroviseur
              </h2>
              <p className="text-slate-600 text-base md:text-lg mb-6 leading-relaxed">
                Né d'une passion pour l'automobile, <strong className="text-[#3d6eff]">Acil Retro</strong> est devenu la référence incontournable pour la vision arrière de votre véhicule. Nous allions savoir-faire technique et service client irréprochable.
                <strong className="text-[#3d6eff]"> Depuis 1994</strong>, AcilRetro entretient vos miroirs de rétroviseurs selon les normes internationales.
                Proposant une livraison partout en <strong className="text-[#3d6eff]">Tunisie</strong> et en <strong className="text-[#3d6eff]">Europe</strong>.
              </p>

              <ul className="space-y-3 mb-6">
                {[
                  "Vente de pièces d'origine et adaptables de haute qualité.",
                  "A la recherche d’une solution pratique ? Commandez votre miroir de rétroviseur et recevez votre pièce directement de votre voiture",
                  "Installation professionnelle rapide dans nos ateliers ou chez vous."
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ delay: 0.2 + (i * 0.1) }}
                  >
                    <div className="w-6 h-6 rounded-full bg-[#3d6eff]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-[#3d6eff]" />
                    </div>
                    <span className="text-slate-700 font-medium leading-relaxed text-sm md:text-base">{item}</span>
                  </motion.li>
                ))}
              </ul>

              <div>
                <button onClick={() => setShowCertModal(true)} className="bg-[#3d6eff] text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-600 transition-all hover:-translate-y-1 shadow-lg shadow-[#3d6eff]/30 flex items-center gap-2 justify-center w-full sm:w-auto">
                  <ShieldCheck className="w-5 h-5" /> Nos certifications
                </button>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="pt-4 pb-8 bg-slate-50">
        <div className="container-x">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              className="font-display font-black text-3xl md:text-4xl text-slate-900 mb-4"
            >
              Ils nous font confiance
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-slate-600"
            >
              Découvrez ce que nos clients pensent de la qualité de nos produits et de notre service.
            </motion.p>
          </div>

          <div className="relative mt-8 group">
            <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>

            <div
              ref={scrollContainerRef}
              className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {reviews.map((review, i) => (
                <div
                  key={i}
                  className="w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] flex-shrink-0 snap-center bg-white p-6 md:p-8 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-100 hover:-translate-y-2 transition-transform duration-300"
                >
                  <div className="flex gap-1 mb-6">
                    {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <p className="text-slate-700 mb-6 italic text-lg leading-relaxed" dir={/[\u0600-\u06FF]/.test(review.text) ? 'rtl' : 'ltr'}>"{review.text}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full flex items-center justify-center text-brand-700 font-bold text-xl shadow-inner flex-shrink-0">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{review.name}</h4>
                      <p className="text-sm text-slate-500">{review.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Buttons - Desktop (Sides) */}
            <button
              onClick={() => scrollReviews('left')}
              className="hidden md:flex absolute -left-5 lg:-left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white border border-slate-200 items-center justify-center text-slate-600 hover:bg-[#3d6eff] hover:text-white hover:border-[#3d6eff] transition-all shadow-md"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => scrollReviews('right')}
              className="hidden md:flex absolute -right-5 lg:-right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white border border-slate-200 items-center justify-center text-slate-600 hover:bg-[#3d6eff] hover:text-white hover:border-[#3d6eff] transition-all shadow-md"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Navigation Buttons - Mobile (Bottom) */}
            <div className="flex md:hidden justify-center gap-4 mt-2">
              <button onClick={() => scrollReviews('left')} className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-[#3d6eff] hover:text-white hover:border-[#3d6eff] transition-all shadow-sm">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={() => scrollReviews('right')} className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-[#3d6eff] hover:text-white hover:border-[#3d6eff] transition-all shadow-sm">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="pt-8 pb-10 bg-slate-50 text-left px-4 relative">
        <div className="max-w-6xl mx-auto">
          {/* Main Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="relative rounded-2xl overflow-hidden shadow-2xl bg-[#3d6eff]"
          >
            {/* Background image on the right */}
            <div
              className="absolute inset-y-0 right-0 w-full md:w-1/2 bg-cover bg-center mix-blend-overlay opacity-80 md:opacity-100 md:mix-blend-normal"
              style={{ backgroundImage: "url('/images/retro-route.jpg')" }}
            ></div>
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#3d6eff] via-[#3d6eff]/90 to-transparent"></div>

            {/* Content */}
            <div className="relative z-10 px-8 py-8 md:px-12 md:py-10 lg:px-16 lg:py-12 max-w-2xl text-left">
              <p className="text-white/80 uppercase tracking-widest text-xs font-bold mb-3">VOTRE SÉCURITÉ AVANT TOUT</p>
              <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-white mb-4 leading-tight">
                Prêt à réparer votre véhicule ?
              </h2>
              <p className="text-white/90 text-base md:text-lg mb-6 leading-relaxed max-w-xl">
                Ne laissez pas un rétroviseur cassé gâcher votre sécurité. Choisissez parmi nos options de qualité. Pré-commandez en quelques minutes et reprenez la route en toute confiance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => navigate('/catalog')} className="bg-white text-[#3d6eff] px-8 py-3.5 rounded-lg font-bold text-base hover:bg-slate-50 transition-colors shadow-lg">
                  Voir le catalogue
                </button>
              </div>
            </div>
          </motion.div>

          {/* Contact Section Below Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: 0.2 }}
            className="mt-8 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8 py-6 px-4 md:px-8 bg-white rounded-2xl shadow-sm border border-slate-100"
          >
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900 mb-1">Prêt à commencer ?</h3>
              <p className="text-slate-500 text-sm md:text-base">Vous avez des questions ? Notre équipe est là pour vous aider à trouver la pièce parfaite.</p>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 lg:gap-10">
              {/* Phone */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#0a4de3] shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Appelez-nous</p>
                    <p className="text-slate-500 text-sm">+216 27 804 642</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#0a4de3] shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm">+216 24 244 061</p>
                  </div>
                </div>
              </div>

              <div className="w-px h-10 bg-slate-200 hidden md:block"></div>

              {/* Email */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#0a4de3]">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Envoyez-nous un e-mail</p>
                  <p className="text-slate-500 text-sm">contact@acilretro.com</p>
                </div>
              </div>

              <div className="w-px h-10 bg-slate-200 hidden md:block"></div>

              {/* Visit */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#0a4de3]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Visitez-nous</p>
                  <p className="text-slate-500 text-sm">Ben Arous, Rue D'Egypte</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== CERTIFICATIONS MODAL ===== */}
      <AnimatePresence>
        {showCertModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCertModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 md:p-10 max-w-5xl w-full max-h-[95vh] overflow-y-auto shadow-2xl relative"
            >
              <button
                onClick={() => setShowCertModal(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors font-bold text-lg"
              >
                ✕
              </button>

              <h3 className="text-2xl md:text-3xl font-black font-display text-slate-900 mb-8 text-center">
                Nos Certifications Officielles
              </h3>

              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 bg-slate-50 rounded-2xl p-4 flex items-center justify-center border border-slate-100">
                  <img src="/images/cert.png" alt="Certification 1" className="w-full h-auto max-h-[60vh] object-contain rounded-xl shadow-sm" />
                </div>
                <div className="flex-1 bg-slate-50 rounded-2xl p-4 flex items-center justify-center border border-slate-100">
                  <img src="/images/cert2.png" alt="Certification 2" className="w-full h-auto max-h-[60vh] object-contain rounded-xl shadow-sm" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
