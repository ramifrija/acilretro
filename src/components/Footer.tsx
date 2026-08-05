import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Linkedin } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Footer() {
  const { navigate } = useRouter();
  const [settings, setSettings] = useState({
    email: 'contact@acilretro.com',
    phone: '+216 71 000 000',
    address: 'Zone Industrielle, Tunis'
  });

  useEffect(() => {
    supabase.from('site_settings').select('*').limit(1).then(({ data }) => {
      if (data && data[0]) setSettings(data[0]);
    });
  }, []);

  return (
    <footer className="bg-[#3d6eff] text-brand-100 mt-20">
      <div className="container-x py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Logo display */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-[200px] aspect-square rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/10">
              <img
                src="/images/acil_logo.png"
                alt="ACIL RETRO"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div>
                <div className="font-display font-extrabold text-lg text-white">ACIL RETRO</div>
                <div className="text-[10px] text-white/90 uppercase tracking-wide">Pièces Auto Premium</div>
              </div>
            </div>
            <p className="text-sm text-white leading-relaxed mb-4">
              Spécialiste tunisien des rétroviseurs et pièces détachées automobiles. Qualité OEM, expertise technique, livraison rapide.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[#1877F2] hover:border-[#1877F2] hover:-translate-y-1 hover:shadow-lg hover:shadow-[#1877F2]/20 transition-all duration-300">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[#E4405F] hover:border-[#E4405F] hover:-translate-y-1 hover:shadow-lg hover:shadow-[#E4405F]/20 transition-all duration-300">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-[#0A66C2] hover:border-[#0A66C2] hover:-translate-y-1 hover:shadow-lg hover:shadow-[#0A66C2]/20 transition-all duration-300">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-bold text-white mb-4">Navigation</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                ['/', 'Accueil'],
                ['/catalog', 'Catalogue'],
                ['/catalog?filter=promo', 'Promotions'],
                ['/quote', 'Demander un devis'],
                ['/contact', 'Contact'],
              ].map(([to, label]) => (
                <li key={to}>
                  <button onClick={() => navigate(to)} className="text-white hover:text-white/80 transition-colors">
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-bold text-white mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-white">
              <li className="flex items-start gap-2.5"><MapPin className="w-4 h-4 mt-0.5 shrink-0" /> {settings.address}</li>
              <li className="flex items-center gap-2.5"><Phone className="w-4 h-4 shrink-0" /> {settings.phone}</li>
              <li className="flex items-center gap-2.5"><Mail className="w-4 h-4 shrink-0" /> {settings.email}</li>
              <li className="flex items-center gap-2.5"><Clock className="w-4 h-4 shrink-0" /> Lun-Sam: 8h00 - 18h00</li>
            </ul>
          </div>


        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white">
          <p>© 2026 ACIL RETRO. Tous droits réservés.</p>
          <div className="flex gap-4">
            <button onClick={() => navigate('/mentions-legales')} className="hover:text-white transition-colors">Mentions légales</button>
            <button onClick={() => navigate('/cgv')} className="hover:text-white transition-colors">CGV</button>
            <button onClick={() => navigate('/confidentialite')} className="hover:text-white transition-colors">Confidentialité</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
