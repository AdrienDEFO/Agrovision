
import React, { useState } from 'react';
import { User } from '../types';
import { useApp } from '../App';
import VoiceCommand from './VoiceCommand';
import { ApertureIcon } from './Logo';

interface LayoutProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, activeTab, setActiveTab, children }) => {
  const { language } = useApp();
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  const labels = {
    scan: language === 'FR' ? 'Scan' : 'Scan',
    social: language === 'FR' ? 'Social' : 'Social',
    climate: language === 'FR' ? 'Climat' : 'Climate',
    ia: language === 'FR' ? 'IA' : 'AI',
    settings: language === 'FR' ? 'Réglages' : 'Settings'
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-emerald-800 text-white p-4 shadow-md flex justify-between items-center z-10">
        <div className="flex items-center gap-1.5 select-none">
          <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center rotate-3 shadow-md hover:rotate-6 transition-all duration-300">
            <i className="fa-solid fa-leaf text-emerald-800 text-sm"></i>
          </div>
          <h1 className="font-black text-base tracking-tight flex items-center gap-0.5 pl-1">
            <span className="text-white">Agro</span>
            <span className="text-emerald-300 font-extrabold flex items-center">
              Visi
              <ApertureIcon size={14} className="text-emerald-300 mx-[0.5px] animate-[spin_10s_linear_infinite]" />
              n
            </span>
            <span className="bg-emerald-600 text-white font-extrabold px-1 py-0.2 rounded text-[50%] ml-1 uppercase">
              AI
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setIsVoiceOpen(true)}
            className="w-8 h-8 rounded-full bg-emerald-600/50 hover:bg-emerald-600 border border-emerald-500/30 flex items-center justify-center transition-all cursor-pointer active:scale-90"
            title={language === 'FR' ? "Commande vocale" : "Voice commands"}
          >
            <i className="fa-solid fa-microphone text-sm text-white"></i>
          </button>
          <img src={user.avatar} className="w-8 h-8 rounded-full border-2 border-emerald-400 bg-white" alt="Profile" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20 scroll-smooth">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-xl border-t border-gray-100 flex justify-around items-center py-3 px-1 safe-area-bottom z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <NavButton icon="fa-camera" label={labels.scan} active={activeTab === 'scan'} onClick={() => setActiveTab('scan')} />
        <NavButton icon="fa-cloud-sun-rain" label={labels.climate} active={activeTab === 'climate'} onClick={() => setActiveTab('climate')} />
        <NavButton icon="fa-users" label={labels.social} active={activeTab === 'community'} onClick={() => setActiveTab('community')} />
        <NavButton icon="fa-robot" label={labels.ia} active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
        <NavButton icon="fa-gear" label={labels.settings} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </nav>

      {/* Global Voice Command Drawer/Modal */}
      <VoiceCommand isOpen={isVoiceOpen} setIsOpen={setIsVoiceOpen} />
    </div>
  );
};

const NavButton: React.FC<{ icon: string, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 min-w-[56px] transition-all duration-300 active:scale-90 ${active ? 'text-emerald-600' : 'text-gray-400 opacity-70'}`}
  >
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-emerald-50' : 'bg-transparent'}`}>
       <i className={`fa-solid ${icon} ${active ? 'text-lg' : 'text-base'}`}></i>
    </div>
    <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);

export default Layout;
