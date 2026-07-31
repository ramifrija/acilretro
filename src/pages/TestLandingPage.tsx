import { useState, useEffect } from 'react';
import { Truck, ShieldCheck, Phone, Search, Wrench, Layers, Maximize, ArrowRight, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import VehicleSelector from '@/components/VehicleSelector';
import { useRouter } from '@/context/RouterContext';

export default function TestLandingPage() {
  const { navigate } = useRouter();

  const [activePromo, setActivePromo] = useState(0);
  const promos = [
    "/images/1.png",
    "/images/2.png",
    "/images/3.png"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActivePromo(prev => (prev + 1) % promos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const categories = [
    {
      title: 'Glace de Rétroviseur',
      subtitle: 'Miroirs seuls',
      icon: Maximize,
      img: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&q=80&w=600',
    },
    {
      title: 'Coque de Rétroviseur',
      subtitle: 'Protection extérieure',
      icon: Layers,
      img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=600',
    },
    {
      title: 'Rétroviseur Complet',
      subtitle: 'Bloc mécanique & glace',
      icon: Wrench,
      img: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600',
    },
    {
      title: 'Clignotant',
      subtitle: 'Lumières de rétro',
      icon: Zap,
      img: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=600',
    }
  ];

  const brandLogos = [
    { name: 'Renault', logo: 'https://cdn.simpleicons.org/renault/000000' },
    { name: 'Peugeot', logo: 'https://cdn.simpleicons.org/peugeot/000000' },
    { name: 'Volkswagen', logo: 'https://cdn.simpleicons.org/volkswagen/000000' },
    { name: 'Citroën', logo: 'https://cdn.simpleicons.org/citroen/000000' },
    { name: 'Fiat', logo: 'https://cdn.simpleicons.org/fiat/000000' },
    { name: 'Kia', logo: 'https://cdn.simpleicons.org/kia/000000' },
    { name: 'Dacia', logo: 'https://cdn.simpleicons.org/dacia/000000' },
    { name: 'Chrysler', logo: 'https://cdn.simpleicons.org/chrysler/000000' },
    { name: 'Ford', logo: 'https://cdn.simpleicons.org/ford/000000' },
    { name: 'Toyota', logo: 'https://cdn.simpleicons.org/toyota/000000' },
    { name: 'Hyundai', logo: 'https://cdn.simpleicons.org/hyundai/000000' },
    { name: 'BMW', logo: 'https://cdn.simpleicons.org/bmw/000000' },
    { name: 'Volvo', logo: 'https://cdn.simpleicons.org/volvo/000000' },
    { name: 'Audi', logo: 'https://cdn.simpleicons.org/audi/000000' },
    { name: 'Nissan', logo: 'https://cdn.simpleicons.org/nissan/000000' },
    { name: 'Honda', logo: 'https://cdn.simpleicons.org/honda/000000' },
    { name: 'Seat', logo: 'https://cdn.simpleicons.org/seat/000000' },
    { name: 'Skoda', logo: 'https://cdn.simpleicons.org/skoda/000000' }
  ];

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen font-sans">
      
      {/* Top Banner (Reassurance) */}
      <div className="bg-brand-600 text-white text-sm py-2">
        <div className="container-x flex flex-col md:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 font-medium"><Truck className="w-4 h-4" /> Livraison 24/48h sur toute la Tunisie</span>
            <span className="hidden md:flex items-center gap-2 font-medium opacity-80">|</span>
            <span className="hidden md:flex items-center gap-2 font-medium"><ShieldCheck className="w-4 h-4" /> Satisfait ou remboursé</span>
          </div>
          <div className="flex items-center gap-2 font-bold">
            <Phone className="w-4 h-4" /> Besoin d'aide ? 71 999 000
          </div>
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
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1e2a52]/80 text-brand-100 rounded-full text-[11px] font-semibold mb-8 border border-white/5 backdrop-blur-sm shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> N°1 du rétroviseur en Tunisie
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-[76px] font-black text-white leading-[1.05] mb-6 tracking-tighter drop-shadow-xl">
                Les bonnes<br/>
                pièces.<br/>
                <span className="text-[#38bdf8]">Pour la bonne<br/>voiture.</span>
              </h1>
              
              <p className="text-lg text-brand-100/90 mb-10 max-w-[420px] leading-relaxed">
                Spécialiste des rétroviseurs et pièces détachées automobiles.<br/>
                Trouvez la pièce exacte pour votre véhicule en quelques clics.
              </p>
              
              {/* Features List / Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                <button className="flex items-center gap-2 bg-[#2563eb] hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium text-sm transition-colors shadow-lg shadow-blue-900/20">
                  Explorer le catalogue <ArrowRight className="w-4 h-4" />
                </button>
                <button className="bg-[#273568]/60 hover:bg-[#273568]/80 text-white border border-[#3b4b86] px-6 py-3 rounded-lg font-medium text-sm transition-colors backdrop-blur-sm">
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

      {/* ===== PROMO CAROUSEL ===== */}
      <section className="container-x py-8 md:py-12">
        <div className="relative w-full h-[250px] md:h-[400px] rounded-3xl overflow-hidden group shadow-2xl shadow-brand-900/10 border border-slate-200">
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
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
            {promos.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setActivePromo(idx)}
                className={`w-3 h-3 rounded-full transition-all duration-300 shadow-sm ${idx === activePromo ? 'bg-brand-500 w-8' : 'bg-white/80 hover:bg-white'}`}
                aria-label={`Aller à la diapositive ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES (Visual Grid) ===== */}
      <section className="container-x py-16">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Notre Catalogue</h2>
        <p className="text-slate-500 mb-8 text-lg">Choisissez la catégorie de la pièce que vous recherchez.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <div key={i} onClick={() => navigate('/catalog')} className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-brand-300 transition-all">
              <div className="h-40 overflow-hidden relative">
                <img src={cat.img} alt={cat.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors" />
              </div>
              <div className="p-6">
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-4 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  <cat.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl text-slate-900 mb-1">{cat.title}</h3>
                <p className="text-sm text-slate-500 mb-4">{cat.subtitle}</p>
                <div className="text-brand-600 font-semibold flex items-center gap-2 text-sm">
                  Voir les produits <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
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
          
          <div className="text-center mt-10">
            <button onClick={() => navigate('/catalog')} className="px-8 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:border-slate-300 transition-colors">
              Voir toutes les marques
            </button>
          </div>
        </div>
      </section>

      {/* ===== E-COMMERCE GUARANTEES ===== */}
      <section className="container-x py-16">
        <div className="grid md:grid-cols-4 gap-8">
          
          <div className="text-center">
            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-600">
              <Truck className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Livraison Rapide</h3>
            <p className="text-sm text-slate-600">Expédition sous 24/48h partout en Tunisie avec nos transporteurs partenaires.</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-600">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Paiement Sécurisé</h3>
            <p className="text-sm text-slate-600">Payez à la livraison ou en ligne de manière 100% sécurisée.</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Qualité Originale</h3>
            <p className="text-sm text-slate-600">Des pièces certifiées de première monte (OEM) pour garantir votre sécurité.</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-600">
              <Phone className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Service Client</h3>
            <p className="text-sm text-slate-600">Une question ? Un doute sur la compatibilité ? Contactez-nous.</p>
          </div>
          
        </div>
      </section>

    </div>
  );
}
