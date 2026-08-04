import { useState, useEffect } from 'react';
import { Palette, X } from 'lucide-react';

export default function ThemeEditor() {
  const [isOpen, setIsOpen] = useState(false);
  const [hue, setHue] = useState(225);
  const [lightnessOffset, setLightnessOffset] = useState(0);

  useEffect(() => {
    document.documentElement.style.setProperty('--brand-h', hue.toString());
    document.documentElement.style.setProperty('--brand-l-offset', `${lightnessOffset}%`);
  }, [hue, lightnessOffset]);

  const resetTheme = () => {
    setHue(225);
    setLightnessOffset(0);
  };

  const getHexFromHSL = (h: number, s: number, l: number) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
  };

  const currentHex = getHexFromHSL(hue, 100, 60 + lightnessOffset);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 left-6 z-[90] p-3 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300 flex items-center justify-center animate-fade-in-up ${
          isOpen ? 'bg-slate-800 text-white' : 'bg-brand-500 text-white hover:scale-110 hover:shadow-[0_6px_16px_rgba(0,0,0,0.2)]'
        }`}
        aria-label="Edit Theme Color"
      >
        {isOpen ? <X size={28} /> : <Palette size={28} />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 left-6 z-[90] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 w-80 animate-scale-in origin-bottom-left">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display font-semibold text-slate-900 dark:text-white">Personnaliser le Thème</h3>
            <button 
              onClick={resetTheme}
              className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium"
            >
              Réinitialiser
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Couleur Principale (Teinte)
                </label>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={hue}
                onChange={(e) => setHue(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'
                }}
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Luminosité
                </label>
                <span className="text-xs text-slate-500">{lightnessOffset > 0 ? '+' : ''}{lightnessOffset}%</span>
              </div>
              <input
                type="range"
                min="-30"
                max="30"
                value={lightnessOffset}
                onChange={(e) => setLightnessOffset(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>
            
            <div className="pt-2">
              <div className="w-full h-12 rounded-xl bg-brand-500 shadow-inner flex items-center justify-between px-4 text-white text-sm font-medium">
                <span>Aperçu</span>
                <span className="font-mono font-bold tracking-wider">{currentHex}</span>
              </div>
              <div className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                Code couleur (utilisable partout)
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
