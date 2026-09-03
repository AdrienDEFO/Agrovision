
import { HistoryItem, DraftItem, WeatherData, User, PlantResult } from "../types";
import { IDBService } from "./indexedDB";

export type StorageType = 'MySQL' | 'SQLite';

interface AppSettings {
  storageType: StorageType;
  language: 'FR' | 'EN';
  notifications: boolean;
  theme: 'light' | 'dark';
}

const DEFAULT_SETTINGS: AppSettings = {
  storageType: 'MySQL',
  language: 'FR',
  notifications: true,
  theme: 'light',
};

const HISTORY_KEY = 'agrovision_history';
const DRAFTS_KEY = 'agrovision_drafts';
const USER_KEY = 'agrovision_user';
const SAVED_USER_KEY = 'agrovision_saved_user';
const ANALYSIS_CACHE_KEY = 'agrovision_analysis_cache';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 jours de validité
const MAX_CACHE_ENTRIES = 50;

interface CacheEntry {
  hash: string;
  result: PlantResult;
  timestamp: number;
}

export const StorageService = {
  getUser: (): User | null => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  getSavedUser: (): User | null => {
    try {
      const saved = localStorage.getItem(SAVED_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  saveUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(SAVED_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  },

  getSettings: (): AppSettings => {
    const saved = localStorage.getItem('agrovision_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  },

  saveSettings: (settings: AppSettings) => {
    localStorage.setItem('agrovision_settings', JSON.stringify(settings));
  },

  // Gestion de l'historique
  getHistory: (): HistoryItem[] => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filtrer et supprimer définitivement l'historique de démonstration généré
          const filtered = parsed.filter(item => !item.id.startsWith("seed-"));
          if (filtered.length !== parsed.length) {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
          }
          return filtered;
        }
      } catch (e) {
        return [];
      }
    }
    return [];
  },

  addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const history = StorageService.getHistory();
    const newItem: HistoryItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    const updatedHistory = [newItem, ...history];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    // Sauvegarde miroir asynchrone et chiffrée dans IndexedDB pour la résilience hors-ligne
    IDBService.saveDiagnostic(newItem).catch((err) => {
      console.warn("[Storage] Sauvegarde IndexedDB différée :", err);
    });
  },

  clearHistory: () => {
    localStorage.removeItem(HISTORY_KEY);
  },

  // Gestion des brouillons hors-ligne (Turbulences réseau)
  getDrafts: (): DraftItem[] => {
    const saved = localStorage.getItem(DRAFTS_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  addDraft: (draft: Omit<DraftItem, 'id' | 'timestamp'>) => {
    const drafts = StorageService.getDrafts();
    const newDraft: DraftItem = {
      ...draft,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    const updatedDrafts = [newDraft, ...drafts];
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));
    return newDraft;
  },

  deleteDraft: (id: string) => {
    const drafts = StorageService.getDrafts();
    const updatedDrafts = drafts.filter(d => d.id !== id);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));
  },

  clearDrafts: () => {
    localStorage.removeItem(DRAFTS_KEY);
  },

  // Purge automatique des données de plus de 30 jours
  cleanOldHistory: () => {
    const history = StorageService.getHistory();
    const now = Date.now();
    const filteredHistory = history.filter(item => (now - item.timestamp) < THIRTY_DAYS_MS);
    
    if (filteredHistory.length !== history.length) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory));
      console.log(`[Storage] Purge effectuée : ${history.length - filteredHistory.length} anciens scans supprimés.`);
    }
  },

  // Cache local intelligent des analyses IA
  computeImageHash: (base64: string): string => {
    if (!base64) return 'empty';
    const len = base64.length;
    let hash = 0x811c9dc5; // FNV offset basis
    
    // Sample across the base64 string
    const step = Math.max(1, Math.floor(len / 128));
    for (let i = 0; i < len; i += step) {
      hash ^= base64.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193); // FNV prime
    }
    
    // Include specific checkpoints (start, middle, end) and length
    const startSample = base64.substring(0, Math.min(32, len));
    const endSample = base64.substring(Math.max(0, len - 32));
    return `img_${len}_${(hash >>> 0).toString(16)}_${startSample.length}_${endSample.length}`;
  },

  getCachedAnalysis: (hash: string): PlantResult | null => {
    try {
      const raw = localStorage.getItem(ANALYSIS_CACHE_KEY);
      if (!raw) return null;
      const entries: CacheEntry[] = JSON.parse(raw);
      if (!Array.isArray(entries)) return null;

      const now = Date.now();
      const match = entries.find(e => e.hash === hash && (now - e.timestamp) < CACHE_TTL_MS);
      if (match) {
        return {
          ...match.result,
          isFromCache: true
        };
      }
      return null;
    } catch (e) {
      console.warn("Error reading analysis cache:", e);
      return null;
    }
  },

  setCachedAnalysis: (hash: string, result: PlantResult) => {
    try {
      const raw = localStorage.getItem(ANALYSIS_CACHE_KEY);
      let entries: CacheEntry[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(entries)) entries = [];

      const now = Date.now();
      // Remove stale entries and existing entry with same hash
      entries = entries.filter(e => e.hash !== hash && (now - e.timestamp) < CACHE_TTL_MS);

      // Add new entry at top
      entries.unshift({
        hash,
        result: {
          ...result,
          isFromCache: true
        },
        timestamp: now
      });

      // Keep only up to MAX_CACHE_ENTRIES
      if (entries.length > MAX_CACHE_ENTRIES) {
        entries = entries.slice(0, MAX_CACHE_ENTRIES);
      }

      localStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.warn("Error saving to analysis cache:", e);
    }
  },

  clearAnalysisCache: () => {
    localStorage.removeItem(ANALYSIS_CACHE_KEY);
  },

  syncData: async () => {
    StorageService.cleanOldHistory(); // Purge à chaque sync
    const history = StorageService.getHistory();
    // Synchronisation et sauvegarde sécurisée dans IndexedDB
    try {
      await IDBService.syncDiagnostics(history);
    } catch (e) {
      console.warn("[Storage] Échec partiel de synchro IndexedDB :", e);
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1000);
    });
  },

  exportDiagnosticsCSV: async () => {
    return IDBService.exportDiagnosticsToCSV(StorageService.getHistory());
  },

  getIDBStatus: async () => {
    return IDBService.getStatus();
  }
};
