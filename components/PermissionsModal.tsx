import React, { useState, useEffect } from 'react';
import { useApp } from '../App';

interface PermissionsModalProps {
  onComplete: () => void;
  language: 'FR' | 'EN';
}

interface PermissionStatus {
  camera: 'granted' | 'session' | 'denied' | 'prompt';
  geolocation: 'granted' | 'session' | 'denied' | 'prompt';
  microphone: 'granted' | 'session' | 'denied' | 'prompt';
}

const PermissionsModal: React.FC<PermissionsModalProps> = ({ onComplete, language = 'FR' }) => {
  const { showToast } = useApp();
  const isFr = language === 'FR';

  const [permissions, setPermissions] = useState<PermissionStatus>(() => {
    // Check local storage for permanently saved permissions
    const saved = localStorage.getItem('agrovision_permanent_permissions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          camera: parsed.camera || 'prompt',
          geolocation: parsed.geolocation || 'prompt',
          microphone: parsed.microphone || 'prompt',
        };
      } catch (e) {
        // Fallback
      }
    }
    return {
      camera: 'prompt',
      geolocation: 'prompt',
      microphone: 'prompt',
    };
  });

  const [selectedSetting, setSelectedSetting] = useState<'always' | 'once'>('always');
  const [activeRequesting, setActiveRequesting] = useState<'camera' | 'geolocation' | 'microphone' | null>(null);

  // Check if permissions were already permanently granted
  useEffect(() => {
    const isAllGranted = 
      permissions.camera === 'granted' && 
      permissions.geolocation === 'granted' && 
      permissions.microphone === 'granted';
    
    // In-memory sessions or previously granted will auto-skip if they are already OK
    // But we want to let the user review it if they have never consented.
  }, [permissions]);

  // Request native permission helper
  const requestNativePermission = async (type: 'camera' | 'geolocation' | 'microphone') => {
    setActiveRequesting(type);
    try {
      if (type === 'camera') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Close stream immediately to release hardware
        stream.getTracks().forEach(track => track.stop());
        return true;
      } else if (type === 'microphone') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      } else if (type === 'geolocation') {
        return new Promise<boolean>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false),
            { timeout: 5000 }
          );
        });
      }
    } catch (e) {
      console.warn(`Native request failed or rejected for ${type}`, e);
      return false;
    } finally {
      setActiveRequesting(null);
    }
    return false;
  };

  const handleGrantIndividual = async (type: 'camera' | 'geolocation' | 'microphone', option: 'always' | 'once') => {
    const nativeSuccess = await requestNativePermission(type);
    
    if (nativeSuccess) {
      setPermissions(prev => {
        const updated = {
          ...prev,
          [type]: option === 'always' ? 'granted' : 'session',
        };
        
        // Save in local storage if chosen always
        if (option === 'always') {
          localStorage.setItem('agrovision_permanent_permissions', JSON.stringify({
            camera: updated.camera === 'granted' ? 'granted' : 'prompt',
            geolocation: updated.geolocation === 'granted' ? 'granted' : 'prompt',
            microphone: updated.microphone === 'granted' ? 'granted' : 'prompt'
          }));
        }
        return updated;
      });

      showToast(
        isFr
          ? `Permission ${type === 'camera' ? 'Caméra' : type === 'geolocation' ? 'Localisation' : 'Microphone'} accordée !`
          : `${type === 'camera' ? 'Camera' : type === 'geolocation' ? 'Location' : 'Microphone'} permission granted!`,
        "success"
      );
    } else {
      showToast(
        isFr
          ? `L'autorisation système de la ${type === 'camera' ? 'Caméra' : type === 'geolocation' ? 'Localisation' : 'Microphone'} a été bloquée.`
          : `System browser authorization for ${type === 'camera' ? 'Camera' : type === 'geolocation' ? 'Location' : 'Microphone'} was block/denied.`,
        "error"
      );
    }
  };

  const handleGrantAll = async () => {
    // Grant all step-by-step based on the global selection 'always' or 'once'
    const list: ('camera' | 'geolocation' | 'microphone')[] = ['camera', 'geolocation', 'microphone'];
    let countSuccess = 0;

    for (const item of list) {
      const success = await requestNativePermission(item);
      if (success) {
        countSuccess++;
        setPermissions(prev => {
          const updated = {
            ...prev,
            [item]: selectedSetting === 'always' ? 'granted' : 'session',
          };
          return updated;
        });
      }
    }

    // Persist permanently if always is selected
    if (selectedSetting === 'always') {
      localStorage.setItem('agrovision_permanent_permissions', JSON.stringify({
        camera: 'granted',
        geolocation: 'granted',
        microphone: 'granted'
      }));
    }

    if (countSuccess === 3) {
      showToast(
        isFr ? "Toutes les autorisations ont été accordées avec succès !" : "All system permissions granted successfully!",
        "success"
      );
    } else if (countSuccess > 0) {
      showToast(
        isFr ? "Certaines autorisations ont été accordées." : "Some system permissions were authorized.",
        "info"
      );
    } else {
      showToast(
        isFr ? "Aucune autorisation accordée. Les fonctionnalités seront limitées." : "No permissions authorized. App features will be limited.",
        "error"
      );
    }

    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[150] flex items-center justify-center p-5 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md p-6.5 shadow-2xl border border-slate-100 flex flex-col space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-inner animate-pulse">
            <i className="fa-solid fa-shield-halved text-3xl text-emerald-600"></i>
          </div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
            {isFr ? "Autorisations Requises" : "System Permissions"}
          </h2>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-relaxed">
            {isFr ? "Configuration des accès AgroVision" : "AgroVision hardware control"}
          </p>
        </div>

        {/* Global selection choice: Once vs Always */}
        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-150 space-y-3.5">
          <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest pl-1 block text-center">
            {isFr ? "Type de consentement global :" : "Consent level settings:"}
          </span>
          
          <div className="grid grid-cols-2 gap-2.5">
            {/* Once Option */}
            <button
              onClick={() => setSelectedSetting('once')}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center justify-center space-y-1 ${
                selectedSetting === 'once'
                  ? 'bg-amber-50 border-amber-300 text-amber-950 ring-2 ring-amber-300'
                  : 'bg-white border-slate-100 text-slate-600 hover:border-amber-200'
              }`}
            >
              <i className="fa-solid fa-hourglass-half text-sm"></i>
              <span className="text-[10px] font-black uppercase tracking-wider">
                {isFr ? "Une seule fois" : "Only Once"}
              </span>
              <span className="text-[7.5px] font-bold opacity-75 text-center">
                {isFr ? "Pour cette session" : "Temporary access"}
              </span>
            </button>

            {/* Always Option */}
            <button
              onClick={() => setSelectedSetting('always')}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center justify-center space-y-1 ${
                selectedSetting === 'always'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 ring-2 ring-emerald-300'
                  : 'bg-white border-slate-100 text-slate-600 hover:border-emerald-200'
              }`}
            >
              <i className="fa-solid fa-circle-check text-sm text-emerald-600"></i>
              <span className="text-[10px] font-black uppercase tracking-wider">
                {isFr ? "Toujours autoriser" : "Always Allow"}
              </span>
              <span className="text-[7.5px] font-bold opacity-75 text-center">
                {isFr ? "Se souvenir du choix" : "Remember choice"}
              </span>
            </button>
          </div>
        </div>

        {/* Permissions list */}
        <div className="space-y-3.5">
          {/* 1. Camera */}
          <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-150 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-xs text-emerald-600 shrink-0">
                <i className="fa-solid fa-camera text-sm"></i>
              </div>
              <div>
                <span className="text-[10.5px] font-black text-slate-800 uppercase block">
                  {isFr ? "Appareil Photo" : "Camera Access"}
                </span>
                <span className="text-[8.5px] text-slate-400 font-bold leading-none block mt-0.5">
                  {isFr ? "Diagnostic de maladies foliaires" : "Leaf disease & weed analysis"}
                </span>
              </div>
            </div>
            
            {permissions.camera === 'granted' || permissions.camera === 'session' ? (
              <span className="text-[8.5px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded uppercase tracking-wider shrink-0">
                {isFr ? "Autorisé" : "Authorized"}
              </span>
            ) : (
              <button
                onClick={() => handleGrantIndividual('camera', selectedSetting)}
                disabled={activeRequesting === 'camera'}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all disabled:opacity-40"
              >
                {activeRequesting === 'camera' ? '...' : (isFr ? 'Activer' : 'Enable')}
              </button>
            )}
          </div>

          {/* 2. Geolocation */}
          <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-150 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-xs text-amber-500 shrink-0">
                <i className="fa-solid fa-location-dot text-sm"></i>
              </div>
              <div>
                <span className="text-[10.5px] font-black text-slate-800 uppercase block">
                  {isFr ? "Géolocalisation" : "GPS Geolocation"}
                </span>
                <span className="text-[8.5px] text-slate-400 font-bold leading-none block mt-0.5">
                  {isFr ? "Profil de sol et météo locale" : "Soil diagnosis & regional weather"}
                </span>
              </div>
            </div>
            
            {permissions.geolocation === 'granted' || permissions.geolocation === 'session' ? (
              <span className="text-[8.5px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded uppercase tracking-wider shrink-0">
                {isFr ? "Autorisé" : "Authorized"}
              </span>
            ) : (
              <button
                onClick={() => handleGrantIndividual('geolocation', selectedSetting)}
                disabled={activeRequesting === 'geolocation'}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all disabled:opacity-40"
              >
                {activeRequesting === 'geolocation' ? '...' : (isFr ? 'Activer' : 'Enable')}
              </button>
            )}
          </div>

          {/* 3. Microphone */}
          <div className="p-3.5 bg-slate-50/50 rounded-2xl border border-slate-150 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-xs text-rose-500 shrink-0">
                <i className="fa-solid fa-microphone text-sm"></i>
              </div>
              <div>
                <span className="text-[10.5px] font-black text-slate-800 uppercase block">
                  {isFr ? "Microphone" : "Microphone Audio"}
                </span>
                <span className="text-[8.5px] text-slate-400 font-bold leading-none block mt-0.5">
                  {isFr ? "Commandes et assistant vocal" : "Hands-free voice operations"}
                </span>
              </div>
            </div>
            
            {permissions.microphone === 'granted' || permissions.microphone === 'session' ? (
              <span className="text-[8.5px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded uppercase tracking-wider shrink-0">
                {isFr ? "Autorisé" : "Authorized"}
              </span>
            ) : (
              <button
                onClick={() => handleGrantIndividual('microphone', selectedSetting)}
                disabled={activeRequesting === 'microphone'}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all disabled:opacity-40"
              >
                {activeRequesting === 'microphone' ? '...' : (isFr ? 'Activer' : 'Enable')}
              </button>
            )}
          </div>
        </div>

        {/* Action button */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <button
            onClick={handleGrantAll}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-700/10 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
          >
            <i className="fa-solid fa-shield-halved"></i>
            {selectedSetting === 'always' 
              ? (isFr ? "Tout autoriser et continuer" : "Authorize all & continue") 
              : (isFr ? "Autoriser une fois et continuer" : "Authorize once & continue")
            }
          </button>
          
          <button
            onClick={onComplete}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
          >
            {isFr ? "Continuer sans autorisations" : "Continue with limits"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PermissionsModal;
