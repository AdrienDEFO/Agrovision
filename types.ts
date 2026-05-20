
export type UserRole = 'ONG' | 'Agriculteur' | 'Ingénieur Agronome' | 'Particulier';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string;
}

export interface WeatherData {
  temp: number;
  humidity: number;
  condition: string;
  locationName: string;
}

export interface PlantResult {
  commonName: string;
  africanNames: string[];
  scientificName: string;
  isWeed: boolean;
  isDisease: boolean;
  diseaseSymptoms?: string;
  benefits: string;
  drawbacks: string;
  soilType: string;
  healthImpact: {
    advantages: string;
    disadvantages: string;
  };
  eradicationMethod: {
    biological: string;
    mechanical: string;
    chemical: string;
  };
  description: string;
  timestamp?: number;
}

export interface HistoryItem extends PlantResult {
  id: string;
  image: string;
  timestamp: number;
}

export interface DraftItem {
  id: string;
  image: string;
  weather?: WeatherData;
  coords?: { lat: number; lng: number };
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: number;
  image?: string;
  isAI?: boolean;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export type Language = 'FR' | 'EN';
