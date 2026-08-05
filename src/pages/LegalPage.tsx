import { Shield, FileText, Lock } from 'lucide-react';
import { useEffect } from 'react';

type LegalPageProps = {
  type: 'mentions' | 'cgv' | 'confidentialite';
};

export default function LegalPage({ type }: LegalPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [type]);

  const content = {
    mentions: {
      title: 'Mentions Légales',
      icon: Shield,
      body: (
        <div className="space-y-6">
          <p>Dernière mise à jour : {new Date().toLocaleDateString()}</p>
          <section>
            <h2 className="text-xl font-bold mb-3">1. Éditeur du site</h2>
            <p>Le site ACIL RETRO est édité par la société ACIL RETRO, située à la Zone Industrielle, Tunis.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">2. Hébergement</h2>
            <p>Ce site est hébergé par des services cloud sécurisés.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">3. Propriété intellectuelle</h2>
            <p>L'ensemble du contenu (textes, images, etc.) est la propriété exclusive d'ACIL RETRO.</p>
          </section>
        </div>
      )
    },
    cgv: {
      title: 'Conditions Générales de Vente (CGV)',
      icon: FileText,
      body: (
        <div className="space-y-6">
          <p>Dernière mise à jour : {new Date().toLocaleDateString()}</p>
          <section>
            <h2 className="text-xl font-bold mb-3">1. Objet</h2>
            <p>Les présentes CGV régissent les ventes de pièces détachées automobiles réalisées sur le site ACIL RETRO.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">2. Prix</h2>
            <p>Les prix sont indiqués en Dinars Tunisiens (TND) et incluent la TVA applicable au jour de la commande.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">3. Commandes</h2>
            <p>La confirmation de la commande entraîne l'acceptation pleine et entière des présentes CGV.</p>
          </section>
        </div>
      )
    },
    confidentialite: {
      title: 'Politique de Confidentialité',
      icon: Lock,
      body: (
        <div className="space-y-6">
          <p>Dernière mise à jour : {new Date().toLocaleDateString()}</p>
          <section>
            <h2 className="text-xl font-bold mb-3">1. Collecte des données</h2>
            <p>Nous collectons les données strictement nécessaires au traitement de vos commandes (Nom, Email, Adresse, Téléphone).</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">2. Utilisation</h2>
            <p>Vos données ne sont ni vendues, ni louées, ni partagées avec des tiers à des fins commerciales.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3">3. Vos droits</h2>
            <p>Vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles.</p>
          </section>
        </div>
      )
    }
  };

  const { title, icon: Icon, body } = content[type];

  return (
    <div className="min-h-[70vh] py-12 px-4 animate-fade-in">
      <div className="max-w-4xl mx-auto glass-card p-6 md:p-12">
        <div className="flex items-center gap-4 mb-8 border-b border-slate-100 dark:border-white/5 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <Icon className="w-6 h-6" />
          </div>
          <h1 className="font-display font-bold text-3xl text-slate-900 dark:text-white">{title}</h1>
        </div>
        
        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
          {body}
        </div>
      </div>
    </div>
  );
}
