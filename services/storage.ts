
import { HistoryItem } from "../types";

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
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const StorageService = {
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
    return saved ? JSON.parse(saved) : [];
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
  },

  clearHistory: () => {
    localStorage.removeItem(HISTORY_KEY);
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

  syncData: async () => {
    const settings = StorageService.getSettings();
    StorageService.cleanOldHistory(); // Purge à chaque sync
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1500);
    });
  }
};
