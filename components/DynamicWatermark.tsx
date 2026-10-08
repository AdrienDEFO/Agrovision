import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../App';
import { WatermarkMode } from '../types';

interface DynamicWatermarkProps {
  mode?: WatermarkMode;
  onOpenPermissions?: () => void;
}

const DynamicWatermark: React.FC<DynamicWatermarkProps> = ({ 
  mode: initialMode = 'subtle',
  onOpenPermissions 
}) => {
  const { language, permissions } = useApp();
  const isFr = language === 'FR';

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [mode, setMode] = useState<WatermarkMode>(initialMode);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Génération d'une empreinte dynamique de session unique
  const sessionToken = useMemo(() => {
    return 'AAD-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-2026';
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString(isFr ? 'fr-FR' : 'en-US', { hour12: false }));
      setCurrentDate(now.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [isFr]);

  const geoBadge = useMemo(() => {
    if (permissions.geolocation === 'denied') {
      return {
        label: isFr ? "GPS : Non autorisé" : "GPS: Denied",
        color: "bg-rose-500/10 text-rose-600 border-rose-200",
        icon: "fa-ban"
      };
    }
    if (permissions.geolocation === 'in_use') {
      return {
        label: isFr ? "GPS : En utilisation" : "GPS: While in use",
        color: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
        icon: "fa-location-dot"
      };
    }
    if (permissions.geolocation === 'once') {
      return {
        label: isFr ? "GPS : Cette fois-ci" : "GPS: Once only",
        color: "bg-amber-500/10 text-amber-700 border-amber-200",
        icon: "fa-hourglass-half"
      };
    }
    return {
      label: isFr ? "GPS : Non défini" : "GPS: Undefined",
      color: "bg-slate-500/10 text-slate-600 border-slate-200",
      icon: "fa-question"
    };
  }, [permissions.geolocation, isFr]);

  return (
    <>
      {/* 1. FILIGRANE DIAGONAL DYNAMIQUE EN ARRIÈRE-PLAN (Sécurité Anti-capture) */}
      {(mode === 'full' || mode === 'subtle') && (
        <div 
          aria-hidden="true"
          className={`fixed inset-0 pointer-events-none select-none z-[5] overflow-hidden transition-opacity duration-500 ${
            mode === 'full' ? 'opacity-[0.055]' : 'opacity-[0.025]'
          }`}
        >
          <div className="absolute inset-0 flex flex-col justify-around rotate-[-25deg] scale-150 origin-center text-slate-950 font-black tracking-widest uppercase">
            {Array.from({ length: 14 }).map((_, i) => (
              <div 
                key={i} 
                className="whitespace-nowrap flex gap-12 text-[10px] md:text-xs animate-[pulse_6s_ease-in-out_infinite]"
                style={{ animationDelay: `${i * 350}ms` }}
              >
                <span>AGROVISION AI • RÉALISATEUR : ANGE ADRIEN DEFO</span>
                <span>•</span>
                <span>TOKEN #{sessionToken}</span>
                <span>•</span>
                <span>{currentDate} {currentTime}</span>
                <span>•</span>
                <span>{geoBadge.label}</span>
                <span>•</span>
                <span>AGROVISION AI • RÉALISATEUR : ANGE ADRIEN DEFO</span>
                <span>•</span>
                <span>PROPRIÉTÉ EXCLUSIVE</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. BADGE FLOTTANT DYNAMIQUE DE MARQUE (Compact, Élégant, Interactif) */}
      <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-sm w-[92%] transition-all">
        {!isMinimized ? (
          <div className="bg-slate-900/90 hover:bg-slate-900 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-xl border border-slate-700/60 flex items-center justify-between gap-2 text-[9px] font-black transition-all">
            
            {/* Clignotant vert d'enregistrement dynamique */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-amber-400 font-extrabold flex items-center gap-1">
                <i className="fa-solid fa-clapperboard text-[8.5px]"></i>
                <span className="truncate max-w-[110px] xs:max-w-none">Ange Adrien DEFO</span>
              </span>
            </div>

            {/* Horodatage direct */}
            <div className="flex items-center gap-2 font-mono text-[8.5px] text-slate-300">
              <span className="hidden sm:inline text-slate-400">|</span>
              <span className="text-emerald-300 font-bold">{currentTime || '--:--:--'}</span>
            </div>

            {/* Badge de statut GPS */}
            <div className="flex items-center gap-1">
              <span className={`text-[7.5px] px-1.5 py-0.5 rounded border ${geoBadge.color} bg-white/10 shrink-0 flex items-center gap-1`}>
                <i className={`fa-solid ${geoBadge.icon} text-[7px]`}></i>
                <span className="hidden xs:inline">{geoBadge.label}</span>
              </span>

              {/* Bouton pour ouvrir la fiche de filigrane */}
              <button
                onClick={() => setIsModalOpen(true)}
                title={isFr ? "Détails du filigrane dynamique" : "Dynamic watermark details"}
                className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 transition-colors ml-0.5 cursor-pointer"
              >
                <i className="fa-solid fa-shield-halved text-[8px]"></i>
              </button>

              {/* Bouton pour replier temporairement */}
              <button
                onClick={() => setIsMinimized(true)}
                title={isFr ? "Minimiser le badge" : "Minimize badge"}
                className="w-4 h-4 rounded-full text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-[8px]"></i>
              </button>
            </div>

          </div>
        ) : (
          /* Version miniature quand replié */
          <div className="flex justify-end">
            <button
              onClick={() => setIsMinimized(false)}
              className="bg-slate-900/90 backdrop-blur-md text-amber-400 hover:text-white px-2.5 py-1 rounded-full shadow-lg border border-slate-700/60 flex items-center gap-1.5 text-[8.5px] font-black cursor-pointer transition-all active:scale-95"
            >
              <i className="fa-solid fa-clapperboard text-[8px]"></i>
              <span>Ange Adrien DEFO</span>
              <span className="text-emerald-400 font-mono text-[7.5px]">● {currentTime}</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. MODALE DÉTAILLÉE : CERTIFICAT DU FILIGRANE DYNAMIQUE & GESTION */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <i className="fa-solid fa-fingerprint text-lg"></i>
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                    {isFr ? "Filigrane Dynamique Actif" : "Dynamic Watermark Engine"}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold">
                    {isFr ? "Signature & Protection Numérique" : "Digital Signature & Authenticity"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Carte d'Honneur Réalisateur */}
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-3.5 rounded-2xl shadow-md space-y-1">
              <div className="text-[8px] font-black tracking-widest uppercase opacity-90 flex items-center gap-1">
                <i className="fa-solid fa-clapperboard"></i>
                <span>{isFr ? "RÉALISATEUR OFFICIEL" : "OFFICIAL DIRECTOR"}</span>
              </div>
              <div className="text-base font-black tracking-tight">
                Ange Adrien DEFO
              </div>
              <div className="text-[9px] font-medium opacity-90">
                {isFr ? "Créateur & Architecte AgroVision AI" : "Creator & Lead AI Architect"}
              </div>
            </div>

            {/* Métadonnées dynamiques en temps réel */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 text-[9.5px]">
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-bold">{isFr ? "Horodatage dynamique :" : "Dynamic timestamp:"}</span>
                <span className="font-mono font-black text-emerald-700">{currentDate} • {currentTime}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-bold">{isFr ? "Jeton de session :" : "Session token:"}</span>
                <span className="font-mono text-slate-800 font-black">{sessionToken}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-bold">{isFr ? "Statut Géolocalisation :" : "GPS Privacy status:"}</span>
                <span className={`px-2 py-0.5 rounded text-[8.5px] font-black border ${geoBadge.color}`}>
                  {geoBadge.label}
                </span>
              </div>
            </div>

            {/* Réglage du mode de filigrane */}
            <div className="space-y-1.5">
              <label className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider">
                {isFr ? "Mode d'affichage du filigrane :" : "Watermark display mode:"}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setMode('subtle')}
                  className={`py-2 px-1 text-[8.5px] font-black rounded-xl border uppercase tracking-wider transition-all cursor-pointer ${
                    mode === 'subtle'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  {isFr ? "Discret" : "Subtle"}
                </button>
                <button
                  onClick={() => setMode('full')}
                  className={`py-2 px-1 text-[8.5px] font-black rounded-xl border uppercase tracking-wider transition-all cursor-pointer ${
                    mode === 'full'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
                  }`}
                >
                  {isFr ? "Visuel" : "Visible"}
                </button>
                <button
                  onClick={() => setMode('badge')}
                  className={`py-2 px-1 text-[8.5px] font-black rounded-xl border uppercase tracking-wider transition-all cursor-pointer ${
                    mode === 'badge'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {isFr ? "Badge seul" : "Badge only"}
                </button>
              </div>
            </div>

            {/* Raccourci vers les autorisations si demandé */}
            {onOpenPermissions && (
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  onOpenPermissions();
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <i className="fa-solid fa-shield-halved text-emerald-600"></i>
                <span>{isFr ? "Modifier les autorisations système" : "Adjust system permissions"}</span>
              </button>
            )}

            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              {isFr ? "Fermer" : "Close"}
            </button>

          </div>
        </div>
      )}
    </>
  );
};

export default DynamicWatermark;
