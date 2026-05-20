
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
import { StorageService } from './services/storage';

interface AppContextType {
  showToast: (message: string, type?: Toast['type']) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  deferredPrompt: any;
  showInstallBanner: boolean;
  setShowInstallBanner: (show: boolean) => void;
  installApp: () => void;
}
const AppContext = createContext<AppContextType | null>(null);
export const useApp = () => useContext(AppContext)!;

const App: React.FC = () => {
  const [user, setUserState] = useState<User | null>(() => StorageService.getUser());

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    StorageService.saveUser(newUser);
  };

  const [activeTab, setActiveTab] = useState<'scan' | 'community' | 'inbox' | 'ai' | 'settings' | 'history'>('scan');
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [language, setLanguage] = useState<Language>(StorageService.getSettings().language);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await StorageService.syncData();
        setTimeout(() => setIsAppLoading(false), 2500);
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

  const handleRegister = (data: { name: string, phone: string, city: string, role: UserRole }) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
    };
    setUser(newUser);
    showToast(`Bienvenue ${data.name} !`, "success");
  };

  if (isAppLoading) return <LoadingScreen />;

  return (
    <AppContext.Provider value={{ showToast, language, setLanguage, deferredPrompt, showInstallBanner, setShowInstallBanner, installApp }}>
      <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative shadow-2xl border-x border-gray-200 overflow-hidden">
        
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
