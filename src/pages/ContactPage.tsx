import { useState, useEffect } from 'react';
import { Send, MapPin, Phone, Mail, Clock, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className="container-x py-12 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="font-display font-extrabold text-4xl text-slate-900 dark:text-white">Contactez-nous</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-3">Notre équipe est à votre disposition pour vous accompagner</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          {[
            { icon: MapPin, title: 'Adresse', value: settings.address },
            { icon: Phone, title: 'Téléphone', value: settings.phone },
            { icon: Mail, title: 'Email', value: settings.email },
            { icon: Clock, title: 'Horaires', value: 'Lun-Sam: 8h00 - 18h00' },
          ].map((c, i) => (
            <div key={i} className="glass-card p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-800/40 flex items-center justify-center shrink-0">
                <c.icon className="w-5 h-5 text-brand-600 dark:text-brand-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{c.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          <form onSubmit={submit} className="glass-card p-6 md:p-8">
            {sent && (
              <div className="mb-6 p-4 rounded-xl bg-success-500/10 text-success-600 flex items-center gap-2 animate-fade-in">
                <Check className="w-5 h-5" /> Votre message a été envoyé avec succès!
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Nom</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Votre nom" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Email</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="email@exemple.com" />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Sujet</label>
              <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input-field" placeholder="Objet du message" />
            </div>
            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Message</label>
              <textarea required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input-field resize-none" placeholder="Votre message..." />
            </div>
            <button type="submit" className="btn-primary w-full">
              <Send className="w-4 h-4" /> Envoyer le message
            </button>
          </form>
        </div>
      </div>

      {/* Map Section */}
      <div className="mt-12 glass-card p-2 md:p-4 animate-fade-in">
        <div className="w-full aspect-video md:aspect-[21/9] rounded-xl overflow-hidden mb-6 relative bg-slate-100 dark:bg-brand-900/50">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d508.96286200890046!2d10.225212463933072!3d36.76257611933546!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12fd371baeb8f655%3A0x1cec81003322a2ae!2sACIL%20Retro!5e1!3m2!1sfr!2stn!4v1785456779339!5m2!1sfr!2stn" 
            className="absolute inset-0 w-full h-full" 
            style={{ border: 0 }} 
            allowFullScreen 
            loading="lazy" 
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <div className="flex justify-center mb-4">
          <a 
            href="https://www.google.com/maps/place/ACIL+Retro/@36.7625761,10.2252125,18z/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-primary px-8 py-3.5 shadow-xl shadow-brand-500/20 hover:-translate-y-1 transition-transform"
          >
            <MapPin className="w-5 h-5 mr-2" />
            Ouvrir dans Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
