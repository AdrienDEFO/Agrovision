
import React, { useState, useEffect, createContext, useContext } from 'react';
import { User, UserRole, Toast, Language } from './types';
import Onboarding from './components/Onboarding';
import Layout from './components/Layout';
import PlantScanner from './components/PlantScanner';
import CommunityChat from './components/CommunityChat';
import Inbox from './components/Inbox';
import AIChat from './components/AIChat';
import Settings from './components/Settings';
import History from './components/History';
import LoadingScreen from './components/LoadingScreen';
import ClimateCrops from './components/ClimateCrops';
import PermissionsModal from './components/PermissionsModal';
import { StorageService } from './services/storage';
import { preloadAI } from './services/gemini';

interface AppContextType {
  showToast: (message: string, type?: Toast['type']) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  deferredPrompt: any;
  showInstallBanner: boolean;
  setShowInstallBanner: (show: boolean) => void;
  installApp: () => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  activeTab: 'scan' | 'community' | 'inbox' | 'ai' | 'settings' | 'history' | 'climate';
  setActiveTab: (tab: 'scan' | 'community' | 'inbox' | 'ai' | 'settings' | 'history' | 'climate') => void;
}
const AppContext = createContext<AppContextType | null>(null);
export const useApp = () => useContext(AppContext)!;

const App: React.FC = () => {
  const [user, setUserState] = useState<User | null>(() => StorageService.getUser());

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    StorageService.saveUser(newUser);
  };

  const [activeTab, setActiveTab] = useState<'scan' | 'community' | 'inbox' | 'ai' | 'settings' | 'history' | 'climate'>('scan');
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [hasCheckedPermissions, setHasCheckedPermissions] = useState<boolean>(() => {
    const saved = localStorage.getItem('agrovision_permanent_permissions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.camera === 'granted' && parsed.geolocation === 'granted' && parsed.microphone === 'granted') {
          return true;
        }
      } catch (e) {}
    }
    return false;
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [language, setLanguage] = useState<Language>(StorageService.getSettings().language);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isOffline, setIsOfflineState] = useState<boolean>(!navigator.onLine);

  const setIsOffline = (offline: boolean) => {
    setIsOfflineState(offline);
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOfflineState(false);
      showToast(language === 'FR' ? "Connexion Internet rétablie !" : "Internet connection restored!", "success");
    };
    const handleOffline = () => {
      setIsOfflineState(true);
      showToast(language === 'FR' ? "Mode Hors-ligne activé." : "Offline Mode activated.", "info");
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [language]);

  useEffect(() => {
    const init = async () => {
      try {
        preloadAI().catch(() => {});
        await StorageService.syncData();
        setTimeout(() => setIsAppLoading(false), 800);
      } catch (e) {
        showToast("Erreur de synchronisation base de données", "error");
        setIsAppLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      showToast(language === 'FR' ? "AgroVision AI installé avec succès !" : "AgroVision AI installed successfully!", "success");
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [language]);

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleRegister = (data: { id?: string, name: string, phone: string, city: string, role: UserRole, avatar?: string }) => {
    const newUser: User = {
      id: data.id || Math.random().toString(36).substr(2, 9),
      name: data.name,
      phone: data.phone,
      city: data.city,
      role: data.role,
      avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
    };
    setUser(newUser);
    showToast(
      language === 'FR' 
        ? `Bienvenue ${data.name} !` 
        : `Welcome ${data.name}!`, 
      "success"
    );
  };

  if (isAppLoading) {
    return (
      <LoadingScreen 
        onSkip={() => setIsAppLoading(false)}
        deferredPrompt={deferredPrompt}
        onInstall={installApp}
        language={language}
      />
    );
  }

  if (!hasCheckedPermissions) {
    return (
      <AppContext.Provider value={{ showToast, language, setLanguage, deferredPrompt, showInstallBanner, setShowInstallBanner, installApp, isOffline, setIsOffline, activeTab, setActiveTab }}>
        <div className="min-h-screen bg-slate-900 flex items-center justify-center relative max-w-md mx-auto">
          <PermissionsModal 
            onComplete={() => setHasCheckedPermissions(true)}
            language={language}
          />
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xs space-y-2 px-4 pointer-events-none">
            {toasts.map(toast => (
              <div key={toast.id} className={`pointer-events-auto p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 border backdrop-blur-md ${
                toast.type === 'error' ? 'bg-red-500/90 text-white border-red-400' : 
                toast.type === 'success' ? 'bg-emerald-600/90 text-white border-emerald-400' : 
                'bg-white/90 text-gray-800 border-gray-200'
              }`}>
                <i className={`fa-solid ${toast.type === 'error' ? 'fa-circle-exclamation' : toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-info'}`}></i>
                <p className="text-xs font-bold leading-tight">{toast.message}</p>
              </div>
            ))}
          </div>
        </div>
      </AppContext.Provider>
    );
  }

  return (
    <AppContext.Provider value={{ showToast, language, setLanguage, deferredPrompt, showInstallBanner, setShowInstallBanner, installApp, isOffline, setIsOffline, activeTab, setActiveTab }}>
      <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative shadow-2xl border-x border-gray-200 overflow-hidden">
        
        {isOffline && (
          <div className="bg-amber-500 text-white text-[10px] uppercase tracking-widest font-black py-2 px-4 flex items-center justify-between animate-in slide-in-from-top duration-300 z-50">
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-plane-slash animate-bounce"></i>
              {language === 'FR' ? "Mode Hors-ligne Actif" : "Offline Mode Active"}
            </span>
            <span className="bg-amber-600 px-2 py-0.5 rounded-full text-[8px] font-black">
              {language === 'FR' ? "SYNCHRONISATION SUSPENDUE" : "LOCAL BACKUP"}
            </span>
          </div>
        )}

        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xs space-y-2 px-4 pointer-events-none">
          {toasts.map(toast => (
            <div key={toast.id} className={`pointer-events-auto p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 border backdrop-blur-md ${
              toast.type === 'error' ? 'bg-red-500/90 text-white border-red-400' : 
              toast.type === 'success' ? 'bg-emerald-600/90 text-white border-emerald-400' : 
              'bg-white/90 text-gray-800 border-gray-200'
            }`}>
              <i className={`fa-solid ${toast.type === 'error' ? 'fa-circle-exclamation' : toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-info'}`}></i>
              <p className="text-xs font-bold leading-tight">{toast.message}</p>
            </div>
          ))}
        </div>

        {!user ? (
          <Onboarding onComplete={handleRegister} />
        ) : (
          <Layout user={user} activeTab={activeTab} setActiveTab={setActiveTab}>
            {activeTab === 'scan' && <PlantScanner />}
            {activeTab === 'climate' && <ClimateCrops />}
            {activeTab === 'community' && <CommunityChat user={user} />}
            {activeTab === 'inbox' && <Inbox user={user} />}
            {activeTab === 'ai' && <AIChat user={user} />}
            {activeTab === 'history' && <History />}
            {activeTab === 'settings' && <Settings user={user} setUser={setUser} />}
          </Layout>
        )}
      </div>
    </AppContext.Provider>
  );
};

export default App;
