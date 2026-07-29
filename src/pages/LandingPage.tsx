import { useEffect, useState } from 'react';
import { ArrowRight, ShieldCheck, Truck, Award, Wrench, Clock, Star, Quote, Search, ChevronDown, MapPin, Phone, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types/database';
import VehicleSelector from '@/components/VehicleSelector';
import ProductCard from '@/components/ProductCard';
import { useRouter } from '@/context/RouterContext';

export default function LandingPage() {
  const { navigate } = useRouter();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [promos, setPromos] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    '/images/carousel1.png',
    '/images/carousel2.png'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    supabase.from('products').select('*').eq('featured', true).limit(5).then(({ data }) => setFeatured(data || []));
    supabase.from('products').select('*').eq('best_seller', true).limit(5).then(({ data }) => setBestSellers(data || []));
    supabase.from('products').select('*').eq('is_promo', true).limit(5).then(({ data }) => setPromos(data || []));
    supabase.from('products').select('*').eq('new_arrival', true).limit(5).then(({ data }) => setNewArrivals(data || []));
  }, []);

  const stats = [
    { value: '15K+', label: 'Références en stock' },
    { value: '25+', label: 'Marques couvertes' },
    { value: '12K+', label: 'Clients satisfaits' },
    { value: '15', label: 'Ans d\'expérience' },
  ];

  const trust = [
    { icon: ShieldCheck, title: 'Garantie qualité', desc: 'Tous nos produits sont garantis 12 à 36 mois' },
    { icon: Truck, title: 'Livraison rapide', desc: 'Expédition sous 24-48h partout en Tunisie' },
    { icon: Award, title: 'Qualité OEM', desc: 'Pièces d\'origine et équivalents certifiés' },
    { icon: Wrench, title: 'Expertise technique', desc: 'Conseils par des spécialistes automobile' },
  ];

  const services = [
    { icon: Wrench, title: 'Rétroviseurs complets', desc: 'Assemblages complets pour toutes marques' },
    { icon: Search, title: 'Recherche par véhicule', desc: 'Compatibilité garantie par notre sélecteur intelligent' },
    { icon: Truck, title: 'Livraison express', desc: 'Livraison en 24-48h sur tout le territoire' },
    { icon: ShieldCheck, title: 'Garantie étendue', desc: 'Jusqu\'à 36 mois de garantie sur certains produits' },
  ];

  const faqs = [
    { q: 'Comment trouver la pièce compatible avec mon véhicule ?', a: 'Utilisez notre sélecteur de véhicule en choisissant la marque, le modèle, l\'année et le type de carburant. Le système n\'affiche que les pièces compatibles.' },
    { q: 'Quels sont les délais de livraison ?', a: 'Nous expédions sous 24-48h. La livraison prend 1 à 3 jours selon votre région en Tunisie.' },
    { q: 'Les produits sont-ils garantis ?', a: 'Oui, tous nos produits sont garantis entre 12 et 36 mois selon la référence.' },
    { q: 'Puis-je demander un devis avant d\'acheter ?', a: 'Absolument. Ajoutez les produits au panier puis choisissez "Demander un devis" au lieu de commander.' },
    { q: 'Proposez-vous des prix pour les professionnels ?', a: 'Oui, les entreprises bénéficient de tarifs préférentiels. Créez un compte professionnel ou contactez-nous.' },
  ];

  return (
    <div className="animate-fade-in">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-brand-radial pt-12 pb-20 lg:pt-20 lg:pb-32">
        {/* Carousel Backgrounds */}
        {slides.map((src, i) => (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              currentSlide === i ? 'opacity-40' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}
        {/* Dark Overlay to make text readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950/90 to-brand-950/50" />

        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none mix-blend-overlay">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/50 rounded-full blur-3xl animate-float" />
          <div className="absolute top-20 -right-40 w-96 h-96 bg-accent-500/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-brand-700/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
        </div>

        <div className="container-x relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-6 animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                <span className="text-xs font-semibold text-brand-100">N°1 du rétroviseur en Tunisie</span>
              </div>
              <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.1] mb-6 animate-fade-in-up">
                Les bonnes pièces.<br />
                <span className="text-gradient">Pour la bonne voiture.</span>
              </h1>
              <p className="text-lg text-brand-200 mb-8 max-w-xl mx-auto lg:mx-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                Spécialiste des rétroviseurs et pièces détachées automobiles. Trouvez la pièce exacte pour votre véhicule en quelques clics.
              </p>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <button onClick={() => navigate('/catalog')} className="btn-primary">
                  Explorer le catalogue <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => navigate('/quote')} className="btn-ghost text-white">
                  Demander un devis
                </button>
              </div>
            </div>

            {/* Vehicle selector */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <VehicleSelector variant="hero" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== TRUST BADGES ===== */}
      <section className="container-x -mt-10 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {trust.map((t, i) => (
            <div key={i} className="glass-card p-5 flex items-start gap-3 hover:-translate-y-1 transition-all duration-300">
              <div className="w-11 h-11 rounded-xl bg-brand-100 dark:bg-brand-800/40 flex items-center justify-center shrink-0">
                <t.icon className="w-5 h-5 text-brand-600 dark:text-brand-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS ===== */}
      <ProductSection title="Produits en vedette" subtitle="Sélection de nos meilleurs produits" products={featured} cta="/catalog" />

      {/* ===== PROMO BANNER ===== */}
      <section className="container-x my-16">
        <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-8 lg:p-12">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-accent-400 text-sm font-bold uppercase tracking-wide">Offres du moment</span>
              <h2 className="font-display font-extrabold text-3xl lg:text-4xl text-white mt-2">Jusqu'à -20% sur les rétroviseurs</h2>
              <p className="text-brand-200 mt-2">Profitez de nos prix exceptionnels sur une sélection de produits</p>
            </div>
            <button onClick={() => navigate('/catalog?filter=promo')} className="btn-ghost text-white shrink-0">
              Voir les promos <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ===== BEST SELLERS ===== */}
      <ProductSection title="Meilleures ventes" subtitle="Les plus populaires chez nos clients" products={bestSellers} cta="/catalog" />

      {/* ===== STATS ===== */}
      <section className="bg-brand-950 py-16 my-16">
        <div className="container-x">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map((s, i) => (
              <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="font-display font-extrabold text-4xl lg:text-5xl text-gradient">{s.value}</div>
                <div className="text-sm text-brand-300 mt-2">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== NEW ARRIVALS ===== */}
      <ProductSection title="Nouveautés" subtitle="Les derniers produits ajoutés" products={newArrivals} cta="/catalog" />

      {/* ===== SERVICES ===== */}
      <section className="container-x section-pad">
        <div className="text-center mb-12">
          <h2 className="font-display font-extrabold text-3xl lg:text-4xl text-slate-900 dark:text-white">Nos services</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-3">Une expertise complète au service de votre véhicule</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s, i) => (
            <div key={i} className="glass-card p-6 text-center hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-brand-gradient flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <s.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">{s.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PROMOS ===== */}
      {promos.length > 0 && (
        <ProductSection title="Promotions" subtitle="Offres limitées dans le temps" products={promos} cta="/catalog?filter=promo" />
      )}

      {/* ===== TESTIMONIALS ===== */}
      <section className="container-x section-pad">
        <div className="text-center mb-12">
          <h2 className="font-display font-extrabold text-3xl lg:text-4xl text-slate-900 dark:text-white">Ils nous font confiance</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-3">Ce que disent nos clients</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: 'Karim Ben Salah', role: 'Garage Auto, Tunis', text: 'Service impeccable et pièces de qualité. Je commande régulièrement pour mon garage et je n\'ai jamais été déçu.' },
            { name: 'Sophie Martin', role: 'Cliente particulière', text: 'J\'ai trouvé le rétroviseur exact pour ma Peugeot 206. Livraison rapide et prix très correct.' },
            { name: 'Mehdi Trabelsi', role: 'Société de transport', text: 'Le système de devis est parfait pour nos achats en gros. Réponse rapide et tarifs préférentiels.' },
          ].map((t, i) => (
            <div key={i} className="glass-card p-6">
              <Quote className="w-8 h-8 text-brand-300 mb-4" />
              <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed mb-6">{t.text}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-900 dark:text-white">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="container-x section-pad">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-extrabold text-3xl lg:text-4xl text-slate-900 dark:text-white">Questions fréquentes</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-3">Tout ce que vous devez savoir</p>
          </div>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="glass-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="font-semibold text-slate-900 dark:text-white">{f.q}</span>
                  <ChevronDown className={`w-5 h-5 text-brand-500 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-300 animate-fade-in">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTACT + MAP ===== */}
      <section className="container-x section-pad" id="contact">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="glass-card p-8">
            <h2 className="font-display font-extrabold text-2xl lg:text-3xl text-slate-900 dark:text-white mb-2">Contactez-nous</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Notre équipe est à votre écoute</p>
            <div className="space-y-4">
              {[
                { icon: MapPin, label: 'Zone Industrielle, Rue 12, Tunis, Tunisie' },
                { icon: Phone, label: '+216 71 000 000' },
                { icon: Mail, label: 'contact@acilretro.com' },
                { icon: Clock, label: 'Lun-Sam: 8h00 - 18h00' },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-800/40 flex items-center justify-center shrink-0">
                    <c.icon className="w-5 h-5 text-brand-600 dark:text-brand-300" />
                  </div>
                  <span className="text-slate-700 dark:text-slate-200">{c.label}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/contact')} className="btn-primary mt-6">
              Nous écrire <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="glass-card overflow-hidden min-h-[400px]">
            <iframe
              title="ACIL RETRO Location"
              src="https://www.openstreetmap.org/export/embed.html?bbox=10.18%2C36.78%2C10.22%2C36.82&layer=mapnik&marker=36.8065%2C10.1815"
              className="w-full h-full min-h-[400px] border-0"
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function ProductSection({ title, subtitle, products, cta }: { title: string; subtitle: string; products: Product[]; cta: string }) {
  const { navigate } = useRouter();
  if (!products.length) return null;
  return (
    <section className="container-x py-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="font-display font-extrabold text-2xl lg:text-3xl text-slate-900 dark:text-white">{title}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
        </div>
        <button onClick={() => navigate(cta)} className="text-sm font-semibold text-brand-600 dark:text-brand-300 hover:gap-2 flex items-center gap-1.5 transition-all">
          Voir tout <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
