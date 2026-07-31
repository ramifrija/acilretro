import toast from 'react-hot-toast';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { createPortal } from 'react-dom';

export const customAlert = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
  const Icon = type === 'error' ? AlertTriangle : type === 'success' ? CheckCircle2 : Info;
  const colorClass = type === 'error' ? 'text-red-500' : type === 'success' ? 'text-success-500' : 'text-brand-500';
  const bgClass = type === 'error' ? 'bg-red-500/10' : type === 'success' ? 'bg-success-500/10' : 'bg-brand-500/10';

  toast.custom(
    (t) => (
      <>
        {createPortal(
          <div className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] transition-opacity duration-150 pointer-events-auto ${t.visible ? 'opacity-100' : 'opacity-0'}`} />,
          document.body
        )}
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white dark:bg-slate-900 shadow-xl rounded-2xl pointer-events-auto flex flex-col ring-1 ring-slate-200 dark:ring-white/10 overflow-hidden relative z-[9999]`}
        >
          <div className="p-6 flex items-start gap-4">
            <div className={`p-2 rounded-xl shrink-0 ${bgClass} ${colorClass}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 pt-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{message}</p>
            </div>
            <button
              onClick={() => toast.remove(t.id)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </>
    ),
    { duration: 4000, position: 'top-center' }
  );
};

export const customConfirm = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    toast.custom(
      (t) => (
        <>
          {createPortal(
            <div className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] transition-opacity duration-150 pointer-events-auto ${t.visible ? 'opacity-100' : 'opacity-0'}`} />,
            document.body
          )}
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } bg-white dark:bg-slate-900 rounded-2xl w-full sm:w-[400px] shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden pointer-events-auto ring-1 ring-black/5 relative z-[9999]`}
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl shrink-0 bg-brand-500/10 text-brand-500">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Confirmation</h3>
                  <p className="text-sm text-slate-500 mt-1">{message}</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    toast.remove(t.id);
                    resolve(false);
                  }}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    toast.remove(t.id);
                    resolve(true);
                  }}
                  className="btn-primary flex-1 !bg-brand-500 hover:!bg-brand-600"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </>
      ),
      { duration: Infinity, id: 'confirm-dialog', position: 'top-center' }
    );
  });
};
