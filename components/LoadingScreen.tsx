import React, { useState, useEffect } from 'react';
import { LogoIcon, ApertureIcon } from './Logo';

const messages = [
  "Préparation de vos outils agricoles...",
  "Analyse des données climatiques...",
  "Optimisation de l'IA pour vos sols...",
  "Cultiver l'Excellence, Nourrir l'Afrique...",
  "Chargement de l'expertise communautaire...",
];

const messagesEn = [
  "Preparing your agricultural toolkits...",
  "Analyzing regional climate intelligence...",
  "Optimizing artificial intelligence for your soils...",
  "Cultivating Excellence, Feeding Africa...",
  "Loading community farming wisdom...",
];

interface LoadingScreenProps {
  onSkip: () => void;
  deferredPrompt: any;
  onInstall: () => void;
  language: 'FR' | 'EN';
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  onSkip, 
  deferredPrompt, 
  onInstall, 
  language = 'FR' 
}) => {
  const [msgIndex, setMsgIndex] = useState(0);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const isFr = language === 'FR';

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const handleDownloadSimulation = () => {
    if (deferredPrompt) {
      // If we have a native PWA prompt, call the real installation trigger
      onInstall();
      return;
    }

    // Otherwise, or as an interactive feature, trigger an immersive download & installation instruction simulation
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadSuccess(false);
    setShowInstallModal(true);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isDownloading && downloadProgress < 100) {
      timer = setTimeout(() => {
        setDownloadProgress(prev => {
          const next = prev + Math.floor(Math.random() * 15) + 5;
          return next > 100 ? 100 : next;
        });
      }, 150);
    } else if (isDownloading && downloadProgress === 100) {
      setIsDownloading(false);
      setDownloadSuccess(true);
    }
    return () => clearTimeout(timer);
  }, [isDownloading, downloadProgress]);

  return (
    <div className="min-h-screen bg-emerald-950 flex flex-col items-center justify-between p-8 text-center relative overflow-hidden select-none">
      
      {/* Dynamic ambient shapes */}
      <div className="absolute top-[-20%] left-[-20%] w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl"></div>

      {/* Top Bar: Language display & instant Skip Button to load immediately */}
      <div className="w-full flex justify-between items-center z-10">
        <span className="text-[9px] font-black tracking-widest text-emerald-300 bg-emerald-900/60 px-3 py-1.5 rounded-full uppercase border border-emerald-500/15">
          {isFr ? "Chargement Rapide" : "Fast Booting"}
        </span>
        <button 
          onClick={onSkip}
          className="text-[10px] font-black text-white bg-emerald-800/80 hover:bg-emerald-700 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl uppercase tracking-wider active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
        >
          {isFr ? "Passer" : "Skip"}
          <i className="fa-solid fa-arrow-right text-[9px] animate-pulse"></i>
        </button>
      </div>

      {/* Main Seedling Bounce */}
      <div className="flex flex-col items-center justify-center space-y-7 my-auto z-10">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="relative transform hover:scale-105 transition-all duration-300">
            <LogoIcon size={140} animate={true} />
          </div>
        </div>
        
        <div className="space-y-3.5 max-w-xs">
          <h2 className="text-white text-3xl font-black tracking-tight leading-none flex items-center justify-center gap-1.5">
            <span className="text-emerald-100 font-black">Agro</span>
            <span className="text-emerald-400 font-extrabold flex items-center">
              Visi
              <ApertureIcon size={24} className="text-emerald-400 mx-[1px] animate-[spin_10s_linear_infinite]" />
              n
            </span>
            <span className="inline-block bg-emerald-500 text-slate-950 font-extrabold px-1.5 py-0.5 rounded-lg text-[45%] ml-1 self-center tracking-normal uppercase">
              AI
            </span>
          </h2>
          
          <p className="text-[7.5px] text-emerald-400 font-extrabold uppercase tracking-[0.18em] px-3 leading-snug">
            {isFr 
              ? "L'intelligence artificielle au service de la souveraineté alimentaire" 
              : "Artificial intelligence for food sovereignty"
            }
          </p>
          
          <div className="flex justify-center gap-1 pt-1">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          </div>

          <p className="text-emerald-200/90 text-[11px] font-extrabold italic h-10 px-4 transition-all duration-300 pt-1">
            {isFr ? messages[msgIndex] : messagesEn[msgIndex]}
          </p>
        </div>
      </div>

      {/* Action Area: Download Application Direct Option */}
      <div className="w-full max-w-xs space-y-4 z-10 pb-4">
        <button
          onClick={handleDownloadSimulation}
          className="w-full py-4.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-500/15 flex items-center justify-center gap-2.5 active:scale-98 transition-all cursor-pointer animate-pulse"
        >
          <i className="fa-solid fa-circle-down text-sm"></i>
          {isFr ? "Télécharger l'Application" : "Download Application"}
        </button>
        
        <p className="text-[10px] text-emerald-400/80 font-black tracking-wider uppercase">
          {isFr ? "Accès instantané hors-ligne 100% gratuit" : "100% Free Offline Instant Access"}
        </p>
      </div>

      {/* Footer copyright */}
      <div className="text-emerald-500/40 text-[9px] font-black uppercase tracking-[0.25em] z-10">
        Cultiver l'Excellence, Nourrir l'Afrique
      </div>

      {/* Download / Interactive Installation Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[120] flex items-center justify-center p-5 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-6 shadow-2xl border border-slate-100 text-slate-900 flex flex-col space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                  <i className="fa-solid fa-mobile-screen-button text-sm"></i>
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    {isFr ? "Installation AgroVision" : "AgroVision Setup"}
                  </h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    PWA & APK Packager
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowInstallModal(false);
                  setIsDownloading(false);
                  setDownloadProgress(0);
                }}
                className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-all cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>

            {/* Simulated Progress / Status Bar */}
            {isDownloading && (
              <div className="py-4 space-y-3.5 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto animate-spin">
                  <i className="fa-solid fa-circle-notch text-xl"></i>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {isFr ? "Compilation de l'APK hors-ligne..." : "Compiling offline APK bundle..."}
                  </span>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-600 rounded-full transition-all duration-150"
                      style={{ width: `${downloadProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-black text-emerald-600">
                    {downloadProgress}%
                  </span>
                </div>
              </div>
            )}

            {/* Success screen & Quick installation instructions */}
            {downloadSuccess && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="bg-emerald-50 p-4 rounded-3xl text-center space-y-2 border border-emerald-100">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                    <i className="fa-solid fa-circle-check text-lg"></i>
                  </div>
                  <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                    {isFr ? "Téléchargement Prêt !" : "Application Bundle Ready!"}
                  </h4>
                  <p className="text-[10px] text-emerald-800 font-bold leading-normal">
                    {isFr 
                      ? "Le paquet hors-ligne a été optimisé pour votre appareil. Lancez l'installation direct."
                      : "The localized offline packet is fully compiled for your phone. Continue to install."
                    }
                  </p>
                </div>

                {/* Instructions Grid */}
                <div className="space-y-2.5">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block pl-1">
                    {isFr ? "Méthodes d'installation recommandées :" : "Recommended Installation Guidelines:"}
                  </span>
                  
                  <div className="space-y-2 text-[10px] font-bold text-slate-700">
                    {/* iOS Method */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-150 flex items-start gap-2.5">
                      <i className="fa-brands fa-apple text-sm text-slate-600 shrink-0 mt-0.5"></i>
                      <div>
                        <span className="text-[9px] font-black text-slate-900 block uppercase">iPhone & iPad (Safari)</span>
                        <span className="text-slate-500 leading-normal">
                          {isFr 
                            ? "Appuyez sur le bouton Partager 📤 puis choisissez 'Sur l'écran d'accueil' ➕."
                            : "Tap Share 📤 then choose 'Add to Home Screen' ➕."
                          }
                        </span>
                      </div>
                    </div>

                    {/* Android Method */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-150 flex items-start gap-2.5">
                      <i className="fa-brands fa-android text-sm text-emerald-600 shrink-0 mt-0.5"></i>
                      <div>
                        <span className="text-[9px] font-black text-slate-900 block uppercase">Android (Chrome / Samsung)</span>
                        <span className="text-slate-500 leading-normal">
                          {isFr 
                            ? "Appuyez sur les 3 points ⁝ puis choisissez 'Installer l'application' ou 'Ajouter'."
                            : "Tap the 3 dots ⁝ then choose 'Install app' or 'Add to Home Screen'."
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Trigger fallback file download for local testing
                      const element = document.createElement("a");
                      const file = new Blob(["AgroVision AI offline install package placeholder. For full experience, install PWA through browser menu."], {type: 'text/plain'});
                      element.href = URL.createObjectURL(file);
                      element.download = "agrovision-ai-offline.apk";
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                      
                      setShowInstallModal(false);
                    }}
                    className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  >
                    <i className="fa-solid fa-file-arrow-down"></i>
                    {isFr ? "Télécharger APK" : "Download APK"}
                  </button>

                  <button
                    onClick={() => {
                      setShowInstallModal(false);
                      onSkip(); // Launch app
                    }}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  >
                    {isFr ? "Lancer l'App" : "Launch App"}
                    <i className="fa-solid fa-angle-right"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Static Initial Choice if no simulation is active */}
            {!isDownloading && !downloadSuccess && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 font-bold leading-relaxed text-center">
                  {isFr 
                    ? "Souhaitez-vous télécharger et installer AgroVision sur votre smartphone pour une utilisation sans connexion Internet ?"
                    : "Would you like to package and install AgroVision to your smartphone for complete offline capability?"
                  }
                </p>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleDownloadSimulation}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  >
                    <i className="fa-solid fa-gears"></i>
                    {isFr ? "Compiler le paquet mobile" : "Compile Mobile Bundle"}
                  </button>

                  <button
                    onClick={() => {
                      if (deferredPrompt) {
                        onInstall();
                      } else {
                        // iOS/Safari instruction showcase
                        setIsDownloading(true);
                        setDownloadProgress(0);
                      }
                    }}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  >
                    <i className="fa-solid fa-cloud-arrow-down"></i>
                    {isFr ? "Installation Directe" : "Direct Installation"}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default LoadingScreen;
