import { useEffect, useState } from 'react';
import PWAInstallPrompt from './PWAInstallPrompt';

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registered:', registration.scope);
            
            // Check for updates periodically
            setInterval(() => {
              registration.update();
            }, 60000); // Check every minute
          })
          .catch((error) => {
            console.error('[PWA] Service Worker registration failed:', error);
          });
      });
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show install prompt after 30 seconds if not dismissed
      setTimeout(() => {
        const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen');
        if (!hasSeenPrompt) {
          setShowInstallPrompt(true);
        }
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      console.log('[PWA] Back online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('[PWA] Went offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial online status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log('[PWA] User choice:', outcome);
    
    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    } else {
      console.log('[PWA] User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-prompt-seen', 'true');
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-prompt-seen', 'true');
  };

  return (
    <>
      {children}
      
      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed bottom-0 left-0 right-0 bg-yellow-500 text-white px-4 py-3 text-center z-50 shadow-lg">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
            </svg>
            <span className="font-semibold">You are currently offline</span>
          </div>
        </div>
      )}

      {/* Install prompt */}
      {showInstallPrompt && (
        <PWAInstallPrompt
          onInstall={handleInstall}
          onDismiss={handleDismiss}
        />
      )}
    </>
  );
}
