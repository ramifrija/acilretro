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
    <div className="min-h-screen bg-[#3d6eff] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-gradient-to-b from-[#142c6e] to-[#071440] rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20 border border-[#1d3b8b]">
            <Lock className="h-5 w-5 text-white" />
          </div>
        </div>
        <h2 className="mt-5 text-center text-3xl font-extrabold text-white font-display">
          Espace Pro
        </h2>
        <p className="mt-3 text-center text-[13px] text-blue-200/70">
          Connectez-vous pour accéder à l'administration
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#071440] py-8 px-4 sm:rounded-2xl sm:px-10 border border-[#182f6b]">
          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="bg-error-500/10 border border-error-500/50 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-error-500 shrink-0 mt-0.5" />
                <p className="text-sm text-error-400">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-white mb-2">
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-[#3B82F6]" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 px-4 py-3 border border-[#182f6b] rounded-xl shadow-sm placeholder-[#1f47e6]/50 bg-[#091a55] text-[#1f47e6] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                  placeholder="admin@acil-retro.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-white mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-[#3B82F6]" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 px-4 py-3 border border-[#182f6b] rounded-xl shadow-sm placeholder-[#1f47e6]/50 bg-[#091a55] text-[#1f47e6] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-600/20 text-sm font-bold text-white bg-[#1f47e6] hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#050f33] focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Se connecter'
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-8 text-center space-y-4">
            <p className="text-[12px]">
              <button
                onClick={() => navigate('/')}
                className="text-[#1f47e6] hover:text-blue-400 transition-colors flex items-center justify-center gap-1 mx-auto"
              >
                — Retour au site
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
