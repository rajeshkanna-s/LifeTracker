import React, { useState } from 'react';
import { X, Download, Share, PlusSquare, MoreVertical, Monitor, Smartphone, Check, Sparkles } from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable?: boolean;
  onNativeInstall?: () => void;
  isIOS?: boolean;
  isAndroid?: boolean;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  isInstallable = false,
  onNativeInstall,
  isIOS = false,
  isAndroid = false,
}) => {
  const defaultTab = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'desktop'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 overflow-hidden relative animate-scaleUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition active:scale-90"
        >
          <X size={16} />
        </button>

        {/* Header with App Logo */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-2xl shadow-lg shadow-violet-200 shrink-0">
            📊
          </div>
          <div className="min-w-0 pr-6">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>Install MyLife Tracker</span>
              <Sparkles size={14} className="text-amber-500 shrink-0" />
            </h2>
            <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
              Get the native mobile app experience with 1-tap access and offline support
            </p>
          </div>
        </div>

        {/* Direct 1-tap install if native browser prompt is available */}
        {isInstallable && onNativeInstall && (
          <div className="mb-4 p-3 bg-violet-50 rounded-2xl border border-violet-100">
            <p className="text-xs font-bold text-violet-900 mb-2">Ready for 1-Tap Installation:</p>
            <button
              type="button"
              onClick={() => {
                onNativeInstall();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md shadow-violet-300 hover:opacity-95 active:scale-95 transition"
            >
              <Download size={15} />
              <span>Install App Now</span>
            </button>
          </div>
        )}

        {/* Platform Selector Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition ${
              activeTab === 'ios' ? 'bg-white text-violet-700 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <Smartphone size={13} />
            <span>iPhone / iOS</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition ${
              activeTab === 'android' ? 'bg-white text-violet-700 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <Smartphone size={13} />
            <span>Android</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition ${
              activeTab === 'desktop' ? 'bg-white text-violet-700 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <Monitor size={13} />
            <span>PC / Mac</span>
          </button>
        </div>

        {/* Tab 1: iOS Instructions */}
        {activeTab === 'ios' && (
          <div className="space-y-2.5 mb-5 text-slate-700">
            <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">
                1
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-900">Tap the Share button</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  In Safari, tap the <span className="inline-flex items-center gap-0.5 font-bold text-blue-600 bg-blue-50 px-1 py-0.2 rounded"><Share size={11} /> Share</span> button at the bottom of the screen.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">
                2
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-900">Add to Home Screen</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Scroll down the share sheet and tap <span className="inline-flex items-center gap-0.5 font-bold text-slate-800 bg-white border border-slate-200 px-1 py-0.2 rounded"><PlusSquare size={11} /> Add to Home Screen</span>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-xs">
                3
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-900">Tap Add</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tap <strong>Add</strong> in the top-right corner. The app icon will now appear on your iPhone screen!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Android Instructions */}
        {activeTab === 'android' && (
          <div className="space-y-2.5 mb-5 text-slate-700">
            <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 font-bold text-xs">
                1
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-900">Open Chrome Menu</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tap the <span className="inline-flex items-center gap-0.5 font-bold text-slate-800 bg-white border border-slate-200 px-1 py-0.2 rounded"><MoreVertical size={11} /> 3 dots</span> at the top-right of Chrome.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 font-bold text-xs">
                2
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-900">Tap "Install app" or "Add to Home screen"</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select <strong className="text-slate-800">Install app</strong> (or <em>Add to Home screen</em>) from the menu options.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-xs">
                3
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-900">Confirm Installation</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tap <strong>Install</strong>. The app will install directly to your app drawer and home screen.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Desktop Instructions */}
        {activeTab === 'desktop' && (
          <div className="space-y-2.5 mb-5 text-slate-700">
            <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold text-xs">
                1
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-900">Look at the Address Bar</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  In Chrome or Edge, look for the <span className="font-bold text-violet-700 bg-violet-50 px-1 py-0.2 rounded border border-violet-100">Install ⊕</span> icon on the right side of the URL bar.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold text-xs">
                2
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-900">Click Install</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Click the install icon or click menu <strong>(⋮) → "Install MyLife Tracker"</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition active:scale-95"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
