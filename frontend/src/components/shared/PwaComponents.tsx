import { useState, useEffect } from 'react';
import { WifiOff, RotateCcw, Share, Plus, Sparkles, Smartphone, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// ── 1. Network Status Indicator (Online/Offline) ────────────────────
export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-semibold select-none shadow-sm animate-pulse">
      <WifiOff className="w-3.5 h-3.5" />
      <span>Offline</span>
    </div>
  );
}

// ── 2. Full-width Offline Status Banner ──────────────────────────────
export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-red-600 text-white text-xs font-medium py-2 px-4 text-center flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>You are offline. Transaction submissions are disabled.</span>
    </div>
  );
}

// ── 3. Update Available Prompt (Service Worker Updates) ──────────────
export function UpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setUpdateAvailable(true);
    window.addEventListener('pwa-update-available', handleUpdate);
    return () => window.removeEventListener('pwa-update-available', handleUpdate);
  }, []);

  const handleUpdateNow = () => {
    // Send message to SW to skip waiting and activate immediately
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
    // Reload page
    window.location.reload();
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:max-w-sm bg-neutral-900 border border-neutral-800 text-white rounded-2xl p-4 shadow-xl z-50 flex flex-col gap-3 animate-[slideUp_200ms_ease]">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-sm">New Update Available</h4>
          <p className="text-xs text-neutral-400 mt-1">Get the latest performance improvements and features.</p>
        </div>
        <button onClick={() => setUpdateAvailable(false)} className="text-neutral-500 hover:text-white p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <button onClick={() => setUpdateAvailable(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
          Later
        </button>
        <button onClick={handleUpdateNow} className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-primary-600 text-white hover:bg-primary-500 flex items-center gap-1.5 transition-colors shadow-md">
          <RotateCcw className="w-3.5 h-3.5" />
          Update Now
        </button>
      </div>
    </div>
  );
}

// ── 4. PWA Installation Prompt (Android & iOS instructions) ───────────
export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if running in PWA standalone mode (already installed & running)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('pwa-prompt-dismissed-session');
    if (isDismissed) return;

    // Check iOS
    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    if (ios) {
      setIsIos(true);
    }

    // Android/Chrome beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    // Automatically trigger popup on link open (after 1 second)
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 1000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to PWA install: ${outcome}`);
      setDeferredPrompt(null);
    }
    setShowPrompt(false);
  };

  const handleOpenApp = () => {
    // Navigating to the current URL will trigger mobile OS interception to open in the app
    window.location.href = window.location.href;
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    // Store dismissal for current session to avoid repeating on page navigations
    sessionStorage.setItem('pwa-prompt-dismissed-session', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleDismiss} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 overflow-hidden animate-[fadeIn_200ms_ease] border border-neutral-100 flex flex-col items-center text-center">
        
        {/* Brand / App Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20 border border-white">
          <Smartphone className="w-8 h-8 text-white stroke-[2]" />
        </div>

        <h3 className="text-base font-bold text-neutral-950 flex items-center gap-1.5 justify-center">
          Build ERP Mobile App <Sparkles className="w-4.5 h-4.5 text-amber-500 fill-amber-500" />
        </h3>
        
        <p className="text-xs text-neutral-500 mt-2 leading-relaxed px-2">
          Open in full-screen mobile mode for faster access, real-time sync, and PDF statements.
        </p>

        {/* Action Buttons */}
        <div className="w-full mt-6 space-y-2">
          
          {/* Open in App Action */}
          <button
            onClick={handleOpenApp}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
          >
            Open in App
          </button>

          {/* Install Action or iOS Instructions */}
          {isIos ? (
            <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-100 text-left space-y-1.5">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">iPhone Installation:</p>
              <ol className="text-[11px] text-neutral-600 list-decimal list-inside space-y-0.5">
                <li>Tap Share <Share className="w-3.5 h-3.5 inline text-blue-500 mx-0.5" /> in Safari</li>
                <li>Select <span className="font-semibold">Add to Home Screen</span></li>
                <li>Tap <span className="font-bold text-primary-600">Add</span></li>
              </ol>
            </div>
          ) : (
            <button
              onClick={handleInstall}
              disabled={!deferredPrompt}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-neutral-50 border border-neutral-200 text-neutral-700 hover:bg-neutral-100 font-bold text-xs active:scale-95 transition-all disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-neutral-400" />
              Install PWA App
            </button>
          )}

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="w-full py-2.5 text-neutral-400 hover:text-neutral-600 font-semibold text-xs transition-colors"
          >
            Continue in Browser
          </button>
        </div>
      </div>
    </div>
  );
}
