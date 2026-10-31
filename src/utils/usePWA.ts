import { useEffect, useState } from 'react';

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    // Check if app is already launched in standalone mode (installed PWA)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
    }

    // Detect device type
    const ua = navigator.userAgent || '';
    const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const android = /Android/.test(ua);
    setIsIOS(iOS);
    setIsAndroid(android);

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome from automatically showing prompt
      e.preventDefault();
      // Stash event for manual triggering
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log('PWA was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        setDeferredPrompt(null);
        setIsInstallable(false);
        return outcome === 'accepted';
      } catch (err) {
        console.error('Install prompt error:', err);
      }
    }
    // If native prompt is not available, open the guide modal
    setShowInstallModal(true);
    return false;
  };

  const triggerInstall = () => {
    if (deferredPrompt) {
      install();
    } else {
      setShowInstallModal(true);
    }
  };

  return { 
    isInstallable, 
    isInstalled, 
    isIOS, 
    isAndroid, 
    install, 
    triggerInstall, 
    showInstallModal, 
    setShowInstallModal 
  };
};

