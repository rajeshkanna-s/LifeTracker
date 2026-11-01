import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles } from 'lucide-react';

interface AppInstallBannerProps {
  onInstall: () => void;
  isInstalled: boolean;
}

export const AppInstallBanner: React.FC<AppInstallBannerProps> = ({ onInstall, isInstalled }) => {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('dismiss_install_banner') === 'true';
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  if (isInstalled || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('dismiss_install_banner', 'true');
  };

  return (
    <aside 
      aria-label="App Installation Banner"
      className="fixed top-0 left-0 right-0 z-[100002] bg-white/95 text-slate-900 backdrop-blur-md border-b border-violet-200 shadow-lg px-3 sm:px-4 py-2.5 transition-all duration-300 animate-slideDown"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Left: App Icon & Details */}
        <div className="flex items-center gap-2.5 min-w-0">
          <img 
            src="/favicon.svg" 
            alt="Xpenser" 
            className="w-9 h-9 rounded-xl shadow-sm ring-2 ring-violet-500/25 shrink-0 object-cover" 
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                Install Xpenser App
              </h2>
              <span className="hidden xs:inline-flex items-center justify-center gap-1 text-[9px] font-bold leading-none text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200 shrink-0">
                <Sparkles size={9} className="text-amber-500" /> Fast
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-600 truncate">
              Add to Home Screen for 1-tap access & offline use
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onInstall}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[34px] bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs leading-none rounded-xl shadow-sm shadow-violet-500/25 active:scale-95 transition cursor-pointer whitespace-nowrap"
          >
            <Download size={13} />
            <span>Install</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss install banner"
            className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 inline-flex items-center justify-center transition active:scale-90 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppInstallBanner;

