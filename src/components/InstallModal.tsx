import React, { useState } from 'react';
import { X, Download, Share, PlusSquare, MoreVertical, Monitor, Smartphone, Check, Sparkles, ShieldCheck } from 'lucide-react';

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
  isInstallable: _isInstallable = false,
  onNativeInstall,
  isIOS = false,
  isAndroid = false,
}) => {
  const defaultTab = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'desktop'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100005] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-[28px] sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 overflow-hidden relative animate-slideUp sm:animate-scaleUp max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Subtle Pull Indicator on mobile */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 inline-flex items-center justify-center transition active:scale-90"
        >
          <X size={16} />
        </button>

        {/* App Identity Banner */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="relative mb-3">
            <img
              src="/favicon.svg"
              alt="Xpenser"
              className="w-16 h-16 rounded-2xl shadow-xl shadow-violet-500/20 ring-4 ring-violet-500/10 object-cover"
            />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white inline-flex items-center justify-center text-[10px] ring-2 ring-white font-bold shadow-xs">
              <Check size={13} strokeWidth={3} />
            </span>
          </div>

          <h2 className="text-xl font-black text-slate-900 tracking-tight inline-flex items-center justify-center gap-1.5">
            Install Xpenser
          </h2>
          <p className="text-xs text-slate-600 font-medium mt-1 max-w-xs">
            Add to your home screen for fast 1-tap launch, full-screen mobile view, and offline tracking.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-2.5">
            <span className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-200/80">
              <Sparkles size={11} className="text-amber-500" /> Web App (PWA)
            </span>
            <span className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
              <ShieldCheck size={11} className="text-emerald-600" /> Private & Secure
            </span>
          </div>
        </div>

        {/* 1-Tap Direct Install Button (Prominent) */}
        {onNativeInstall && (
          <div className="mb-5">
            <button
              type="button"
              onClick={() => {
                onNativeInstall();
                onClose();
              }}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-violet-300 active:scale-98 transition transform cursor-pointer"
            >
              <Download size={17} />
              <span>Install App on this Device</span>
            </button>
            <p className="text-[11px] text-center text-slate-600 mt-1.5 font-medium">
              Takes 2 seconds • Zero store downloads • Works offline
            </p>
          </div>
        )}

        {/* Platform Guide Tabs */}
        <div className="bg-slate-100 p-1 rounded-2xl mb-4 flex gap-1 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`flex-1 min-w-0 inline-flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 rounded-xl transition-all ${
              activeTab === 'ios' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone size={13} className="shrink-0" />
            <span className="truncate">iPhone / iPad</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`flex-1 min-w-0 inline-flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 rounded-xl transition-all ${
              activeTab === 'android' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone size={13} className="shrink-0" />
            <span className="truncate">Android</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 min-w-0 inline-flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-1.5 rounded-xl transition-all ${
              activeTab === 'desktop' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor size={13} className="shrink-0" />
            <span className="truncate">PC / Mac</span>
          </button>
        </div>

        {/* Tab 1: iOS Safari Guide */}
        {activeTab === 'ios' && (
          <div className="space-y-2.5 mb-5">
            <div className="flex items-start gap-3 p-3 bg-violet-50/60 rounded-2xl border border-violet-100">
              <div className="w-8 h-8 rounded-xl bg-violet-600 text-white inline-flex items-center justify-center shrink-0 font-black text-xs leading-none shadow-sm">
                1
              </div>
              <div className="text-xs min-w-0">
                <p className="font-bold text-slate-900">Tap the Share Button in Safari</p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Look at the bottom toolbar of Safari and tap the <span className="inline-flex items-center justify-center gap-1 font-bold text-blue-600 bg-white px-1.5 py-0.5 rounded-md border border-slate-200 shadow-2xs"><Share size={11} /> Share</span> icon.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-violet-50/60 rounded-2xl border border-violet-100">
              <div className="w-8 h-8 rounded-xl bg-violet-600 text-white inline-flex items-center justify-center shrink-0 font-black text-xs leading-none shadow-sm">
                2
              </div>
              <div className="text-xs min-w-0">
                <p className="font-bold text-slate-900">Select "Add to Home Screen"</p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Scroll down the menu list and tap <span className="inline-flex items-center justify-center gap-1 font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded-md border border-slate-200 shadow-2xs"><PlusSquare size={11} /> Add to Home Screen</span>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white inline-flex items-center justify-center shrink-0 font-black text-xs leading-none shadow-sm">
                3
              </div>
              <div className="text-xs min-w-0">
                <p className="font-bold text-slate-900">Tap "Add" in Top-Right Corner</p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Confirm by tapping <strong className="text-slate-900">Add</strong>. The official Xpenser RS icon will now appear on your iPhone screen like a native app!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Android Guide */}
        {activeTab === 'android' && (
          <div className="space-y-2.5 mb-5">
            <div className="flex items-start gap-3 p-3 bg-violet-50/60 rounded-2xl border border-violet-100">
              <div className="w-8 h-8 rounded-xl bg-violet-600 text-white inline-flex items-center justify-center shrink-0 font-black text-xs leading-none shadow-sm">
                1
              </div>
              <div className="text-xs min-w-0">
                <p className="font-bold text-slate-900">Open Chrome Menu</p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  In Chrome, tap the <span className="inline-flex items-center justify-center gap-1 font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded-md border border-slate-200 shadow-2xs"><MoreVertical size={11} /> 3 dots</span> at the top-right corner.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-violet-50/60 rounded-2xl border border-violet-100">
              <div className="w-8 h-8 rounded-xl bg-violet-600 text-white inline-flex items-center justify-center shrink-0 font-black text-xs leading-none shadow-sm">
                2
              </div>
              <div className="text-xs min-w-0">
                <p className="font-bold text-slate-900">Tap "Install app" or "Add to Home screen"</p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Select <strong className="text-slate-900">Install app</strong> (or <em>Add to Home screen</em>) from the menu list.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white inline-flex items-center justify-center shrink-0 font-black text-xs leading-none shadow-sm">
                3
              </div>
              <div className="text-xs min-w-0">
                <p className="font-bold text-slate-900">Confirm Installation</p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Tap <strong className="text-slate-900">Install</strong> on the confirmation prompt. The app will install directly to your phone drawer and home screen.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Desktop Guide */}
        {activeTab === 'desktop' && (
          <div className="space-y-2.5 mb-5">
            <div className="flex items-start gap-3 p-3 bg-violet-50/60 rounded-2xl border border-violet-100">
              <div className="w-8 h-8 rounded-xl bg-violet-600 text-white inline-flex items-center justify-center shrink-0 font-black text-xs leading-none shadow-sm">
                1
              </div>
              <div className="text-xs min-w-0">
                <p className="font-bold text-slate-900">Look for the Install Icon</p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  In Chrome or Edge, check the right side of the address bar for the <span className="inline-flex items-center justify-center font-bold text-violet-700 bg-white px-1.5 py-0.5 rounded-md border border-slate-200">Install ⊕</span> icon.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white inline-flex items-center justify-center shrink-0 font-black text-xs leading-none shadow-sm">
                2
              </div>
              <div className="text-xs min-w-0">
                <p className="font-bold text-slate-900">Click Install</p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Click the install icon or click the browser menu <strong className="text-slate-900">(⋮) → "Install Xpenser"</strong> to create a dedicated desktop app.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Done / Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[42px] py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 font-bold text-xs rounded-xl inline-flex items-center justify-center transition active:scale-95 cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
