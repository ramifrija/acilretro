import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { navigate } = useRouter();
  const { session, isAdmin } = useAuth();

  // Si déjà connecté et admin, rediriger
  if (session && isAdmin) {
    navigate('/admin');
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // La redirection se fera via le composant principal App.tsx une fois le contexte mis à jour
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-600/20 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="h-14 w-14 bg-brand-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-brand-900/50 border border-white/10">
            <Lock className="h-7 w-7 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white font-display">
          Espace Pro
        </h2>
        <p className="mt-2 text-center text-sm text-brand-300">
          Connectez-vous pour accéder à l'administration
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-brand-900/40 backdrop-blur-xl py-8 px-4 shadow-glass-lg sm:rounded-2xl sm:px-10 border border-brand-800/50">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-error-500/10 border border-error-500/50 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-error-500 shrink-0 mt-0.5" />
                <p className="text-sm text-error-400">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-100">
                Adresse email
              </label>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-brand-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 px-4 py-2.5 border border-brand-700/50 rounded-xl shadow-sm placeholder-brand-500 bg-brand-950/50 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-shadow"
                  placeholder="admin@acil-retro.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brand-100">
                Mot de passe
              </label>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-brand-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 px-4 py-2.5 border border-brand-700/50 rounded-xl shadow-sm placeholder-brand-500 bg-brand-950/50 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-shadow"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg shadow-brand-600/20 text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-950 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Se connecter'
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-brand-300">
              Pas encore de compte admin ?{' '}
              <button
                onClick={() => navigate('/admin/register')}
                className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
              >
                S'inscrire
              </button>
            </p>
            <p className="mt-4 text-xs">
              <button
                onClick={() => navigate('/')}
                className="text-brand-500 hover:text-brand-400 transition-colors flex items-center justify-center gap-1 mx-auto"
              >
                &larr; Retour au site
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
