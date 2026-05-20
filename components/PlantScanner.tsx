
import React, { useState, useRef, useEffect } from 'react';
import { identifyPlant } from '../services/gemini';
import { PlantResult, WeatherData } from '../types';
import { useApp } from '../App';
import { StorageService } from '../services/storage';

const MAX_SIZE_MB = 10;

const PlantScanner: React.FC = () => {
  const { showToast, language } = useApp();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<PlantResult | null>(null);
  const [weather, setWeather] = useState<WeatherData | undefined>();
  const [coords, setCoords] = useState<{lat: number, lng: number} | undefined>();
  
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
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        showToast(`Image trop lourde ! Limite : ${MAX_SIZE_MB}Mo`, "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setImage(reader.result as string);
        processImage(base64, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (base64: string, fullDataUrl: string) => {
    setLoading(true);
    setResult(null);
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
      const msg = err?.message || String(err);
      
      if (msg.includes("clé API") || msg.includes("API key") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("Quota")) {
        showToast(language === 'FR' 
          ? "Quota atteint ou clé API manquante. Ajoutez une clé de rechange dans l'onglet Paramètres." 
          : "Quota reached or API key missing. Add backup keys in Settings.", "error");
      } else {
        showToast(language === 'FR'
          ? "Impossible d'identifier la plante. Rapprochez la caméra ou optimisez l'éclairage de l'image."
          : "Could not identify plant. Try bringing the camera closer or optimizing image lighting.", "error");
      }
      setImage(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6 pb-28">
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
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
          <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white group">
            <img src={image} className="w-full h-80 object-cover" alt="Scan" />
            {loading && (
              <div className="absolute inset-0 bg-emerald-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-8">
                <div className="w-16 h-16 border-4 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-black uppercase tracking-widest italic">Fusion des Données...</h3>
                <div className="flex gap-2 mt-4">
                   <div className="px-3 py-1 bg-white/10 rounded-full text-[8px] font-bold uppercase tracking-widest">Géo-Localisation</div>
                   <div className="px-3 py-1 bg-white/10 rounded-full text-[8px] font-bold uppercase tracking-widest">Climat Actuel</div>
                </div>
              </div>
            )}
            {!loading && <button onClick={() => {setImage(null); setResult(null);}} className="absolute top-4 right-4 bg-white/90 text-red-500 p-3 rounded-2xl shadow-xl active:scale-90 transition-transform"><i className="fa-solid fa-xmark text-xl"></i></button>}
          </div>

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
