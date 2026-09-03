
import React, { useState, useEffect } from 'react';
import { User, Language, HistoryItem } from '../types';
import { StorageService, StorageType } from '../services/storage';
import { IDBService, IDBStatus } from '../services/indexedDB';
import { useApp } from '../App';
import Logo from './Logo';
import YieldChart from './YieldChart';

interface SettingsProps {
  user: User;
  setUser: (user: User | null) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, setUser }) => {
  const { showToast, setLanguage, language, showInstallBanner, installApp, isOffline, setIsOffline } = useApp();
  const [settings, setSettings] = useState(StorageService.getSettings());
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  
  // IndexedDB & Export CSV State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [idbStatus, setIdbStatus] = useState<IDBStatus | null>(null);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isSyncingIDB, setIsSyncingIDB] = useState(false);

  useEffect(() => {
    const hist = StorageService.getHistory();
    setHistory(hist);
    IDBService.getStatus().then((status) => {
      setIdbStatus(status);
      // Synchronisation initiale automatique dans IndexedDB si besoin
      if (status.isSupported && (status.count < hist.length || status.count === 0) && hist.length > 0) {
        IDBService.syncDiagnostics(hist).then(() => {
          IDBService.getStatus().then(setIdbStatus);
        });
      }
    });
  }, []);

  const handleExportCSV = async () => {
    setIsExportingCSV(true);
    try {
      const currentHistory = StorageService.getHistory();
      const res = await IDBService.exportDiagnosticsToCSV(currentHistory);
      showToast(
        language === 'FR' 
          ? `Export réussi : ${res.count} diagnostic(s) exportés en CSV depuis la sauvegarde sécurisée IndexedDB !` 
          : `Export successful: ${res.count} diagnostic(s) exported to CSV via secured IndexedDB offline backup!`,
        "success"
      );
      const updated = await IDBService.getStatus();
      setIdbStatus(updated);
    } catch (err: any) {
      showToast(
        err?.message || (language === 'FR' ? "Erreur lors de l'export CSV" : "Error during CSV export"),
        "error"
      );
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleSyncIDB = async () => {
    setIsSyncingIDB(true);
    try {
      const currentHistory = StorageService.getHistory();
      const count = await IDBService.syncDiagnostics(currentHistory);
      const updated = await IDBService.getStatus();
      setIdbStatus(updated);
      showToast(
        language === 'FR'
          ? `IndexedDB synchronisé : ${count} diagnostics sécurisés hors-ligne.`
          : `IndexedDB synchronized: ${count} diagnostics secured offline.`,
        "success"
      );
    } catch {
      showToast(
        language === 'FR' ? "Erreur de synchronisation IndexedDB" : "IndexedDB sync error",
        "error"
      );
    } finally {
      setIsSyncingIDB(false);
    }
  };
  
  // Custom Backup keys rotation management for high intensity scanning (1000/day)
  const [backupKeys, setBackupKeys] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('agrovision_backup_keys');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newKey, setNewKey] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  const updateSetting = async (key: keyof typeof settings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
    
    if (key === 'language') setLanguage(value);
    
    setIsSyncing(true);
    await StorageService.syncData();
    setIsSyncing(false);
    
    showToast(language === 'FR' ? "Préférences enregistrées" : "Preferences saved", "success");
  };

  const handleAddKey = () => {
    const trimmed = newKey.trim();
    if (!trimmed) return;
    if (backupKeys.includes(trimmed)) {
      showToast(language === 'FR' ? "Cette clé est déjà enregistrée" : "This key is already added", "info");
      return;
    }
    const updated = [...backupKeys, trimmed];
    setBackupKeys(updated);
    localStorage.setItem('agrovision_backup_keys', JSON.stringify(updated));
    setNewKey('');
    showToast(language === 'FR' ? "Clé de secours ajoutée" : "Backup key added", "success");
  };

  const handleDeleteKey = (keyToDelete: string) => {
    const updated = backupKeys.filter(k => k !== keyToDelete);
    setBackupKeys(updated);
    localStorage.setItem('agrovision_backup_keys', JSON.stringify(updated));
    showToast(language === 'FR' ? "Clé supprimée" : "Key deleted", "info");
  };

  const maskKey = (key: string) => {
    if (key.length <= 10) return "****";
    return `${key.slice(0, 7)}...${key.slice(-4)}`;
  };

  return (
    <div className="bg-white min-h-full animate-in slide-in-from-right duration-300 pb-24">
      <div className="p-8 text-center bg-gradient-to-b from-emerald-50/50 to-white relative">
        {isSyncing && (
          <div className="absolute top-4 right-4 text-[10px] font-black text-emerald-500 flex items-center gap-1.5 animate-pulse">
            <i className="fa-solid fa-cloud-arrow-up"></i> SYNC DB
          </div>
        )}
        <div className="relative inline-block group">
          <img src={user.avatar} className="w-24 h-24 rounded-[2rem] border-4 border-white shadow-2xl bg-white" alt="Avatar" />
          <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 text-white rounded-xl flex items-center justify-center border-4 border-white shadow-lg active:scale-90 transition-transform">
            <i className="fa-solid fa-pencil text-[10px]"></i>
          </button>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mt-4 tracking-tight">{user.name}</h2>
        <div className="flex flex-col items-center justify-center gap-1.5 mt-1.5">
          <span className="text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">{user.role}</span>
          {user.city && (
            <span className="text-gray-400 font-semibold text-xs flex items-center gap-1">
              <i className="fa-solid fa-location-dot text-emerald-500 text-[10px]"></i>
              {user.city}
            </span>
          )}
        </div>
      </div>

      <div className="px-6 space-y-6">
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{language === 'FR' ? 'Base de Données' : 'Database'}</h3>
          <div className="bg-slate-50 p-1.5 rounded-[1.5rem] flex gap-2 border border-slate-100">
            {(['MySQL', 'SQLite'] as StorageType[]).map((type) => (
              <button
                key={type}
                onClick={() => updateSetting('storageType', type)}
                className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  settings.storageType === type 
                  ? 'bg-white text-emerald-600 shadow-xl shadow-emerald-900/5 ring-1 ring-emerald-500/10' 
                  : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{language === 'FR' ? 'Paramètres' : 'Settings'}</h3>
          <div className="space-y-2">
            <ToggleItem 
              icon="fa-bell" 
              label={language === 'FR' ? "Notifications" : "Notifications"} 
              active={settings.notifications} 
              onToggle={() => updateSetting('notifications', !settings.notifications)}
            />
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                  <i className="fa-solid fa-language text-sm"></i>
                </div>
                <span className="font-black text-gray-700 text-xs uppercase tracking-tighter">{language === 'FR' ? 'Langue' : 'Language'}</span>
              </div>
              <select 
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value as Language)}
                className="bg-transparent text-[10px] font-black text-emerald-600 outline-none cursor-pointer uppercase tracking-widest"
              >
                <option value="FR">FRANÇAIS</option>
                <option value="EN">ENGLISH</option>
              </select>
            </div>

            {/* Premium Pitch Deck Access Button */}
            <a 
              href="/presentation.html" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl transition-all shadow-md active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 text-white rounded-xl flex items-center justify-center shadow-inner">
                  <i className="fa-solid fa-person-chalkboard text-xs"></i>
                </div>
                <div className="text-left">
                  <p className="font-black text-white text-xs uppercase tracking-tighter">
                    {language === 'FR' ? 'Pitch Deck Officiel' : 'Official Pitch Deck'}
                  </p>
                  <p className="text-[9px] text-emerald-100 font-semibold">
                    {language === 'FR' ? '7 Slides interactifs avec modèle épidémiologique & business plan' : '7 Interactive slides with epidemiological equations & business plan'}
                  </p>
                </div>
              </div>
              <i className="fa-solid fa-arrow-up-right-from-square text-xs text-white/70"></i>
            </a>
          </div>
        </div>

        {/* Graphique de Rendement des Récoltes */}
        <div className="space-y-3">
          <div className="flex justify-between items-center ml-1">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {language === 'FR' ? 'Analyse & Graphique de Rendement' : 'Yield Analytics & Crop Projection'}
            </h3>
            <span className="text-[8px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black uppercase">
              {language === 'FR' ? 'Modèle IA' : 'AI Model'}
            </span>
          </div>

          <YieldChart 
            language={language} 
            history={history} 
            onExportCSV={handleExportCSV} 
          />
        </div>

        {/* Sauvegarde Sécurisée Hors-ligne (IndexedDB) & Export CSV */}
        <div className="space-y-3">
          <div className="flex justify-between items-center ml-1">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {language === 'FR' ? 'Sauvegarde IndexedDB & Export CSV' : 'IndexedDB Backup & CSV Export'}
            </h3>
            <span className="text-[8px] bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-black uppercase">
              {idbStatus?.isSupported ? "IndexedDB OK" : "Stockage Local"}
            </span>
          </div>

          <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 space-y-4">
            {/* Statut de stockage IndexedDB */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                    <i className="fa-solid fa-hard-drive"></i>
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight block">
                      {language === 'FR' ? 'Sauvegarde Sécurisée Hors-ligne' : 'Secured Offline Backup'}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {idbStatus?.count ?? history.length} {language === 'FR' ? 'diagnostic(s) archivé(s) dans IndexedDB' : 'diagnoses stored in IndexedDB'}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {language === 'FR' ? 'Persistant' : 'Persistent'}
                </span>
              </div>

              <p className="text-[10px] text-slate-500 font-medium leading-relaxed pt-1 border-t border-slate-100">
                {language === 'FR' 
                  ? "Les fiches de diagnostic et de rendement sont stockées localement dans IndexedDB pour résister aux coupures de réseau et permettre un archivage durable sans dépendance au serveur."
                  : "Diagnostic and crop yield logs are safely persisted locally in IndexedDB to withstand network drops and allow long-term offline retention."
                }
              </p>
            </div>

            {/* Bouton d'export CSV des données de diagnostic */}
            <button
              id="export-diagnostics-csv-btn"
              onClick={handleExportCSV}
              disabled={isExportingCSV}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/10 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <i className={`fa-solid ${isExportingCSV ? 'fa-spinner fa-spin' : 'fa-file-csv'} text-sm text-emerald-200`}></i>
              {isExportingCSV 
                ? (language === 'FR' ? "Génération CSV en cours..." : "Generating CSV...")
                : (language === 'FR' ? "Exporter les Diagnostics (CSV)" : "Export Diagnostics to CSV")
              }
            </button>

            {/* Bouton de resynchronisation manuelle IndexedDB */}
            <button
              onClick={handleSyncIDB}
              disabled={isSyncingIDB}
              className="w-full py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <i className={`fa-solid ${isSyncingIDB ? 'fa-spinner fa-spin' : 'fa-rotate'} text-indigo-600`}></i>
              {isSyncingIDB 
                ? (language === 'FR' ? "Synchronisation en cours..." : "Syncing...")
                : (language === 'FR' ? "Synchroniser avec IndexedDB" : "Sync with IndexedDB")
              }
            </button>
          </div>
        </div>

        {/* PWA & Offline Management Section */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {language === 'FR' ? 'Progressive Web App (PWA) & Hors-ligne' : 'Progressive Web App (PWA) & Offline'}
          </h3>
          <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 space-y-4">
            
            {/* Connection and sync status badge */}
            <div className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl p-3.5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${isOffline ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></div>
                <span className="text-[10px] font-black uppercase text-slate-700 leading-none">
                  {isOffline 
                    ? (language === 'FR' ? "Opérations locales actives" : "Local offline operations")
                    : (language === 'FR' ? "Synchronisé au cloud" : "Synced with cloud")
                  }
                </span>
              </div>
              <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full">
                {isOffline ? "LOCAL" : "ONLINE"}
              </span>
            </div>

            {/* Offline features checklist */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none block">
                {language === 'FR' ? "Capacités autonomes actives :" : "Active standalone capabilities:"}
              </span>
              <div className="grid grid-cols-1 gap-1 text-[10px] text-slate-600 font-semibold pl-1">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <i className="fa-solid fa-circle-check text-xs text-emerald-600"></i>
                  <span>{language === 'FR' ? "Scanner de maladies (avec templates)" : "Disease Scanner (via offline templates)"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <i className="fa-solid fa-circle-check text-xs text-emerald-600"></i>
                  <span>{language === 'FR' ? "Base de données & Rapports de vulnérabilité" : "Local database & Vulnerability reports"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <i className="fa-solid fa-circle-check text-xs text-emerald-600"></i>
                  <span>{language === 'FR' ? "Calendriers de semis & Profils climatiques" : "Sowing calendars & Soil profiles"}</span>
                </div>
              </div>
            </div>

            {/* Installation Prompt Action */}
            {showInstallBanner ? (
              <button
                onClick={installApp}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                <i className="fa-solid fa-circle-arrow-down animate-bounce"></i>
                {language === 'FR' ? "Installer sur l'appareil (PWA)" : "Install App on Device (PWA)"}
              </button>
            ) : (
              <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100 text-[10px] text-slate-600 space-y-2">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <i className="fa-solid fa-square-phone text-emerald-600 text-sm"></i>
                  {language === 'FR' ? "Installation sur mobile / PC :" : "Mobile or PC Installation:"}
                </p>
                <div className="space-y-1 leading-relaxed font-semibold">
                  <p>
                    {language === 'FR' 
                      ? "• Android (Chrome) : Ouvrez le menu du navigateur, puis sélectionnez 'Ajouter à l'écran d'accueil'." 
                      : "• Android (Chrome): Tap browser menu and select 'Add to Home screen'."
                    }
                  </p>
                  <p>
                    {language === 'FR' 
                      ? "• iOS / iPhone (Safari) : Appuyez sur l'icône de partage [↑] en bas, puis sélectionnez 'Sur l'écran d'accueil'." 
                      : "• iOS / iPhone (Safari): Tap share icon [↑] and choose 'Add to Home Screen'."
                    }
                  </p>
                  <p>
                    {language === 'FR' 
                      ? "• PC (Chrome/Edge) : Cliquez sur l'icône d'installation dans la barre d'adresse en haut." 
                      : "• PC (Chrome/Edge): Click the Install icon in the top URL address bar."
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Reset/Manage Hardware Permissions */}
            <button
              onClick={() => {
                localStorage.removeItem('agrovision_permanent_permissions');
                showToast(
                  language === 'FR' 
                    ? "Autorisations système réinitialisées. Elles seront redemandées au prochain démarrage."
                    : "System permissions reset. They will be requested again on next launch.",
                  "info"
                );
              }}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <i className="fa-solid fa-user-shield"></i>
              {language === 'FR' ? "Réinitialiser les Autorisations" : "Reset System Permissions"}
            </button>

            {/* Clear AI Analysis Cache */}
            <button
              onClick={() => {
                StorageService.clearAnalysisCache();
                showToast(
                  language === 'FR' 
                    ? "Cache d'analyse IA vidé avec succès."
                    : "AI analysis cache cleared successfully.",
                  "success"
                );
              }}
              className="w-full py-3 bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 text-amber-800 font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <i className="fa-solid fa-bolt text-amber-600"></i>
              {language === 'FR' ? "Vider le Cache d'Analyse IA" : "Clear AI Fast Cache"}
            </button>
          </div>
        </div>

        {/* API Keys Rotation Management Panel */}
        <div className="space-y-3">
          <div className="flex justify-between items-center ml-1">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {language === 'FR' ? 'Rotation de Clés API (1000+ photo/jour)' : 'API Keys Rotation (1000+ photo/day)'}
            </h3>
            <span className="text-[9px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-bold">
              {language === 'FR' ? 'Prêt' : 'Ready'}
            </span>
          </div>

          <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 space-y-4">
            <p className="text-[10px] text-gray-500 leading-relaxed font-semibold">
              {language === 'FR' 
                ? "Pour dépasser les quotas de l'IA gratuite, ajoutez d'autres clés ici. L'application alternera automatiquement entre elles pour garantir une vitesse de scan sans interruption."
                : "To bypass free IA limits, add secondary keys here. The app will auto-rotate through them to ensure non-stop scanner performance."
              }
            </p>

            <div className="flex gap-2">
              <input 
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder={language === 'FR' ? "Ajouter clé Gemini (ex: AIzaSy...)" : "Add Gemini API Key (e.g. AIzaSy...)"}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <button 
                onClick={handleAddKey}
                className="bg-emerald-600 text-white w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-transform shrink-0"
              >
                <i className="fa-solid fa-plus text-xs"></i>
              </button>
            </div>

            {/* Interactive How-To Collapsible Guide */}
            <div className="border-t border-slate-200/60 pt-3">
              <button 
                onClick={() => setShowGuide(!showGuide)}
                className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold hover:text-emerald-700 outline-none active:scale-95 transition-transform"
              >
                <i className={`fa-solid ${showGuide ? 'fa-chevron-down' : 'fa-chevron-right'} text-[9px]`}></i>
                <span>
                  {language === 'FR' ? '💡 Comment obtenir d\'autres clés gratuites ?' : '💡 How to get more free keys?'}
                </span>
              </button>

              {showGuide && (
                <div className="mt-2.5 bg-emerald-50/50 rounded-2xl p-3 border border-emerald-100 text-[10px] text-slate-600 space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <p className="font-bold text-slate-800">
                    {language === 'FR' 
                      ? 'Pour générer des clés Gemini gratuites supplémentaires :' 
                      : 'To generate additional free Gemini keys:'
                    }
                  </p>
                  <ol className="list-decimal list-inside space-y-1 font-semibold leading-relaxed">
                    <li>
                      {language === 'FR' ? 'Rendez-vous sur' : 'Go to'}{' '}
                      <a 
                        href="https://aistudio.google.com/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-emerald-600 underline font-black"
                      >
                        aistudio.google.com
                      </a>
                    </li>
                    <li>
                      {language === 'FR' 
                        ? 'Connectez-vous avec n\'importe quel compte Google.' 
                        : 'Sign in using any Google account.'
                      }
                    </li>
                    <li>
                      {language === 'FR' 
                        ? 'Cliquez sur le bouton bleu "Get API Key" en haut à gauche.' 
                        : 'Click on the blue "Get API Key" button in the upper-left.'
                      }
                    </li>
                    <li>
                      {language === 'FR' 
                        ? 'Créez une clé dans un nouveau projet (c\'est totalement gratuit, sans carte bancaire).' 
                        : 'Create a key in a new project (it is completely free, no credit card required).'
                      }
                    </li>
                    <li>
                      {language === 'FR' 
                        ? 'Copiez la clé générée et collez-la ci-dessus.' 
                        : 'Copy the generated key and paste it above.'
                      }
                    </li>
                  </ol>
                  <p className="text-[9px] text-amber-600 font-bold italic">
                    {language === 'FR' 
                      ? '💡 Astuce : Vous pouvez utiliser différents comptes Google pour créer plusieurs clés de rechange !' 
                      : '💡 Tip: You can use different Google accounts to generate more unique backup keys!'
                    }
                  </p>
                </div>
              )}
            </div>

            {backupKeys.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{language === 'FR' ? 'Clés actives' : 'Active Keys'}</p>
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                  {backupKeys.map((key, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white border border-slate-100 rounded-xl px-3 py-1.5 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        <span className="text-[10px] font-mono text-slate-700 font-bold">{maskKey(key)}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteKey(key)}
                        className="text-red-500 text-xs hover:text-red-700 p-1 rounded-lg hover:bg-red-50"
                      >
                        <i className="fa-solid fa-trash-can text-[10px]"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Beautiful Expandable About Section with Full Logo */}
        <div className="space-y-3">
          <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 space-y-4">
            <button
              onClick={() => setShowAbout(!showAbout)}
              className="w-full flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest outline-none cursor-pointer"
            >
              <span>{language === 'FR' ? "À propos d'AgroVision AI" : "About AgroVision AI"}</span>
              <i className={`fa-solid ${showAbout ? 'fa-chevron-down' : 'fa-chevron-right'} text-[9px] text-emerald-600`}></i>
            </button>
            
            {showAbout && (
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-inner flex flex-col items-center animate-in slide-in-from-top-2 duration-300">
                <Logo size="md" showSubtitle={true} showSlogan={true} />
                <p className="text-[10px] text-gray-500 font-semibold leading-relaxed text-center mt-4 border-t border-slate-100 pt-3">
                  {language === 'FR'
                    ? "AgroVision AI est une plateforme d'agriculture de précision souveraine, conçue pour opérer de manière résiliente même en l'absence de réseau Internet. Elle combine l'intelligence artificielle pour l'analyse des sols et des cultures et l'échange de savoir agronomique communautaire pour nourrir durablement l'Afrique."
                    : "AgroVision AI is a sovereign precision agriculture framework engineered to deliver high-fidelity offline agronomic analysis. It fuses server-side and client-side AI modules with community collective wisdom to achieve sustainable food security in Africa."
                  }
                </p>
                <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider mt-3">
                  Version 2.0 (Offline Native)
                </span>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={() => setUser(null)}
          className="w-full py-4 rounded-2xl bg-red-50 text-red-500 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-100 transition-colors border border-red-100 shadow-sm mt-8 active:scale-95"
        >
          <i className="fa-solid fa-power-off"></i> {language === 'FR' ? 'Déconnexion' : 'Logout'}
        </button>
      </div>
    </div>
  );
};

const ToggleItem: React.FC<{ icon: string, label: string, active: boolean, onToggle: () => void }> = ({ icon, label, active, onToggle }) => (
  <button onClick={onToggle} className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl group border border-slate-100 transition-all hover:border-emerald-200">
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 ${active ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'} rounded-xl flex items-center justify-center shadow-sm transition-colors`}>
        <i className={`fa-solid ${icon} text-sm`}></i>
      </div>
      <span className="font-black text-gray-700 text-xs uppercase tracking-tighter">{label}</span>
    </div>
    <div className={`w-10 h-6 rounded-full relative transition-colors ${active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${active ? 'left-5' : 'left-1'}`}></div>
    </div>
  </button>
);

export default Settings;
