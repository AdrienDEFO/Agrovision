
import { HistoryItem, DraftItem, WeatherData, User } from "../types";

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
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

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
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // Fallback to seeding
      }
    }

    // Seed default history items if empty or corrupted
    const defaultHistory: HistoryItem[] = [
      {
        id: "seed-1",
        commonName: "Mosaïque du Manioc",
        scientificName: "African cassava mosaic virus",
        isWeed: false,
        isDisease: true,
        diseaseSymptoms: "Décoloration des feuilles en mosaïque jaune/vert, déformation et réduction sévère de la taille des folioles.",
        benefits: "S/O — Aucun bénéfice pour la culture.",
        drawbacks: "Perte de rendement drastique pouvant atteindre 80% si l'attaque survient tôt dans le cycle cultural.",
        soilType: "Sableux-argileux",
        healthImpact: {
          advantages: "Aucun.",
          disadvantages: "Dégénérescence progressive des boutures et altération de la qualité de l'amidon dans les tubercules."
        },
        eradicationMethod: {
          biological: "Utiliser impérativement des boutures saines certifiées résistantes de l'IITA. Pratiquer l'arrachage précoce et systématique ainsi que le brûlage des plants infectés hors de la parcelle.",
          mechanical: "Labour profond avant plantation pour enfouir et détruire les débris végétaux précédents.",
          chemical: "Pas de traitement curatif chimique. Les insecticides contre le vecteur (mouche blanche) sont peu économiques à grande échelle."
        },
        description: "La mosaïque du manioc est la maladie virale la plus critique affectant cette culture de subsistance en Afrique subsaharienne. Elle est transmise par l'insecte vecteur Bemisia tabaci (mouche blanche) ou par l'usage répété de boutures infectées.",
        image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=600",
        timestamp: Date.now() - 24 * 60 * 60 * 1000 // 1 jour
      },
      {
        id: "seed-2",
        commonName: "Rouille Commune du Maïs",
        scientificName: "Puccinia sorghi",
        isWeed: false,
        isDisease: true,
        diseaseSymptoms: "Apparition de petites pustules pulvérulentes allongées de couleur brun-orangé sur les deux faces des feuilles.",
        benefits: "S/O — Aucun bénéfice.",
        drawbacks: "Dessèchement foliaire précoce, ralentissement de la photosynthèse et diminution du calibre des grains.",
        soilType: "Argilo-limoneux fertile",
        healthImpact: {
          advantages: "Aucun.",
          disadvantages: "Sensibilité accrue aux cassures de tiges sous l'effet du vent fort (Harmattan)."
        },
        eradicationMethod: {
          biological: "Cultiver des variétés locales tolérantes ou hybrides résistantes. Pratiquer une rotation culturale de 2 ans minimum avec des Légumineuses (Niébé, Arachide).",
          mechanical: "Éliminer et détruire les résidus de récolte après la moisson pour interrompre le cycle de survie des spores.",
          chemical: "Application préventive de fongicides bio-compatibles à base de cuivre ou de soufre lors des saisons très humides."
        },
        description: "Maladie fongique aérienne majeure se propageant par temps humide et chaud (20-25°C). Les spores microscopiques sont dispersées sur de longues distances par l'action du vent.",
        image: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&q=80&w=600",
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 // 3 jours
      },
      {
        id: "seed-3",
        commonName: "Chiendent d'Afrique",
        scientificName: "Cynodon dactylon",
        isWeed: true,
        isDisease: false,
        diseaseSymptoms: "S/O — Plante adventice robuste formant un couvert dense.",
        benefits: "Excellent protecteur du sol contre l'érosion hydrique. Sert de fourrage de secours riche pour le bétail (ovins/caprins).",
        drawbacks: "Concurrence agressive pour l'eau, l'azote et la lumière, étouffant les jeunes pousses de maïs ou de coton.",
        soilType: "Latéritique ou dégradé",
        healthImpact: {
          advantages: "Augmente la matière organique de surface lors du fauchage, retient la fraîcheur du sol.",
          disadvantages: "Envahit rapidement les interlignes des cultures de rente."
        },
        eradicationMethod: {
          biological: "Semer des cultures d'ombrage denses ou rampantes (Mucuna pruriens, niébé rampant) pour étouffer le chiendent.",
          mechanical: "Binage soigné en saison sèche pour exposer les stolons et rhizomes arrachés au dessèchement solaire direct.",
          chemical: "Application ciblée d'herbicides organiques à base d'acide pélargonique ou vinaigre horticole concentré."
        },
        description: "Graminée vivace stolonifère extrêmement vigoureuse et résistante à la sécheresse. Elle colonise les sols labourés grâce à ses tiges rampantes profondément ancrées.",
        image: "https://images.unsplash.com/photo-1508500383102-6199b7ffd1d3?auto=format&fit=crop&q=80&w=600",
        timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000 // 5 jours
      }
    ];

    localStorage.setItem(HISTORY_KEY, JSON.stringify(defaultHistory));
    return defaultHistory;
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
