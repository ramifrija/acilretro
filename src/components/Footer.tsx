import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Linkedin } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Footer() {
  const { navigate } = useRouter();
  const [settings, setSettings] = useState({
    email: 'king-glass@hotmail.com',
    phone: '+216 27 804 642',
    address: 'Ben Arous, Rue D\'Egypte'
  });

  useEffect(() => {
    supabase.from('site_settings').select('*').limit(1).then(({ data }) => {
      if (data && data[0]) setSettings(data[0]);
    });
  }, []);

  return (
    <footer className="bg-[#3d6eff] text-white mt-10">
      <div className="container-x pt-10 pb-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 xl:gap-8">

          {/* 1. Logo Block */}
          <div className="lg:col-span-4 flex items-start gap-4 xl:gap-6">
            <div className="w-24 xl:w-32 shrink-0">
              <img
                src="/images/acil_logo.png"
                alt="ACIL RETRO Icon"
                className="w-full h-auto object-contain"
              />
            </div>
            <div className="flex flex-col pt-1">
              <div className="font-display font-extrabold text-[28px] xl:text-[32px] text-white leading-none mb-1 whitespace-nowrap">
                ACIL RETRO
              </div>
              <div className="text-[11px] xl:text-[12px] text-white/80 font-medium tracking-wide uppercase mb-5 whitespace-nowrap">
                Spécialiste du Rétroviseur
              </div>
              <div className="flex gap-2">
                <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white hover:text-[#3d6eff] transition-colors shadow-sm">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white hover:text-[#3d6eff] transition-colors shadow-sm">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white hover:text-[#3d6eff] transition-colors shadow-sm">
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* 2. ACIL RETRO (About) */}
          <div className="lg:col-span-2">
            <h4 className="font-display font-bold text-white mb-4 text-sm uppercase pt-2">ACIL RETRO</h4>
            <p className="text-xs xl:text-sm leading-relaxed mb-4">
              Spécialiste tunisien des rétroviseurs et pièces détachées.
            </p>
          </div>

          {/* 3. LIENS UTILES */}
          <div className="hidden md:block lg:col-span-2">
            <h4 className="font-display font-bold text-white mb-4 text-sm uppercase pt-2">LIENS UTILES</h4>
            <ul className="space-y-2 text-xs xl:text-sm">
              {[
                ['/', 'Accueil'],
                ['/catalog', 'Catalogue'],
                ['/brands', 'Marques'],
                ['/contact', 'Contact'],
              ].map(([to, label]) => (
                <li key={to}>
                  <button onClick={() => navigate(to)} className="hover:text-white/70 transition-colors">
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. NOTRE ADRESSE */}
          <div className="lg:col-span-2">
            <h4 className="font-display font-bold text-white mb-4 text-sm uppercase pt-2">NOTRE ADRESSE</h4>
            <ul className="space-y-2 text-xs xl:text-sm mb-4">
              <li className="flex items-start gap-2"><MapPin className="w-4 h-4 shrink-0 text-white mt-0.5" /> <span>{settings.address}</span></li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0 text-white" /> <span>{settings.phone}</span></li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 shrink-0 text-white" /> <span>{settings.email}</span></li>
            </ul>
          </div>

          {/* 5. CONTACTEZ-NOUS */}
          <div className="lg:col-span-2">
            <h4 className="font-display font-bold text-white mb-4 text-sm uppercase pt-2">CONTACTEZ-NOUS</h4>
            <div className="flex items-start gap-2 text-xs xl:text-sm mb-4">
              <Clock className="w-4 h-4 shrink-0 text-white mt-0.5" /> 
              <span className="whitespace-pre-line">Lun-Vendredi: 8h00 - 17h00{'\n'}Sam : 8h00 - 15h00</span>
            </div>
          </div>

        </div>
      </div>

      {/* Copyright */}
      <div className="bg-[#2d58d9] py-4">
        <div className="container-x flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/70 font-medium">
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
