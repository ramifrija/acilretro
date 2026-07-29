import { FileQuestion, Home, Search } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';

export default function NotFoundPage() {
  const { navigate } = useRouter();

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 animate-fade-in">
      <div className="max-w-lg w-full text-center glass-card p-10 md:p-14 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -z-10" />

        <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
          <FileQuestion className="w-10 h-10 text-slate-400" />
        </div>
        
        <h1 className="font-display font-extrabold text-7xl text-brand-500 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Page introuvable</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate('/')} 
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Retour à l'accueil
          </button>
          <button 
            onClick={() => navigate('/catalog')} 
            className="btn-ghost flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10"
          >
            <Search className="w-4 h-4" />
            Voir le catalogue
          </button>
        </div>
      </div>
    </div>
  );
}
