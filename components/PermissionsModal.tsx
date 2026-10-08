import React, { useState } from 'react';
import { useApp } from '../App';
import { AppPermissions, PermissionChoice } from '../types';

interface PermissionsModalProps {
  onComplete: (permissions: AppPermissions) => void;
  language: 'FR' | 'EN';
  initialPermissions?: AppPermissions;
}

const PermissionsModal: React.FC<PermissionsModalProps> = ({ 
  onComplete, 
  language = 'FR',
  initialPermissions = { geolocation: 'prompt', camera: 'prompt', microphone: 'prompt' }
}) => {
  const { showToast } = useApp();
  const isFr = language === 'FR';

  const [permissions, setPermissions] = useState<AppPermissions>(initialPermissions);
  const [activeRequesting, setActiveRequesting] = useState<'camera' | 'geolocation' | 'microphone' | null>(null);

  // Demande système native pour un type de permission
  const requestNativePermission = async (type: 'camera' | 'geolocation' | 'microphone'): Promise<boolean> => {
    setActiveRequesting(type);
    try {
      if (type === 'camera') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      } else if (type === 'microphone') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      } else if (type === 'geolocation') {
        if (!navigator.geolocation) return false;
        return new Promise<boolean>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false),
            { timeout: 6000, enableHighAccuracy: true }
          );
        });
      }
    } catch (e) {
      console.warn(`Autorisation système non accordée pour ${type}:`, e);
      return false;
    } finally {
      setActiveRequesting(null);
    }
    return false;
  };

  // Gestion du choix pour une autorisation spécifique
  const handleSelectChoice = async (
    type: 'camera' | 'geolocation' | 'microphone',
    choice: PermissionChoice
  ) => {
    if (choice === 'denied') {
      // Choix explicite de ne pas autoriser : aucun appel matériel
      setPermissions(prev => ({ ...prev, [type]: 'denied' }));
      showToast(
        isFr
          ? `Accès ${type === 'geolocation' ? 'à la géolocalisation' : type === 'camera' ? "à l'appareil photo" : 'au microphone'} non autorisé.`
          : `${type === 'geolocation' ? 'Location' : type === 'camera' ? 'Camera' : 'Microphone'} access denied.`,
        "info"
      );
      return;
    }

    // Si 'in_use' ou 'once', on déclenche la demande native du navigateur
    const success = await requestNativePermission(type);
    const finalChoice: PermissionChoice = success ? choice : 'denied';

    setPermissions(prev => ({ ...prev, [type]: finalChoice }));

    if (success) {
      const modeLabel = choice === 'in_use' 
        ? (isFr ? "lorsque l'application est utilisée" : "while app is in use") 
        : (isFr ? "pour cette fois" : "for this time only");
      showToast(
        isFr
          ? `Autorisation accordée ${modeLabel} pour ${type === 'geolocation' ? 'la géolocalisation' : type === 'camera' ? "l'appareil photo" : 'le microphone'}.`
          : `Permission granted ${modeLabel} for ${type === 'geolocation' ? 'location' : type === 'camera' ? 'camera' : 'microphone'}.`,
        "success"
      );
    } else {
      showToast(
        isFr
          ? `L'accès système a été bloqué par le navigateur. Vous pouvez continuer sans cette option.`
          : `System access was denied or unavailable in browser. Continuing without it.`,
        "info"
      );
    }
  };

  // Action globale rapide : appliquer un même mode à toutes les autorisations
  const handleApplyGlobal = async (choice: PermissionChoice) => {
    if (choice === 'denied') {
      const allDenied: AppPermissions = {
        geolocation: 'denied',
        camera: 'denied',
        microphone: 'denied',
      };
      setPermissions(allDenied);
      showToast(
        isFr 
          ? "Aucune autorisation accordée. Mode haute confidentialité actif." 
          : "Permissions not authorized. High privacy mode active.",
        "info"
      );
      onComplete(allDenied);
      return;
    }

    const types: ('camera' | 'geolocation' | 'microphone')[] = ['geolocation', 'camera', 'microphone'];
    const updated: AppPermissions = { ...permissions };

    for (const t of types) {
      const ok = await requestNativePermission(t);
      updated[t] = ok ? choice : 'denied';
    }

    setPermissions(updated);
    showToast(
      isFr
        ? (choice === 'in_use' 
            ? "Autorisations validées : Actives uniquement lorsque l'application est utilisée." 
            : "Autorisations validées : Valables pour cette fois-ci uniquement.")
        : (choice === 'in_use' 
            ? "Permissions set: Active only while app is in use." 
            : "Permissions set: Only for this session."),
      "success"
    );
    onComplete(updated);
  };

  const getStatusBadge = (status: PermissionChoice) => {
    switch (status) {
      case 'in_use':
        return (
          <span className="inline-flex items-center gap-1 text-[8.5px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
            <i className="fa-solid fa-check-circle"></i>
            {isFr ? "En utilisation" : "In use"}
          </span>
        );
      case 'once':
        return (
          <span className="inline-flex items-center gap-1 text-[8.5px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
            <i className="fa-solid fa-clock"></i>
            {isFr ? "Cette fois-ci" : "This time"}
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center gap-1 text-[8.5px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
            <i className="fa-solid fa-ban"></i>
            {isFr ? "Non autorisé" : "Denied"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[8.5px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
            {isFr ? "À définir" : "Pending"}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] w-full max-w-md p-6 shadow-2xl border border-slate-200 flex flex-col space-y-5 my-auto animate-in zoom-in-95 duration-200">
        
        {/* En-tête officiel */}
        <div className="text-center space-y-2">
          <div className="relative inline-block mx-auto">
            <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <i className="fa-solid fa-shield-halved text-2xl"></i>
            </div>
            <span className="absolute -bottom-1 -right-1 bg-amber-400 text-amber-950 text-[8px] font-black px-1.5 py-0.5 rounded-full shadow border border-white">
              {isFr ? "SÉCURITÉ" : "PRIVACY"}
            </span>
          </div>

          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
            {isFr ? "Autorisations de l'Application" : "Application Permissions"}
          </h2>
          <p className="text-[10px] text-slate-500 font-bold leading-relaxed max-w-xs mx-auto">
            {isFr 
              ? "À chaque ouverture, choisissez le niveau d'accès souhaité pour la géolocalisation et vos capteurs."
              : "At every app launch, decide access privileges for location and device hardware."}
          </p>
        </div>

        {/* 3 Actions Principales : Exigées par la directive */}
        <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
            {isFr ? "Choisir pour l'ensemble des fonctionnalités :" : "Quick global action for all sensors:"}
          </p>

          <div className="space-y-2">
            {/* OPTION 1 : Uniquement lorsque l'application est utilisée */}
            <button
              onClick={() => handleApplyGlobal('in_use')}
              disabled={activeRequesting !== null}
              className="w-full p-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center justify-between text-left group cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/40 flex items-center justify-center text-white shrink-0">
                  <i className="fa-solid fa-mobile-screen text-sm"></i>
                </div>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-tight">
                    {isFr ? "Uniquement lorsque l'application est utilisée" : "While using the app"}
                  </div>
                  <div className="text-[8.5px] text-emerald-100 font-medium leading-tight">
                    {isFr ? "Recommandé • Actif uniquement à l'écran" : "Recommended • Active only when foregrounded"}
                  </div>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right text-xs text-emerald-200 group-hover:translate-x-1 transition-transform"></i>
            </button>

            {/* OPTION 2 : Cette fois-ci */}
            <button
              onClick={() => handleApplyGlobal('once')}
              disabled={activeRequesting !== null}
              className="w-full p-3 bg-amber-50 hover:bg-amber-100 active:scale-[0.99] border border-amber-300 text-amber-950 rounded-xl transition-all flex items-center justify-between text-left group cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-200/70 text-amber-800 flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-hourglass-half text-sm"></i>
                </div>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-tight">
                    {isFr ? "Cette fois-ci uniquement" : "Only this time"}
                  </div>
                  <div className="text-[8.5px] text-amber-800/80 font-medium leading-tight">
                    {isFr ? "Valable pour la session active seulement" : "Valid for this single session only"}
                  </div>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right text-xs text-amber-600 group-hover:translate-x-1 transition-transform"></i>
            </button>

            {/* OPTION 3 : Ne pas autoriser */}
            <button
              onClick={() => handleApplyGlobal('denied')}
              disabled={activeRequesting !== null}
              className="w-full p-3 bg-white hover:bg-rose-50 active:scale-[0.99] border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-900 rounded-xl transition-all flex items-center justify-between text-left group cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-rose-100 text-slate-600 group-hover:text-rose-600 flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-ban text-sm"></i>
                </div>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-tight">
                    {isFr ? "Ne pas autoriser" : "Do not allow"}
                  </div>
                  <div className="text-[8.5px] text-slate-400 group-hover:text-rose-700 font-medium leading-tight">
                    {isFr ? "Aucune donnée de capteur • Mode manuel" : "Zero sensor telemetry • Manual fallback"}
                  </div>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right text-xs text-slate-400 group-hover:translate-x-1 transition-transform"></i>
            </button>
          </div>
        </div>

        {/* Détail par capteur avec choix individuels */}
        <div className="space-y-3">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">
            {isFr ? "Ou configurer par autorisation :" : "Or configure individually:"}
          </p>

          {/* 1. GÉOLOCALISATION */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <i className="fa-solid fa-location-dot text-xs"></i>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-800 uppercase block leading-tight">
                    {isFr ? "Géolocalisation (GPS)" : "Geolocation (GPS)"}
                  </span>
                  <span className="text-[8px] text-slate-400 block">
                    {isFr ? "Météo locale & profil pédologique" : "Local weather & soil data"}
                  </span>
                </div>
              </div>
              {getStatusBadge(permissions.geolocation)}
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                onClick={() => handleSelectChoice('geolocation', 'in_use')}
                disabled={activeRequesting === 'geolocation'}
                className={`py-1.5 px-2 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${
                  permissions.geolocation === 'in_use'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
                }`}
              >
                {activeRequesting === 'geolocation' ? '...' : (isFr ? 'En utilisation' : 'In use')}
              </button>
              <button
                onClick={() => handleSelectChoice('geolocation', 'once')}
                disabled={activeRequesting === 'geolocation'}
                className={`py-1.5 px-2 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${
                  permissions.geolocation === 'once'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-amber-400'
                }`}
              >
                {isFr ? 'Cette fois-ci' : 'This time'}
              </button>
              <button
                onClick={() => handleSelectChoice('geolocation', 'denied')}
                className={`py-1.5 px-2 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${
                  permissions.geolocation === 'denied'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-rose-400'
                }`}
              >
                {isFr ? 'Refuser' : 'Deny'}
              </button>
            </div>
          </div>

          {/* 2. APPAREIL PHOTO */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <i className="fa-solid fa-camera text-xs"></i>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-800 uppercase block leading-tight">
                    {isFr ? "Appareil Photo" : "Camera Access"}
                  </span>
                  <span className="text-[8px] text-slate-400 block">
                    {isFr ? "Scan et diagnostic visuel IA" : "AI crop & weed scanner"}
                  </span>
                </div>
              </div>
              {getStatusBadge(permissions.camera)}
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                onClick={() => handleSelectChoice('camera', 'in_use')}
                disabled={activeRequesting === 'camera'}
                className={`py-1.5 px-2 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${
                  permissions.camera === 'in_use'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
                }`}
              >
                {activeRequesting === 'camera' ? '...' : (isFr ? 'En utilisation' : 'In use')}
              </button>
              <button
                onClick={() => handleSelectChoice('camera', 'once')}
                disabled={activeRequesting === 'camera'}
                className={`py-1.5 px-2 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${
                  permissions.camera === 'once'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-amber-400'
                }`}
              >
                {isFr ? 'Cette fois-ci' : 'This time'}
              </button>
              <button
                onClick={() => handleSelectChoice('camera', 'denied')}
                className={`py-1.5 px-2 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${
                  permissions.camera === 'denied'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-rose-400'
                }`}
              >
                {isFr ? 'Refuser' : 'Deny'}
              </button>
            </div>
          </div>

          {/* 3. MICROPHONE */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <i className="fa-solid fa-microphone text-xs"></i>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-800 uppercase block leading-tight">
                    {isFr ? "Microphone" : "Microphone Audio"}
                  </span>
                  <span className="text-[8px] text-slate-400 block">
                    {isFr ? "Commandes et assistant vocal" : "Voice commands & assistant"}
                  </span>
                </div>
              </div>
              {getStatusBadge(permissions.microphone)}
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                onClick={() => handleSelectChoice('microphone', 'in_use')}
                disabled={activeRequesting === 'microphone'}
                className={`py-1.5 px-2 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${
                  permissions.microphone === 'in_use'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
                }`}
              >
                {activeRequesting === 'microphone' ? '...' : (isFr ? 'En utilisation' : 'In use')}
              </button>
              <button
                onClick={() => handleSelectChoice('microphone', 'once')}
                disabled={activeRequesting === 'microphone'}
                className={`py-1.5 px-2 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${
                  permissions.microphone === 'once'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-amber-400'
                }`}
              >
                {isFr ? 'Cette fois-ci' : 'This time'}
              </button>
              <button
                onClick={() => handleSelectChoice('microphone', 'denied')}
                className={`py-1.5 px-2 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${
                  permissions.microphone === 'denied'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-rose-400'
                }`}
              >
                {isFr ? 'Refuser' : 'Deny'}
              </button>
            </div>
          </div>
        </div>

        {/* Bouton de confirmation finale */}
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
          <button
            onClick={() => onComplete(permissions)}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <span>{isFr ? "Valider et Accéder à l'Application" : "Confirm & Enter Application"}</span>
            <i className="fa-solid fa-arrow-right text-xs text-emerald-400"></i>
          </button>

          {/* Signature de marque & Réalisateur */}
          <div className="text-center pt-1">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
              <i className="fa-solid fa-clapperboard text-amber-500 text-[9px]"></i>
              <span>{isFr ? "Réalisé par" : "Directed by"} <span className="text-slate-700">Ange Adrien DEFO</span></span>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PermissionsModal;
