
import React, { useState, useRef, useEffect } from 'react';
import { identifyPlant } from '../services/gemini';
import { PlantResult, WeatherData, DraftItem } from '../types';
import { useApp } from '../App';
import { StorageService } from '../services/storage';

const MAX_SIZE_MB = 10;

const PlantScanner: React.FC = () => {
  const { showToast, language, showInstallBanner, setShowInstallBanner, installApp } = useApp();
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<PlantResult | null>(null);
  const [weather, setWeather] = useState<WeatherData | undefined>();
  const [coords, setCoords] = useState<{lat: number, lng: number} | undefined>();

  // États pour la robustesse hors-ligne (brouillons + turbulence réseau)
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [rawBase64, setRawBase64] = useState<string | null>(null);
  const [showOfflineRetryOptions, setShowOfflineRetryOptions] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const getWeatherCondition = (code: number): string => {
    if (code === 0) return "Ciel dégagé";
    if (code <= 3) return "Partiellement nuageux";
    if (code >= 51 && code <= 67) return "Pluie / Bruine";
    if (code >= 71 && code <= 86) return "Neige / Grêle";
    if (code >= 95) return "Orageux";
    return "Variable";
  };

  useEffect(() => {
    // Charger la liste initiale des brouillons
    setDrafts(StorageService.getDrafts());

    const handleOnline = () => {
      setOnlineStatus(true);
      showToast(language === 'FR' ? "Signal rétabli ! Vous pouvez synchroniser vos brouillons." : "Signal restored! You can now sync your drafts.", "success");
    };

    const handleOffline = () => {
      setOnlineStatus(false);
      showToast(language === 'FR' ? "Turbulences réseau : mode hors-ligne activé." : "Network turbulence: offline mode active.", "info");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });

        try {
          const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code`);
          const data = await response.json();
          
          if (data.current) {
            setWeather({
              temp: Math.round(data.current.temperature_2m),
              humidity: data.current.relative_humidity_2m,
              condition: getWeatherCondition(data.current.weather_code),
              locationName: 'Position Actuelle'
            });
          }
        } catch (err) {
          console.error("Erreur météo:", err);
        }
      }, (err) => {
        showToast("Géolocalisation refusée. Le diagnostic sera moins précis.", "info");
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [language]);

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % 5);
    }, 700);
    return () => clearInterval(interval);
  }, [loading]);

  const compressImage = (file: File, maxWidth: number = 1000, quality: number = 0.8): Promise<{ base64: string, dataUrl: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              base64: (event.target?.result as string).split(',')[1],
              dataUrl: event.target?.result as string
            });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const base64 = dataUrl.split(',')[1];
          resolve({ base64, dataUrl });
        };
        img.onerror = () => {
          resolve({
            base64: (event.target?.result as string).split(',')[1],
            dataUrl: event.target?.result as string
          });
        };
      };
      reader.onerror = () => {
        reject(new Error("Erreur lors de la lecture du fichier"));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      try {
        const { base64, dataUrl } = await compressImage(file);
        setImage(dataUrl);
        setRawBase64(base64);
        await processImage(base64, dataUrl);
      } catch (err) {
        console.error("Compression error:", err);
        showToast("Erreur lors du traitement de l'image.", "error");
        setLoading(false);
      }
    }
  };

  const processImage = async (base64: string, fullDataUrl: string) => {
    setLoading(true);
    setResult(null);
    setShowOfflineRetryOptions(false);

    // Si on est déconnecté, proposer directement la sauvegarde hors-ligne
    if (!navigator.onLine) {
      setLoading(false);
      setShowOfflineRetryOptions(true);
      showToast(language === 'FR' 
        ? "Zone de turbulence réseau détectée. Enregistrez en brouillon." 
        : "Network turbulence zone detected. Please save as draft.", "info");
      return;
    }

    try {
      const res = await identifyPlant(base64, weather, coords);
      if (res) {
        setResult(res);
        // Sauvegarde dans l'historique
        StorageService.addToHistory({
          ...res,
          image: fullDataUrl
        });
        showToast("Diagnostic expert terminé et enregistré !", "success");
      }
    } catch (err: any) {
      console.error("Analysis Exception:", err);
      setShowOfflineRetryOptions(true);
      const msg = err?.message || String(err);
      
      if (msg.includes("clé API") || msg.includes("API key") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("Quota")) {
        showToast(language === 'FR' 
          ? "Quota atteint ou clé API manquante. Ajoutez une clé de rechange dans l'onglet Paramètres." 
          : "Quota reached or API key missing. Add backup keys in Settings.", "error");
      } else {
        showToast(language === 'FR'
          ? "L'identification a échoué. Vous pouvez enregistrer ce scan en brouillon pour le relancer plus tard."
          : "Identification failed. You can save this capture as dry draft and sync it later.", "warning");
      }
    } finally {
      setLoading(false);
    }
  };

  const saveAsDraft = () => {
    if (!image) return;
    StorageService.addDraft({
      image: image,
      weather: weather,
      coords: coords
    });
    setDrafts(StorageService.getDrafts());
    showToast(language === 'FR' ? "Scan enregistré dans vos brouillons hors-ligne !" : "Scan saved to your offline drafts!", "success");
    setImage(null);
    setRawBase64(null);
    setShowOfflineRetryOptions(false);
  };

  const syncSingleDraft = async (draft: DraftItem) => {
    if (!navigator.onLine) {
      showToast(language === 'FR' ? "Toujours aucun signal réseau..." : "Still no network signal...", "error");
      return;
    }
    setIsSyncing(true);
    try {
      const base64 = draft.image.split(',')[1];
      const res = await identifyPlant(base64, draft.weather, draft.coords);
      if (res) {
        StorageService.addToHistory({
          ...res,
          image: draft.image
        });
        StorageService.deleteDraft(draft.id);
        setDrafts(StorageService.getDrafts());
        showToast(language === 'FR' ? `Fiche "${res.commonName}" synchronisée !` : `Sheet "${res.commonName}" synced!`, "success");
      }
    } catch (error) {
      showToast(language === 'FR' ? "La connexion est encore trop faible." : "Network signal still too weak.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const syncAllDrafts = async () => {
    if (!navigator.onLine) {
      showToast(language === 'FR' ? "Connexion requise pour tout synchroniser !" : "Signal required to sync all drafts!", "error");
      return;
    }
    setIsSyncing(true);
    let successCount = 0;
    showToast(language === 'FR' ? "Synchronisation en cours..." : "Sync active...", "info");

    for (const draft of [...drafts]) {
      try {
        const base64 = draft.image.split(',')[1];
        const res = await identifyPlant(base64, draft.weather, draft.coords);
        if (res) {
          StorageService.addToHistory({
            ...res,
            image: draft.image
          });
          StorageService.deleteDraft(draft.id);
          successCount++;
        }
      } catch (e) {
        console.error("Draft sync error:", draft.id, e);
      }
    }

    setDrafts(StorageService.getDrafts());
    setIsSyncing(false);

    if (successCount > 0) {
      showToast(language === 'FR' 
        ? `${successCount} diagnostics synchronisés avec succès !` 
        : `${successCount} diagnostics synced successfully!`, "success");
    } else {
      showToast(language === 'FR' 
        ? "Certains brouillons n'ont pas pu être synchronisés. Signal réseau insuffisant." 
        : "Drafts sync failed. Network signal too weak.", "error");
    }
  };

  return (
    <div className="p-4 space-y-6 pb-28 text-slate-800">
      {/* Proposition d'installation PWA */}
      {showInstallBanner && (
        <div className="bg-emerald-900 text-white p-5 rounded-[2rem] shadow-xl flex items-center justify-between border border-emerald-850 animate-in slide-in-from-top duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex items-center gap-4 max-w-[70%]">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
               <i className="fa-solid fa-mobile-screen-button text-xl text-emerald-300"></i>
            </div>
            <div>
              <p className="text-[9px] font-black text-emerald-200 uppercase tracking-widest">{language === 'FR' ? "PROPOSÉ" : "MOBILE APP"}</p>
              <h3 className="text-sm font-black tracking-tight mt-0.5 leading-snug">
                {language === 'FR' ? "Installer l'application hors-ligne ?" : "Install offline application?"}
              </h3>
              <p className="text-[10px] text-emerald-100 leading-tight font-medium mt-1">
                {language === 'FR' ? "Accès instantané même sans signal hertzien." : "Instant loading, even with no network signal."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 z-10">
            <button 
              onClick={installApp} 
              className="bg-white hover:bg-emerald-50 text-emerald-900 border border-white text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-xl active:scale-95 transition-transform shrink-0"
            >
              {language === 'FR' ? "Installer" : "Install"}
            </button>
            <button 
              onClick={() => setShowInstallBanner(false)} 
              className="bg-emerald-800/50 hover:bg-emerald-800 text-white w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors"
            >
              <i className="fa-solid fa-xmark text-xs"></i>
            </button>
          </div>
        </div>
      )}

      {/* Alerte Turbulence Réseau / Mode Hors-ligne */}
      {!onlineStatus && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 px-5 py-4 rounded-[2rem] flex items-center justify-between text-xs font-black uppercase tracking-wider animate-pulse shadow-sm">
          <span className="flex items-center gap-2">
            <i className="fa-solid fa-cloud-bolt text-sm"></i>
            {language === 'FR' ? "Turbulence Réseau active (Hors-ligne)" : "Network Turbulence active (Offline)"}
          </span>
          <span className="bg-amber-600 text-white px-2 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase shrink-0">
            {language === 'FR' ? 'SOLO' : 'SOLO'}
          </span>
        </div>
      )}

      {!image ? (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="flex flex-col items-center justify-center h-[30rem] bg-white rounded-[3rem] border-4 border-dashed border-emerald-50 shadow-2xl p-8 text-center relative overflow-hidden group">
             <div className="w-28 h-28 bg-emerald-600 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-emerald-200">
                <i className="fa-solid fa-expand text-4xl text-white"></i>
             </div>
             <h2 className="text-3xl font-black text-gray-900 tracking-tight">Scanner Expert</h2>
             <p className="text-gray-500 mt-4 text-sm leading-relaxed max-w-[240px]">
               Analyse par image enrichie par votre climat et géolocalisation actuelle.
             </p>

             <div className="mt-12 w-full space-y-3">
                <button onClick={() => cameraInputRef.current?.click()} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black shadow-lg active:scale-95 transition-transform">PRENDRE PHOTO</button>
                <button onClick={() => fileInputRef.current?.click()} className="w-full bg-slate-100 text-slate-700 py-5 rounded-2xl font-black border border-slate-200 active:scale-95 transition-transform">IMPORTER (MAX 10Mo)</button>
             </div>

             <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} className="hidden" onChange={handleFileChange} />
             <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
          </div>

          {weather && (
            <div className="bg-blue-50 p-5 rounded-[2rem] flex items-center justify-between border border-blue-100 shadow-sm animate-in slide-in-from-bottom duration-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-500">
                   <i className="fa-solid fa-cloud-sun-rain text-xl"></i>
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Météo Locale Connectée</p>
                  <p className="text-sm font-black text-blue-900">{weather.temp}°C • {weather.condition}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter">Humidité</p>
                <p className="text-xs font-black text-blue-600">{weather.humidity}%</p>
              </div>
            </div>
          )}

          {/* Slider des Brouillons Hors-ligne */}
          {drafts.length > 0 && (
            <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-6 space-y-4 shadow-inner">
              <div className="flex justify-between items-center gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <i className="fa-solid fa-box-archive text-amber-500 text-sm"></i>
                    {language === 'FR' ? "Brouillons capturés" : "Captured Drafts"}
                    <span className="bg-amber-500 text-white text-[10px] w-5 h-5 rounded-full inline-flex items-center justify-center font-black">
                      {drafts.length}
                    </span>
                  </h3>
                  <p className="text-[10px] text-gray-400 leading-tight font-semibold mt-0.5">
                    {language === 'FR' 
                      ? "Vos captures d'herbiers en attente de réseau." 
                      : "Crop records waiting for network connection."
                    }
                  </p>
                </div>
                {onlineStatus && (
                  <button 
                    onClick={syncAllDrafts} 
                    disabled={isSyncing}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-emerald-100 shrink-0"
                  >
                    {isSyncing ? (
                      <i className="fa-solid fa-sync animate-spin text-[9px]"></i>
                    ) : (
                      <i className="fa-solid fa-cloud-arrow-up text-[9px]"></i>
                    )}
                    {language === 'FR' ? "Envoyer tout" : "Sync All"}
                  </button>
                )}
              </div>

              <div className="flex gap-3 overflow-x-auto pb-1.5 pr-2 scrollbar-none scroll-smooth">
                {drafts.map((draft, idx) => (
                  <div key={draft.id || idx} className="w-24 bg-white border border-slate-100 rounded-3xl p-2 shrink-0 flex flex-col items-center space-y-2 relative shadow-sm group hover:border-emerald-200 transition-colors">
                    <div className="w-20 h-16 rounded-2xl overflow-hidden bg-slate-100 relative">
                      <img src={draft.image} className="w-full h-full object-cover" alt="Draft" />
                    </div>
                    <div className="flex gap-1.5 w-full">
                      <button 
                        onClick={() => {
                          StorageService.deleteDraft(draft.id);
                          setDrafts(StorageService.getDrafts());
                          showToast(language === 'FR' ? "Brouillon retiré" : "Draft removed", "info");
                        }}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-500 h-8 rounded-xl flex items-center justify-center transition-colors border border-red-100 active:scale-90"
                        title={language === 'FR' ? "Supprimer" : "Delete"}
                      >
                        <i className="fa-solid fa-trash-can text-[10px]"></i>
                      </button>
                      {onlineStatus && (
                        <button 
                          onClick={() => syncSingleDraft(draft)}
                          disabled={isSyncing}
                          className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 h-8 rounded-xl flex items-center justify-center transition-all border border-emerald-100 active:scale-90"
                          title={language === 'FR' ? "Synchroniser" : "Sync"}
                        >
                          <i className="fa-solid fa-rotate text-[10px]"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
          <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white group">
            <img src={image} className="w-full h-80 object-cover" alt="Scan" />
            {loading && (
              <div className="absolute inset-0 bg-emerald-900/85 backdrop-blur-sm flex flex-col items-center justify-center text-white p-8">
                <div className="w-16 h-16 border-4 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin mb-6"></div>
                <h3 className="text-sm font-black uppercase tracking-widest italic text-center min-h-[1.5rem]">
                  {loadingStep === 0 && (language === 'FR' ? "📡 Capture du Spectre..." : "📡 Spectral Capture...")}
                  {loadingStep === 1 && (language === 'FR' ? "🔬 Analyse des Pigments..." : "🔬 Pigment Analysis...")}
                  {loadingStep === 2 && (language === 'FR' ? "🌍 Corrélation Géo-Climatique..." : "🌍 Geo-Climatology Match...")}
                  {loadingStep === 3 && (language === 'FR' ? "🧠 Consultation Experts IA..." : "🧠 Querying AI Experts...")}
                  {loadingStep === 4 && (language === 'FR' ? "📝 Rédaction du Diagnostic..." : "📝 Final Diagnostic Report...")}
                </h3>
                <p className="text-[9px] text-emerald-300 font-black uppercase tracking-widest mt-2 animate-pulse">
                  {language === 'FR' ? "Analyse accélérée active ⚡" : "Accelerated analysis active ⚡"}
                </p>
                <div className="flex gap-2 mt-6">
                   <div className="px-3 py-1 bg-white/10 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                     <i className="fa-solid fa-circle-check text-emerald-400"></i> Géo-Localisation
                   </div>
                   <div className="px-3 py-1 bg-white/10 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                     <i className="fa-solid fa-circle-check text-emerald-400"></i> Climat Actuel
                   </div>
                </div>
              </div>
            )}
            {!loading && <button onClick={() => {setImage(null); setResult(null); setShowOfflineRetryOptions(false);}} className="absolute top-4 right-4 bg-white/90 text-red-500 p-3 rounded-2xl shadow-xl active:scale-90 transition-transform"><i className="fa-solid fa-xmark text-xl"></i></button>}
          </div>

          {/* Options de Secours / Brouillon en cas de Turbulence réseau ou Hors-ligne */}
          {showOfflineRetryOptions && !result && (
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl space-y-5 animate-in slide-in-from-bottom duration-300">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-100 shrink-0">
                  <i className="fa-solid fa-triangle-exclamation text-xl"></i>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {language === 'FR' ? "Turbulence ou Absence de Réseau" : "Network Turbulence or Offline"}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5 leading-snug">
                    {language === 'FR' 
                      ? "L'IA ne peut pas analyser ce plant sans connexion internet. Sauvegardez-le pour l'analyser plus tard !" 
                      : "AI cannot analyse this crop offline. Save it to process once signal is restored!"
                    }
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={saveAsDraft}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 px-1 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-100 active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-box-archive text-sm"></i>
                  {language === 'FR' ? "Garder en Brouillon" : "Keep as Offline Draft"}
                </button>
                
                {onlineStatus && (
                  <button 
                    onClick={() => {
                      if (rawBase64) processImage(rawBase64, image!);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 active:scale-95 transition-transform flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-rotate-right text-sm"></i>
                    {language === 'FR' ? "Relancer l'Analyse" : "Retry Analysis"}
                  </button>
                )}
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-5 animate-in fade-in duration-1000">
              <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-emerald-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full"></div>
                <div className="flex justify-between items-start mb-6">
                  <div className="max-w-[70%]">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">{result.commonName}</h2>
                    <p className="text-emerald-600 font-bold italic mt-2">{result.scientificName}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${result.isWeed || result.isDisease ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                    {result.isDisease ? 'Maladie' : result.isWeed ? 'Invasive' : 'Saine'}
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-xl border border-orange-100 mb-6">
                  <i className="fa-solid fa-mountain-sun text-orange-500 text-xs"></i>
                  <span className="text-[10px] font-black text-orange-800 uppercase tracking-tighter">Type de Sol détecté : {result.soilType}</span>
                </div>

                <p className="text-slate-600 leading-relaxed text-sm font-medium">{result.description}</p>
              </div>

              <Section title="Éradication & Soins" icon="fa-shield-halved" color="bg-amber-500">
                <div className="space-y-3">
                  <MethodItem label="Biologique" text={result.eradicationMethod.biological} icon="fa-leaf" />
                  <MethodItem label="Mécanique" text={result.eradicationMethod.mechanical} icon="fa-hand-back-fist" />
                  <MethodItem label="Chimique" text={result.eradicationMethod.chemical} icon="fa-flask" />
                </div>
              </Section>

              <Section title="Bienfaits & Santé" icon="fa-heart-pulse" color="bg-emerald-500">
                <p className="text-sm text-slate-700 leading-relaxed mb-6 font-medium">{result.benefits}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-[9px] font-black text-emerald-700 uppercase mb-2 tracking-widest">Avantages Santé</p>
                    <p className="text-[10px] text-slate-600 leading-tight font-medium">{result.healthImpact.advantages}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                    <p className="text-[9px] font-black text-red-700 uppercase mb-2 tracking-widest">Précautions</p>
                    <p className="text-[10px] text-slate-600 leading-tight font-medium">{result.healthImpact.disadvantages}</p>
                  </div>
                </div>
              </Section>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Section: React.FC<{title: string, icon: string, color: string, children: React.ReactNode}> = ({title, icon, color, children}) => (
  <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-emerald-50 relative overflow-hidden">
    <div className="flex items-center gap-4 mb-6">
      <div className={`w-12 h-12 ${color} text-white rounded-2xl flex items-center justify-center shadow-lg`}><i className={`fa-solid ${icon} text-xl`}></i></div>
      <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
    </div>
    {children}
  </div>
);

const MethodItem: React.FC<{label: string, text: string, icon: string}> = ({label, text, icon}) => (
  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm shrink-0 mt-1">
      <i className={`fa-solid ${icon} text-xs`}></i>
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xs text-slate-700 font-medium leading-relaxed">{text}</p>
    </div>
  </div>
);

export default PlantScanner;
