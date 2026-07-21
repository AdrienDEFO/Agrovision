
import { GoogleGenAI, Type, GenerateContentParameters, Modality } from "@google/genai";
import { PlantResult, WeatherData } from "../types";

// Helper to retrieve all available API keys (system + local user backups)
export const getAvailableApiKeys = (): string[] => {
  const envKey = process.env.API_KEY || process.env.GEMINI_API_KEY || "";
  // Split by comma, semicolon or whitespace to support multiple keys in env
  const systemKeys = envKey.split(/[\s,;]+/).map(k => k.trim()).filter(Boolean);
  
  let userKeys: string[] = [];
  try {
    const saved = localStorage.getItem('agrovision_backup_keys');
    if (saved) {
      userKeys = JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error reading backup keys from storage", e);
  }
  
  const allKeys = [...systemKeys, ...userKeys];
  // Filter out duplicates and keep unique non-empty keys
  return Array.from(new Set(allKeys)).filter(Boolean);
};

// Soft state for current active key index to optimize subsequent calls and avoid known exhausted keys
let currentKeyIndex = 0;

function createAIClient(apiKey: string) {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

async function executeWithFallback(params: Omit<GenerateContentParameters, 'model'>) {
  const keys = getAvailableApiKeys();
  if (keys.length === 0) {
    throw new Error("Aucune clé API n'est configurée. Veuillez ajouter une clé API Gemini dans l'onglet Paramètres.");
  }

  // Set sequence of powerful models with free tiers to fallback and rotate
  const models = [
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3-flash-preview',
    'gemini-3-pro-preview'
  ];
  
  let lastError: any = null;

  for (const model of models) {
    // Try each available API key with the current model
    for (let attempts = 0; attempts < keys.length; attempts++) {
      const keyIndex = (currentKeyIndex + attempts) % keys.length;
      const activeKey = keys[keyIndex];
      const ai = createAIClient(activeKey);

      try {
        const response = await ai.models.generateContent({
          model,
          ...params,
        });

        // Lock in this key as starting index since it succeeded
        currentKeyIndex = keyIndex;
        return response;
      } catch (error: any) {
        lastError = error;
        console.warn(`Attempt failed with model ${model} (Key index: ${keyIndex}):`, error);
        
        // Expose credentials failure versus quota exhaustion
        const errorMsg = error?.message || "";
        const isQuota = error?.status === 429 || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota") || errorMsg.includes("Quota");
        
        if (isQuota) {
          // Soft backoff for quota rate-limiting
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
    }
  }

  // If we reach here, tell the user gracefully
  throw lastError || new Error("Épuisement de toutes les ressources d'analyse. Veuillez réessayer dans quelques minutes ou configurer des clés de secours.");
}

export const identifyPlant = async (
  base64Image: string, 
  weather?: WeatherData, 
  coords?: {lat: number, lng: number}
): Promise<PlantResult | null> => {
  const contextText = weather 
    ? `Contexte local: Temp ${weather.temp}°C, Humidité ${weather.humidity}%, Condition: ${weather.condition}. Localisation: ${coords?.lat}, ${coords?.lng}.`
    : "Contexte local inconnu.";

  try {
    const response = await executeWithFallback({
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: `Analyse cette image avec une précision d'expert agronome. ${contextText}
            En plus de l'identification, déduis le TYPE DE SOL probable d'après l'image et le contexte météo/géo.
            
            IMPORTANT DIRECTIVE : Sois extrêmement tolérant quant à la netteté, l'exposition ou le cadrage de la photo (flou, herbe coupée, mauvaise mise au point, etc.). En tant qu'expert bienveillant engagé pour la souveraineté alimentaire en Afrique, tu dois TOUJOURS faire de ton mieux pour identifier le plant, la mauvaise herbe ou l'adventice en analysant de petits détails (feuilles, tiges, ombre, sol) plutôt que de refuser l'analyse ou de dire que l'image n'est pas nette ou inutilisable. Donne TOUJOURS une réponse de diagnostic constructive avec une estimation intelligente.
            
            Structure JSON :
            {
              "commonName": "Nom",
              "africanNames": ["nom1"],
              "scientificName": "Nom latin",
              "isWeed": boolean,
              "isDisease": boolean,
              "diseaseSymptoms": "si applicable",
              "benefits": "Description riche",
              "drawbacks": "Inconvénients",
              "soilType": "Type de sol détecté (ex: Sablonneux, Latéritique, etc.)",
              "healthImpact": {"advantages": "...", "disadvantages": "..."},
              "eradicationMethod": {"biological": "...", "mechanical": "...", "chemical": "..."},
              "description": "..."
            }`
          }
        ]
      },
      config: { responseMimeType: "application/json" }
    });

    const text = response.text;
    if (!text) throw new Error("Réponse vide de l'IA");
    return JSON.parse(text) as PlantResult;
  } catch (error) {
    console.error("AI Error:", error);
    throw error;
  }
};

// Intégration Live API pour l'Appel Expert IA
export const connectToExpertIA = async (onAudioChunk: (base64: string) => void, onInterrupted: () => void) => {
  const keys = getAvailableApiKeys();
  const apiKey = keys[currentKeyIndex] || process.env.API_KEY || "";
  const ai = createAIClient(apiKey);
  
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks: {
      onopen: () => console.log("IA Expert Connecté"),
      onmessage: async (message) => {
        const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (audio) onAudioChunk(audio);
        if (message.serverContent?.interrupted) onInterrupted();
      },
      onerror: (e) => console.error("Expert IA Error", e),
      onclose: () => console.log("Expert IA Déconnecté"),
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      systemInstruction: "Tu es un expert agronome africain senior. Tu parles avec sagesse et précision. Aide l'agriculteur par la voix."
    }
  });
};

export const chatWithAI = async (message: string, history: any[]) => {
  try {
    const response = await executeWithFallback({
      contents: [
        { role: 'user', parts: [{ text: "Expert agronome africain." }] },
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ]
    });
    return response.text;
  } catch (error: any) {
    return `Service temporairement indisponible ou limite de quota atteinte. (${error?.message || error})`;
  }
};

export const analyzeClimateAdaptation = async (
  locationName: string,
  lat: number,
  lon: number,
  climateImpact: string,
  historicalData: { year: number; ws2mMin: number }[],
  language: string
): Promise<string> => {
  const dataString = historicalData.map(d => `Année ${d.year}: min vent ${d.ws2mMin}m/s`).join(', ');
  const prompt = language === 'FR' 
    ? `En tant qu'expert en climatologie agricole et agronomie pour la souveraineté alimentaire en Afrique centrale (Cameroun, Centrafrique), rédige un diagnostic d'adaptation agricole face au changement climatique pour le secteur suivant :
       Lieu: ${locationName} (Latitude: ${lat}, Longitude: ${lon})
       Impact local observé: ${climateImpact}
       Historique vent minimum de surface (NASA/POWER) : ${dataString}

       Rédige un rapport synthétique, concret et extrêmement pratique contenant :
       1. ANALYSE DE LA TENDANCE (comment la sécheresse de l'air est affectée par les sautes de vent minimum).
       2. CALENDRIER CULTURAL ADAPTIF recommandé pour les cultures locales (manioc, sorgho, maïs, plantain, cacao ou café selon le biome).
       3. 3 ACTIONS AGROÉCOLOGIQUES prioritaires d'urgence face au réchauffement global (ex: agriculture sous ombrage forestier, rotation, paillage).`
    : `As an agricultural climatologist and senior agronomist specializing in Central African farming systems, write an agricultural climate adaptation report for the following location:
       Location: ${locationName} (Latitude: ${lat}, Longitude: ${lon})
       Observed local climate impact: ${climateImpact}
       Historical wind speed minimums from NASA POWER dataset: ${dataString}

       Write a highly practical, structured report containing:
       1. CLIMATE TREND ANALYSIS (especially how minimum wind speed shifts affect soil humidity and moisture stress).
       2. RECOMMENDED ADAPTIVE PLANTING CALENDAR to sync with erratic rainfall.
       3. 3 ESSENTIAL AGROECOLOGICAL ACTIONS for this specific environment.`;

  try {
    const response = await executeWithFallback({
      contents: {
        parts: [
          { text: prompt }
        ]
      }
    });
    return response.text || "";
  } catch (error: any) {
    throw error;
  }
};

export const generateHarvestPredictionReport = async (
  crop: string,
  area: number,
  areaUnit: string,
  irrigation: string,
  fertilizer: string,
  weather: string,
  soilData: any,
  locationName: string,
  language: 'FR' | 'EN'
): Promise<string> => {
  const isFr = language === 'FR';
  const soilInfo = `pH: ${soilData.ph}, Matière Organique: ${soilData.organicMatter}%, NPK: ${soilData.npk.n}-${soilData.npk.p}-${soilData.npk.k}mg/kg`;
  
  const prompt = isFr
    ? `En tant qu'agronome expert spécialisé en Afrique Centrale (Cameroun, Centrafrique), rédige une analyse agronomique sur mesure pour aider l'agriculteur de ${locationName} suite à sa simulation de récolte :
       
       PROFIL DU CHAMP :
       - Culture : ${crop}
       - Superficie : ${area} ${areaUnit}
       - Irrigation : ${irrigation === 'rainfed' ? 'Pluvial uniquement (dépend des pluies)' : irrigation === 'moderate' ? 'Irrigation d\'appoint' : 'Irrigation complète et optimisée'}
       - Fertilisation : ${fertilizer === 'none' ? 'Aucune (culture naturelle brute)' : fertilizer === 'organic' ? 'Compost / Amendement organique naturel' : fertilizer === 'chemical' ? 'Engrais chimique de synthèse (NPK)' : 'Mixte (organo-minérale)'}
       - Météo observée : ${weather === 'dry' ? 'Sécheresse / Déficit pluvial' : weather === 'normal' ? 'Saison normale' : 'Pluies excédentaires'}
       - Sol local : ${soilInfo}
       
       Écris un rapport extrêmement pratique et structuré en français (max 250-300 mots) :
       1. SYNTHÈSE DE FAISABILITÉ : Valide l'adéquation de la culture avec le sol (pH: ${soilData.ph}) et les nutriments locaux.
       2. RECOMMANDATIONS DE PROTECTION & ENGRAIS : Suggère des amendements naturels ou des bio-pesticides en fonction du profil choisi.
       3. CONSEIL WATER-SMART : Propose une technique d'économie d'eau adaptée (paillage, goutte-à-goutte artisanal, demi-lunes, etc.).
       Reste encourageant, humble, scientifique et utilise des techniques agroécologiques adaptées à l'Afrique sub-saharienne.`
    : `As an expert agronomist specialized in Central African agriculture (Cameroon, Central African Republic), write a custom agronomic report to guide a farmer in ${locationName} based on their yield simulation setup:
       
       FIELD PROFILE:
       - Crop: ${crop}
       - Field Area: ${area} ${areaUnit}
       - Irrigation: ${irrigation}
       - Fertilization: ${fertilizer}
       - Observed Weather: ${weather}
       - Local Soil conditions: ${soilInfo}
       
       Write a highly practical, structured advice report in English (max 250-300 words):
       1. CROP-SOIL MATCHING: Check compatibility of this crop with soil pH (pH: ${soilData.ph}) and current NPK.
       2. NUTRIENT & PROTECTION STEPS: Recommend organic inputs, compost tea, or bio-pest controls based on selections.
       3. WATER-SMART ADVICE: Recommend water preservation techniques (mulching, organic cover, micro-catchment, zai pits).
       Keep it encouraging, scientifically precise, and tailored to low-input sub-Saharan agroecological contexts.`;

  try {
    const response = await executeWithFallback({
      contents: {
        parts: [
          { text: prompt }
        ]
      }
    });
    return response.text || "";
  } catch (error: any) {
    throw error;
  }
};

