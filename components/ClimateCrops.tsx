
import React, { useState, useEffect } from 'react';
import { LOCATION_PROFILES, LocationProfile, getClosestProfile } from '../data/climateData';
import { analyzeClimateAdaptation, generateHarvestPredictionReport } from '../services/gemini';
import { useApp } from '../App';

const generateOfflineReport = (profile: LocationProfile, language: 'FR' | 'EN'): string => {
  const isSelectedFr = language === 'FR';
  const name = isSelectedFr ? profile.nameFr : profile.nameEn;
  const zone = isSelectedFr ? profile.zoneTypeFr : profile.zoneTypeEn;
  
  if (isSelectedFr) {
    return `[RAPPORT D'URGENCE CLIMATIQUE AGROVISION - HORS-LIGNE]
    Diagnostic local pour la lisière forestière de ${name} :
    
    1. DIAGNOSTIC HYDRIQUE DU SOL
    Le sol de type ${zone} subit des sécheresses précoces. La couche arable (0-10cm) souffre d'un déficit hydrique chronique de -${(profile.soilData.moistureProfile[0].historical - profile.soilData.moistureProfile[0].current)}% par rapport aux baselines historiques décennales de la zone. Cette faible humidité superficielle ralentit le démarrage des semences de début de saison (Maïs, Sorgho).
    
    2. ANALYSE CHIMIQUE ET NUTRITIVE (pH: ${profile.soilData.ph})
    La teneur en Matière Organique est mesurée à ${profile.soilData.organicMatter}%, ce qui limite l'action tampon naturelle des sols ferralitiques acides. Les nutriments essentiels (Azote: ${profile.soilData.npk.n}mg/kg, Phosphore: ${profile.soilData.npk.p}mg/kg, Potassium: ${profile.soilData.npk.k}mg/kg) indiquent un lessivage marqué. Un apport de compost organique par paillage continu est recommandé.
    
    3. PLAN CULTURAL DE RÉSISTANCE RECOMMANDÉ
    - Semis de début de cycle : Décaler le calendrier traditionnel de 15 jours tardivement pour s'ajuster à la stabilisation des pluies réelles de mousson.
    - Évitement des vents desséchants : Planter des rangées d'arbres protecteurs (Moringa/Filao) sur le flanc Nord-Est pour couper l'impact de l'Harmattan et des vents turbulents.
    - Association agroécologique prioritaire : Planter le manioc en interligne avec du niébé (légumineuse rampante couvrant le sol et fixant l'azote atmosphérique).`;
  } else {
    return `[AGROVISION CLIMATE RESILIENCE REPORT - OFFLINE EMERGENCY PROFILE]
    Local Assessment for ${name} region:
    
    1. SOIL HYDRIC DIAGNOSTIC
    The local ${zone} soil suffers from early baking. Top layer (0-10cm) is experiencing a severe -${(profile.soilData.moistureProfile[0].historical - profile.soilData.moistureProfile[0].current)}% moisture deficit compared to historical baselines. This topsoil dry-out arrests root expansion of young cocoa trees and maize seedlings.
    
    2. NUTRIENT AND ACIDITY HEALTH (pH: ${profile.soilData.ph})
    Organic Matter stands at ${profile.soilData.organicMatter}%, offering limited natural carbon-sequestering action. Macro-nutrients (N: ${profile.soilData.npk.n}mg/kg, P: ${profile.soilData.npk.p}mg/kg, K: ${profile.soilData.npk.k}mg/kg) show mild depletion due to atmospheric leaching and intensive monoculture.
    
    3. PRIORITY ADAPTIVE AGROECOLOGICAL ACTIONS
    - Shift sowing schedule forward by 2-3 weeks to avoid late-season rain cliffs.
    - Keep continuous ground mulch covering to lower evaporation rates during mid-season dry spells.`;
  }
};

const CROP_CALENDARS: Record<string, {
  nameFr: string;
  nameEn: string;
  months: number[]; // 12 numbers: 0 (Repos), 1 (Préparation), 2 (Semis/Plantation), 3 (Entretien), 4 (Récolte)
  notesFr: string;
  notesEn: string;
}> = {
  'Manioc': {
    nameFr: 'Manioc',
    nameEn: 'Cassava',
    months: [4, 4, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4],
    notesFr: "Cycle long (10-12 mois). Préfère un semis hâtif en mars/avril dès le retour des pluies pour optimiser le rendement.",
    notesEn: "Long cycle (10-12 months). Prefers early sowing in March/April as soon as the rains return to optimize yield."
  },
  'Sorgho': {
    nameFr: 'Sorgho',
    nameEn: 'Sorghum',
    months: [0, 0, 0, 0, 1, 2, 3, 3, 3, 3, 4, 4],
    notesFr: "Plante robuste. Semis en juin au début de la mousson consolidée. Récolte sèche en novembre/décembre.",
    notesEn: "Robust crop. Sown in June at the start of consolidated monsoon. Harvested dry in November/December."
  },
  'Cacao': {
    nameFr: 'Cacao',
    nameEn: 'Cocoa',
    months: [3, 3, 1, 2, 2, 4, 4, 3, 3, 4, 4, 4],
    notesFr: "Culture pérenne. Plantation des jeunes plants sous ombrage en avril/mai. Grosses récoltes d'octobre à décembre.",
    notesEn: "Perennial crop. Young plants transplanted under shade in April/May. Major harvesting occurs from October to December."
  },
  'Maïs': {
    nameFr: 'Maïs',
    nameEn: 'Maize',
    months: [0, 1, 2, 3, 3, 4, 4, 1, 2, 3, 3, 4],
    notesFr: "Système bimodal à deux récoltes par an. Semis prioritaires en mars et septembre.",
    notesEn: "Bimodal system with two harvests per year. Priority sowing in March and September."
  },
  'Café': {
    nameFr: 'Café',
    nameEn: 'Coffee',
    months: [4, 3, 1, 2, 2, 3, 3, 3, 3, 3, 4, 4],
    notesFr: "Plantation des caféiers en avril/mai. La récolte des cerises s'étale de novembre à janvier.",
    notesEn: "Coffee transplanting in April/May. Berry harvesting spreads from November to January."
  },
  'Arachides': {
    nameFr: 'Arachides',
    nameEn: 'Peanuts',
    months: [0, 1, 2, 3, 3, 4, 4, 1, 2, 3, 3, 4],
    notesFr: "Double cycle annuel. Semis en mars et septembre. Réclame un sol bien drainé pour éviter la pourriture des gousses.",
    notesEn: "Double annual cycle. Sown in March and September. Demands well-drained soil to avoid pod rot."
  },
  'Niébé': {
    nameFr: 'Niébé',
    nameEn: 'Cowpea',
    months: [0, 1, 2, 3, 4, 0, 0, 1, 2, 3, 4, 0],
    notesFr: "Cycle court (60-90 jours). Plante de couverture idéale s'intercalant en avril ou septembre pour enrichir le sol en azote.",
    notesEn: "Short cycle (60-90 days). Ideal cover crop planted in April or September to enrich the soil with nitrogen."
  },
  'Banane': {
    nameFr: 'Banane Plantain',
    nameEn: 'Plantain',
    months: [4, 4, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4],
    notesFr: "Plantation des rejets en début de grande saison des pluies (mars/avril). Récolte après 9 à 12 mois.",
    notesEn: "Planting of suckers at the start of the major rainy season (March/April). Harvesting occurs after 9 to 12 months."
  }
};

const getCalendarForCrop = (cropName: string) => {
  const keys = Object.keys(CROP_CALENDARS);
  const matchedKey = keys.find(k => cropName.toLowerCase().includes(k.toLowerCase()));
  return matchedKey ? CROP_CALENDARS[matchedKey] : null;
};

const PREDICTION_CROPS: Record<string, {
  nameFr: string;
  nameEn: string;
  baseYield: number; // tons/ha
  optimalPh: [number, number];
  marketPrice: number; // FCFA / kg
  growthMonths: number;
  notesFr: string;
  notesEn: string;
}> = {
  'Manioc': {
    nameFr: 'Manioc',
    nameEn: 'Cassava',
    baseYield: 12.5,
    optimalPh: [5.0, 6.5],
    marketPrice: 150,
    growthMonths: 11,
    notesFr: "Le Manioc tolère des sols très acides (pH 5.0) et résiste au stress hydrique, mais un bon paillage organique décuple la tubérisation.",
    notesEn: "Cassava tolerates highly acidic soils (pH 5.0) and stands dry spells well, but heavy organic mulching boosts tuber development."
  },
  'Sorgho': {
    nameFr: 'Sorgho',
    nameEn: 'Sorghum',
    baseYield: 1.8,
    optimalPh: [5.5, 7.5],
    marketPrice: 250,
    growthMonths: 5,
    notesFr: "Le Sorgho s'adapte aux climats arides. Il est sensible à la stagnation de l'eau mais résiste magnifiquement aux hausses thermiques.",
    notesEn: "Sorghum adapts well to arid environments. It is sensitive to stagnant water but holds beautifully against heat waves."
  },
  'Cacao': {
    nameFr: 'Cacao',
    nameEn: 'Cocoa',
    baseYield: 0.85,
    optimalPh: [6.0, 7.0],
    marketPrice: 1500,
    growthMonths: 12,
    notesFr: "Le Cacaoyer exige un sol humifère, modérément acide, et surtout un ombrage permanent contre les brûlures de l'Harmattan.",
    notesEn: "Cacao tree demands high organic-matter soil, moderate acidity, and permanent agroforestry shading from drying winds."
  },
  'Maïs': {
    nameFr: 'Maïs',
    nameEn: 'Maize',
    baseYield: 3.5,
    optimalPh: [5.5, 7.0],
    marketPrice: 220,
    growthMonths: 4,
    notesFr: "Le Maïs est gourmand en azote. Le manque d'humidité ou de potassium au stade de l'épi réduit drastiquement les grains.",
    notesEn: "Maize has high nitrogen feeding requirements. Drought or low potassium during silking cuts grain counts heavily."
  },
  'Café': {
    nameFr: 'Café Robusta',
    nameEn: 'Robusta Coffee',
    baseYield: 1.1,
    optimalPh: [5.2, 6.5],
    marketPrice: 1200,
    growthMonths: 12,
    notesFr: "Le Café robusta préfère les sols semi-ombragés de transition forestière. Sensible aux sauts d'humidité de l'air.",
    notesEn: "Robusta coffee favors semi-shaded forest soils. Highly sensitive to abrupt atmospheric relative humidity drops."
  },
  'Arachides': {
    nameFr: 'Arachides',
    nameEn: 'Groundnuts',
    baseYield: 1.4,
    optimalPh: [5.8, 6.8],
    marketPrice: 450,
    growthMonths: 4,
    notesFr: "L'Arachide demande un sol léger et meuble pour faciliter l'ancrage des gousses. Redoute la pourriture par pluies tardives.",
    notesEn: "Groundnuts require well-drained, loose sandy-loam soils to peg pods. Highly susceptible to rot during late rainy seasons."
  },
  'Niébé': {
    nameFr: 'Niébé',
    nameEn: 'Cowpea',
    baseYield: 1.0,
    optimalPh: [5.5, 6.8],
    marketPrice: 350,
    growthMonths: 3,
    notesFr: "Le Niébé est l'allié idéal : il fixe l'azote atmosphérique et couvre le sol, évitant l'érosion hydrique de surface.",
    notesEn: "Cowpea is the perfect alley crop: it fixes atmospheric nitrogen and blankets the soil, preventing surface sheet erosion."
  },
  'Banane': {
    nameFr: 'Banane Plantain',
    nameEn: 'Plantain Banana',
    baseYield: 14.0,
    optimalPh: [5.5, 6.5],
    marketPrice: 200,
    growthMonths: 10,
    notesFr: "La Banane plantain réclame énormément d'eau et d'amendement organique. Vulnérable aux microrafales dues aux orages.",
    notesEn: "Plantain banana is highly water-demanding and needs continuous compost feeds. Susceptible to wind toppling from storms."
  }
};

const getPredictionCropData = (cropName: string) => {
  const keys = Object.keys(PREDICTION_CROPS);
  const matchedKey = keys.find(k => cropName.toLowerCase().includes(k.toLowerCase())) || 'Maïs';
  return PREDICTION_CROPS[matchedKey];
};

interface AgroAlert {
  type: 'weather' | 'epidemic';
  severity: 'high' | 'moderate' | 'low';
  titleFr: string;
  titleEn: string;
  descFr: string;
  descEn: string;
  actionPlanFr: string[];
  actionPlanEn: string[];
  icon: string;
}

const REGIONAL_ALERTS: Record<string, AgroAlert[]> = {
  'bertoua': [
    {
      type: 'weather',
      severity: 'moderate',
      titleFr: 'Vigilance Sécheresse de Transition',
      titleEn: 'Transition Drought Alert',
      descFr: 'Déficit pluviométrique de -25% constaté sur les 30 derniers jours, augmentant le stress hydrique de la couche arable.',
      descEn: '-25% rainfall deficit recorded over the last 30 days, increasing topsoil hydric stress.',
      actionPlanFr: [
        'Installer un paillage épais (10-15cm) au pied des cultures pour bloquer l\'évaporation.',
        'Privilégier l\'irrigation ciblée tôt le matin ou au crépuscule.',
        'Éviter tout apport d\'engrais azoté synthétique non dissous qui brûlerait les racines.'
      ],
      actionPlanEn: [
        'Apply a thick mulch (10-15cm) around plants to arrest evaporation.',
        'Prioritize micro-irrigation early in the morning or at twilight.',
        'Avoid applying undissolved synthetic nitrogen fertilizers to prevent root burn.'
      ],
      icon: 'fa-solid fa-droplet-slash text-amber-500'
    },
    {
      type: 'epidemic',
      severity: 'high',
      titleFr: 'Alerte Épidémie : Mosaïque Africaine du Manioc (CMD)',
      titleEn: 'Epidemic: Cassava Mosaic Disease (CMD)',
      descFr: 'Forte prolifération de mouches blanches (Bemisia tabaci) vectrices détectée dans les parcelles voisines.',
      descEn: 'High proliferation of whitefly vectors (Bemisia tabaci) detected in adjacent agricultural zones.',
      actionPlanFr: [
        'Éliminer et brûler immédiatement les plants présentant des feuilles rabougries ou gaufrées.',
        'Utiliser impérativement des boutures saines certifiées résistantes pour les futurs semis.',
        'Appliquer une décoction d\'huile de neem pour repousser les populations de mouches blanches.'
      ],
      actionPlanEn: [
        'Uproot and burn immediately any plants displaying stunted or blistered leaves.',
        'Always use certified disease-free resistant cuttings for future sowing cycles.',
        'Apply neem oil extracts as a natural repellent to suppress whitefly vectors.'
      ],
      icon: 'fa-solid fa-virus-covid text-red-650 animate-pulse'
    }
  ],
  'garoua_boulai': [
    {
      type: 'weather',
      severity: 'high',
      titleFr: 'Alerte Canicule & Harmattan Desséchant',
      titleEn: 'Heatwave & Drying Harmattan Alert',
      descFr: 'Températures supérieures de +4°C aux moyennes saisonnières combinées à un vent du nord-est à forte capacité d\'érosion.',
      descEn: 'Temperatures +4°C above seasonal averages coupled with high-speed north-easterly drying winds.',
      actionPlanFr: [
        'Activer les brise-vents de lisière (Moringa/Filao) pour ralentir la vitesse du vent sec.',
        'Pratiquer le binage régulier du sol pour rompre la croûte de battance et limiter la remontée capillaire.',
        'Protéger les jeunes semis sous ombrage artificiel ou branchages.'
      ],
      actionPlanEn: [
        'Deploy perimeter windbreaks (Moringa/Leucaena) to slow dry wind speed.',
        'Hoe the topsoil regularly to break the hard crust and minimize capillary water loss.',
        'Shade young seedlings with palm leaves or temporary structures.'
      ],
      icon: 'fa-solid fa-temperature-high text-red-650 animate-pulse'
    },
    {
      type: 'epidemic',
      severity: 'high',
      titleFr: 'Invasion active : Chenille Légionnaire d\'Automne',
      titleEn: 'Active Outbreak: Fall Armyworm (FAW)',
      descFr: 'Invasion massive de chenilles (Spodoptera frugiperda) touchant les jeunes plants de sorgho et de maïs.',
      descEn: 'Massive caterpillar outbreaks (Spodoptera frugiperda) attacking young sorghum and maize crops.',
      actionPlanFr: [
        'Inspecter quotidiennement le cornet des graminées (maïs, sorgho) pour détecter les perforations.',
        'Appliquer du sable fin ou de la cendre de bois tamisée dans le cornet pour asphyxier les larves.',
        'Utiliser des bio-pesticides à base de Bacillus thuringiensis ou décoctions pimentées en cas d\'attaque sévère.'
      ],
      actionPlanEn: [
        'Inspect maize and sorghum whorls daily for pinhole damage and fecal pellets.',
        'Drop clean dry sand or sieved wood ash directly into whorls to suffocate larvae.',
        'Apply bio-pesticides based on Bacillus thuringiensis or pepper-and-soap decoctions.'
      ],
      icon: 'fa-solid fa-bug text-red-650 animate-bounce'
    }
  ],
  'berberati': [
    {
      type: 'weather',
      severity: 'moderate',
      titleFr: 'Risque de Microrafales & Orages de Lisière',
      titleEn: 'Severe Thunderstorms & Micro-gust Risk',
      descFr: 'Formation de cellules orageuses locales très intenses risquant de causer des dégâts mécaniques sur les cultures à grandes feuilles.',
      descEn: 'Local formation of highly energetic thunderstorm cells with violent wind gusts threatening banana plantains.',
      actionPlanFr: [
        'Hauberner ou tuteurer solidement les bananiers plantains lourdement chargés de régimes.',
        'S\'assurer de la bonne évacuation des canaux de drainage pour éviter l\'ennoyage des racines.',
        'Élaguer les branches mortes des grands arbres d\'ombrage pour éviter leur chute.'
      ],
      actionPlanEn: [
        'Prop up heavily loaded banana plantains with sturdy wooden stakes or ropes.',
        'Clear drainage pathways and ditches to eliminate standing water and root asphyxia.',
        'Prune dead limbs from tall canopy shade-trees to prevent branches from falling.'
      ],
      icon: 'fa-solid fa-cloud-bolt text-amber-500 animate-pulse'
    },
    {
      type: 'epidemic',
      severity: 'high',
      titleFr: 'Alerte Cryptogamique : Pourriture Brune des Cabosses',
      titleEn: 'Fungal Outbreak: Cocoa Black Pod Rot',
      descFr: 'Conditions d\'humidité stagnante favorisant la propagation ultra-rapide du champignon Phytophthora palmivora.',
      descEn: 'Stagnant high-humidity conditions accelerating Phytophthora palmivora fungus transmission in cacao blocks.',
      actionPlanFr: [
        'Récolter et éliminer impérativement toutes les cabosses pourries ou momifiées de l\'arbre.',
        'Éclaircir le feuillage du cacaoyer et éliminer les herbes hautes pour faciliter la circulation de l\'air.',
        'Appliquer un traitement fongicide à base de cuivre bio-compatible en insistant sur les troncs.'
      ],
      actionPlanEn: [
        'Harvest and destroy every single rotten or mummified pod on the tree.',
        'Prune cacao branches and clear high weeds to improve sub-canopy air circulation.',
        'Apply copper-based bio-compatible fungicide targeting trunks and main branches.'
      ],
      icon: 'fa-solid fa-bacteria text-red-650 animate-pulse'
    }
  ]
};

const DEFAULT_ALERTS: AgroAlert[] = [
  {
    type: 'weather',
    severity: 'low',
    titleFr: 'Vigilance Météo Saisonnière Normale',
    titleEn: 'Normal Seasonal Weather',
    descFr: 'Conditions climatiques saisonnières conformes aux moyennes décennales historiques.',
    descEn: 'Seasonal climatic conditions conform to decadal historical baselines.',
    actionPlanFr: [
      'Poursuivre le paillage régulier pour optimiser les réserves d\'eau du sol.',
      'Suivre les prévisions hebdomadaires locales.'
    ],
    actionPlanEn: [
      'Continue regular soil mulching to optimize soil moisture reserves.',
      'Track weekly local meteorological forecasts.'
    ],
    icon: 'fa-solid fa-cloud text-slate-400'
  }
];

const ClimateCrops: React.FC = () => {
  const { showToast, language, isOffline, setIsOffline } = useApp();
  const [selectedProfile, setSelectedProfile] = useState<LocationProfile>(LOCATION_PROFILES[0]);
  const [useGps, setUseGps] = useState(false);
  const [aiReport, setAiReport] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'resilient' | 'moderate' | 'threatened'>('all');
  const [selectedCropForCalendar, setSelectedCropForCalendar] = useState<string>('');
  const [selectedHorizon, setSelectedHorizon] = useState<number>(0);
  const [expandedAlertIdx, setExpandedAlertIdx] = useState<number | null>(null);

  // Sub-tabs navigation state
  const [subTab, setSubTab] = useState<'climate' | 'prediction' | 'tools'>('climate');

  // New states for interactive visual dashboard & offline history
  const [vizView, setVizView] = useState<'horizons' | 'nutrients' | 'compare'>('horizons');
  const [selectedCompareMetric, setSelectedCompareMetric] = useState<'ph' | 'organicMatter' | 'clay' | 'sand'>('ph');
  const [offlineProgress, setOfflineProgress] = useState<number>(0);
  const [offlineStepText, setOfflineStepText] = useState<string>('');
  const [offlinePredProgress, setOfflinePredProgress] = useState<number>(0);
  const [offlinePredStepText, setOfflinePredStepText] = useState<string>('');
  const [savedSimulations, setSavedSimulations] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('agrovision_saved_predictions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Harvest Prediction simulator state
  const [predCrop, setPredCrop] = useState<string>('Maïs');
  const [predArea, setPredArea] = useState<number>(1);
  const [predAreaUnit, setPredAreaUnit] = useState<'ha' | 'm2'>('ha');
  const [predIrrigation, setPredIrrigation] = useState<'rainfed' | 'moderate' | 'optimal'>('rainfed');
  const [predFertilizer, setPredFertilizer] = useState<'none' | 'organic' | 'chemical' | 'mixed'>('none');
  const [predWeather, setPredWeather] = useState<'dry' | 'normal' | 'wet'>('normal');
  const [predLoading, setPredLoading] = useState<boolean>(false);
  const [predReport, setPredReport] = useState<string>('');

  // Tools state
  const [toolType, setToolType] = useState<'spacing' | 'npk' | 'water'>('spacing');
  const [spacingCrop, setSpacingCrop] = useState<string>('Maïs');
  const [fieldArea, setFieldArea] = useState<number>(1);
  const [fieldAreaUnit, setFieldAreaUnit] = useState<'ha' | 'm2'>('ha');
  const [npkCrop, setNpkCrop] = useState<string>('Maïs');
  const [waterCrop, setWaterCrop] = useState<string>('Maïs');
  const [plantAgeWeeks, setPlantAgeWeeks] = useState<number>(4);

  useEffect(() => {
    if (selectedProfile && selectedProfile.crops.length > 0) {
      setSelectedCropForCalendar(selectedProfile.crops[0].name);
      // Synchronize default selection for tools and predictions
      const rawCropName = selectedProfile.crops[0].name.split(' (')[0];
      setPredCrop(rawCropName);
      setSpacingCrop(rawCropName);
      setNpkCrop(rawCropName);
      setWaterCrop(rawCropName);
    }
  }, [selectedProfile]);

  const handleExportCSV = () => {
    const isFr = language === 'FR';
    const profile = selectedProfile;
    const rows = [
      ["--- INFOS GENERALES ---"],
      ["Parametre", "Valeur"],
      ["Region ID", profile.id],
      ["Nom de la Region", isFr ? profile.nameFr : profile.nameEn],
      ["Type de Zone", isFr ? profile.zoneTypeFr : profile.zoneTypeEn],
      ["Description", isFr ? profile.climateImpactFr : profile.climateImpactEn],
      [],
      ["--- ANALYSE CHIMIQUE DU SOL ---"],
      ["pH du sol", profile.soilData.ph],
      ["Matiere Organique (%)", profile.soilData.organicMatter],
      ["Clay (%)", profile.soilData.composition.clay],
      ["Sand (%)", profile.soilData.composition.sand],
      ["Silt (%)", profile.soilData.composition.silt],
      ["N (mg/kg)", profile.soilData.npk.n],
      ["P (mg/kg)", profile.soilData.npk.p],
      ["K (mg/kg)", profile.soilData.npk.k],
      [],
      ["--- HUMIDITE DU SOL PAR PROFONDEUR ---"],
      ["Profondeur", "Actuel (%)", "Historique (%)"],
      ...profile.soilData.moistureProfile.map(p => [p.depth, p.current, p.historical]),
      [],
      ["--- HISTORIQUE DES VENTS (WS2M) ---"],
      ["Annee", "Vitesse de vent min (m/s)"],
      ...profile.historicalData.map(d => [d.year, d.ws2mMin]),
      [],
      ["--- CULTURES CONSEILLEES ---"],
      ["Nom", "Categorie", "Description", "Conseil d'adaptation"],
      ...profile.crops.map(c => [c.name, c.category, c.description, c.adaptationTip])
    ];

    const csvContent = rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `agrovision_data_${profile.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(
      isFr ? "Données locales exportées avec succès en CSV !" : "Local data successfully exported to CSV!",
      "success"
    );
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prof = LOCATION_PROFILES.find(p => p.id === e.target.value);
    if (prof) {
      setSelectedProfile(prof);
      setAiReport('');
      setUseGps(false);
    }
  };

  const handleGpsSync = () => {
    if (navigator.geolocation) {
      setLoadingAI(true);
      showToast(
        language === 'FR' ? "Recherche de coordonnées..." : "Searching coordinates...",
        "info"
      );
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const closest = getClosestProfile(lat, lon);
          setSelectedProfile(closest);
          setUseGps(true);
          setAiReport('');
          setLoadingAI(false);
          showToast(
            language === 'FR' 
              ? `Position détectée ! Profil le plus proche : ${closest.nameFr}` 
              : `Position detected! Closest profile: ${closest.nameEn}`,
            "success"
          );
        },
        (err) => {
          setLoadingAI(false);
          showToast(
            language === 'FR' ? "Géolocalisation refusée ou indisponible." : "Geolocation denied or unavailable.",
            "info"
          );
        }
      );
    } else {
      showToast("Géolocalisation non supportée par votre navigateur.", "error");
    }
  };

  const handleGenerateAIReport = async () => {
    setLoadingAI(true);
    setAiReport('');
    setOfflineProgress(0);
    setOfflineStepText('');

    if (isOffline) {
      const isFr = language === 'FR';
      const steps = isFr ? [
        "Lecture du profil géologique régional...",
        "Calcul du stress thermique d'été...",
        "Analyse du déficit d'eau de surface...",
        "Compilation de l'almanach d'adaptation..."
      ] : [
        "Reading regional geological profile...",
        "Calculating summer thermal stress...",
        "Analyzing topsoil moisture deficit...",
        "Compiling offline adaptation almanac..."
      ];

      let currentStep = 0;
      setOfflineStepText(steps[0]);
      setOfflineProgress(10);
      
      const interval = setInterval(() => {
        currentStep++;
        if (currentStep < steps.length) {
          setOfflineProgress(Math.round((currentStep / steps.length) * 100));
          setOfflineStepText(steps[currentStep]);
        } else {
          clearInterval(interval);
          const report = generateOfflineReport(selectedProfile, language);
          setAiReport(report);
          setOfflineProgress(100);
          setOfflineStepText('');
          setLoadingAI(false);
          showToast(
            isFr ? "Rapport d'adaptation local compilé !" : "Local adaptation report compiled!",
            "success"
          );
        }
      }, 700); // Progresses beautifully over ~2.8s
      return;
    }

    try {
      const report = await analyzeClimateAdaptation(
        language === 'FR' ? selectedProfile.nameFr : selectedProfile.nameEn,
        selectedProfile.lat,
        selectedProfile.lon,
        language === 'FR' ? selectedProfile.climateImpactFr : selectedProfile.climateImpactEn,
        selectedProfile.historicalData,
        language
      );
      setAiReport(report);
      showToast(
        language === 'FR' ? "Rapport d'adaptation IA généré !" : "AI adaptation report generated!",
        "success"
      );
    } catch (err: any) {
      console.error(err);
      showToast(
        language === 'FR' ? "Erreur de génération du rapport IA." : "Failed to generate AI report.",
        "error"
      );
    } finally {
      setLoadingAI(false);
    }
  };

  // Filtrage des cultures
  const filteredCrops = selectedProfile.crops.filter(crop => {
    if (activeFilter === 'all') return true;
    return crop.category === activeFilter;
  });

  // Rendu de l'historique de vitesse du vent dans un graphe SVG personnalisé
  const renderSvgChart = () => {
    const data = selectedProfile.historicalData;
    const values = data.map(d => d.ws2mMin);
    const maxVal = Math.max(...values, 0.05); // évite division par 0
    const minVal = Math.min(...values);

    const width = 360;
    const height = 160;
    const padding = 30;

    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data.map((d, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = height - padding - ((d.ws2mMin - minVal) / (maxVal - minVal || 1)) * chartHeight;
      return { x, y, value: d.ws2mMin, year: d.year };
    });

    const pathData = points
      .map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    return (
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {language === 'FR' ? "MINIMUM VENT DE SURFACE (WS2M_MIN) - NASA POWER" : "MINIMUM SURFACE WIND SPEED (WS2M_MIN) - NASA POWER"}
          </p>
          <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">
            1985 - 2025
          </span>
        </div>
        <div className="relative">
          <svg className="w-full h-auto max-h-[160px]" viewBox={`0 0 ${width} ${height}`}>
            {/* Gridlines horizontales */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = padding + ratio * chartHeight;
              const valueLabel = (maxVal - ratio * (maxVal - minVal)).toFixed(3);
              return (
                <g key={i} className="opacity-10">
                  <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#047857" strokeDasharray="3,3" />
                  <text x={padding - 5} y={y + 3} textAnchor="end" fontSize="7" fill="#0f172a" fontWeight="bold">
                    {valueLabel}
                  </text>
                </g>
              );
            })}

            {/* Path de la courbe */}
            <path
              d={pathData}
              fill="none"
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-in fade-in duration-1000"
            />

            {/* Gradient sous la courbe */}
            <path
              d={`${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
              fill="url(#chartGrad)"
              className="opacity-30"
            />

            {/* Points du graphe */}
            {points.map((p, i) => (
              <g key={i} className="group cursor-pointer">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="#ffffff"
                  stroke="#059669"
                  strokeWidth="2"
                  className="transition-all duration-300 hover:r-6"
                />
                {/* Libellé de l'année en abscisses */}
                <text x={p.x} y={height - 8} textAnchor="middle" fontSize="6.5" fill="#475569" fontWeight="bold">
                  {p.year}
                </text>
                {/* Tooltip mini valeur de vent au hover */}
                <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="7.5" fill="#047857" fontWeight="black" className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-emerald-50">
                  {p.value.toFixed(3)} m/s
                </text>
              </g>
            ))}

            {/* Définitions des dégradés */}
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <p className="text-[9px] text-slate-400 mt-2 italic leading-snug">
          {language === 'FR' 
            ? "L'allongement et l'irrégularité des variations temporelles indiquent un dérèglement régional de la circulation atmosphérique affectant les sols." 
            : "The erratic temporal variations indicate regional shifts in low-altitude trade wind speeds, affecting local soil drought levels."
          }
        </p>
      </div>
    );
  };

  const renderVigilanceCenter = () => {
    const isFr = language === 'FR';
    const alerts = REGIONAL_ALERTS[selectedProfile.id] || DEFAULT_ALERTS;

    return (
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation text-amber-500 animate-bounce"></i>
            {isFr ? "Centre de Vigilance & Alerte" : "Vigilance & Alert Center"}
          </h3>
          <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
            {alerts.length} {isFr ? "ALERTES ACTIVES" : "ACTIVE ALERTS"}
          </span>
        </div>

        <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
          {isFr
            ? "Météo en direct et surveillance phytosanitaire pour la région sélectionnée :"
            : "Real-time agro-meteo and phytosanitary warnings active in this district:"
          }
        </p>

        <div className="space-y-3">
          {alerts.map((alert, idx) => {
            const isExpanded = expandedAlertIdx === idx;
            const isHigh = alert.severity === 'high';
            const isMod = alert.severity === 'moderate';
            
            const bgClass = isHigh 
              ? 'bg-rose-50/70 border-rose-100 text-rose-950' 
              : isMod 
                ? 'bg-amber-50/50 border-amber-100 text-amber-950' 
                : 'bg-slate-50/80 border-slate-150 text-slate-900';
            
            const badgeClass = isHigh
              ? 'bg-rose-600 text-white'
              : isMod
                ? 'bg-amber-500 text-white'
                : 'bg-slate-400 text-white';

            return (
              <div 
                key={idx} 
                className={`rounded-3xl border p-4.5 transition-all duration-300 ${bgClass} ${
                  isExpanded ? 'shadow-md ring-1 ring-amber-400/30' : 'hover:scale-[1.005]'
                }`}
              >
                <div 
                  className="flex items-start justify-between gap-3 cursor-pointer"
                  onClick={() => setExpandedAlertIdx(isExpanded ? null : idx)}
                >
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-white/80 shadow-xs flex items-center justify-center shrink-0 mt-0.5">
                      <i className={`${alert.icon} text-sm`}></i>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[7.5px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${badgeClass}`}>
                          {alert.type === 'weather' 
                            ? (isFr ? 'METEO' : 'WEATHER') 
                            : (isFr ? 'EPIDEMIE' : 'EPIDEMIC')
                          }
                        </span>
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                          {isFr ? 'Vigilance' : 'Severity'}: {alert.severity}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-900 mt-1.5 leading-snug">
                        {isFr ? alert.titleFr : alert.titleEn}
                      </h4>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-xl bg-white/40 flex items-center justify-center shrink-0 mt-1 text-slate-500 hover:text-slate-700">
                    <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-[10px] transition-transform`}></i>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-3.5 border-t border-slate-200/40 space-y-3.5 animate-in slide-in-from-top-2 duration-200">
                    <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                      {isFr ? alert.descFr : alert.descEn}
                    </p>

                    <div className="bg-white/85 p-3.5 rounded-2xl border border-slate-200/40 space-y-2">
                      <span className="text-[8px] font-black text-rose-700 uppercase tracking-widest flex items-center gap-1.5">
                        <i className="fa-solid fa-shield-halved"></i>
                        {isFr ? "Plan d'Adaptation & Biosécurité :" : "Biosecurity & Adaptation Guidelines:"}
                      </span>
                      <ul className="space-y-1.5 text-[10.5px] text-slate-700 font-bold leading-normal">
                        {(isFr ? alert.actionPlanFr : alert.actionPlanEn).map((action, actionIdx) => (
                          <li key={actionIdx} className="flex items-start gap-2">
                            <span className="text-emerald-600 mt-0.5 shrink-0">✔</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          showToast(
                            isFr 
                              ? `Alerte de vigilance propagée aux coopératives de ${selectedProfile.nameFr} !`
                              : `Climatic caution dispatch spread to the ${selectedProfile.nameEn} farmer community!`,
                            "success"
                          );
                        }}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                      >
                        <i className="fa-solid fa-share-nodes"></i>
                        {isFr ? "Partager aux Coopératives" : "Broadcast to Cooperatives"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSoilCharts = () => {
    const soil = selectedProfile.soilData;
    const isFr = language === 'FR';

    // Secondary sub-tab selection for visuals
    const renderVisualTabs = () => {
      return (
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 border border-slate-200/50 mb-5">
          <button
            onClick={() => setVizView('horizons')}
            className={`flex-1 py-2 text-center rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1 ${
              vizView === 'horizons'
                ? 'bg-slate-850 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <i className="fa-solid fa-layer-group"></i>
            <span>{isFr ? 'Horizons Sol' : 'Soil Horizons'}</span>
          </button>
          <button
            onClick={() => setVizView('nutrients')}
            className={`flex-1 py-2 text-center rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1 ${
              vizView === 'nutrients'
                ? 'bg-slate-850 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <i className="fa-solid fa-flask"></i>
            <span>{isFr ? 'Équilibre NPK' : 'NPK Balance'}</span>
          </button>
          <button
            onClick={() => setVizView('compare')}
            className={`flex-1 py-2 text-center rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1 ${
              vizView === 'compare'
                ? 'bg-slate-850 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <i className="fa-solid fa-chart-simple"></i>
            <span>{isFr ? 'Comparateur' : 'Benchmark'}</span>
          </button>
        </div>
      );
    };

    // Sub-view 1: Soil Horizons explorer & moisture comparison
    const renderHorizonsView = () => {
      const moistureData = soil.moistureProfile;
      const width = 340;
      const height = 130;
      const padding = 25;
      const chartWidth = width - padding * 2;
      const chartHeight = height - padding * 2;

      return (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Coupe interactive des Horizons du sol */}
          <div className="space-y-3">
            <p className="font-extrabold text-slate-400 uppercase tracking-wider text-[9px]">
              {isFr ? "EXPLORATEUR PHYSIQUE VERTICAL DES HORIZONS" : "INTERACTIVE HORIZONS SELECTOR"}
            </p>
            
            <div className="flex flex-col rounded-3xl overflow-hidden border border-slate-250 shadow-inner bg-slate-100 relative">
              {/* Horizon A */}
              <button 
                onClick={() => setSelectedHorizon(0)}
                className={`py-3.5 relative transition-all duration-200 flex flex-col justify-center px-5 border-b-2 border-emerald-650 text-left text-white ${
                  selectedHorizon === 0 
                    ? 'bg-amber-950 ring-4 ring-emerald-500 ring-inset z-10 scale-[1.01]' 
                    : 'bg-stone-900 opacity-80 hover:opacity-95'
                }`}
              >
                <div className="absolute top-0 inset-x-0 h-0.5 bg-emerald-400 animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                  Horizon A : {isFr ? "Surface (0-10cm)" : "Topsoil (0-10cm)"}
                </span>
                <span className="text-[7px] opacity-75 font-bold truncate mt-0.5">
                  {isFr ? "Humus actif & litière de feuilles protectrice" : "Organic Humus & active biosecurity shield"}
                </span>
              </button>

              {/* Horizon B */}
              <button 
                onClick={() => setSelectedHorizon(1)}
                className={`py-3.5 transition-all duration-200 flex flex-col justify-center px-5 border-b border-stone-800 text-left text-white ${
                  selectedHorizon === 1 
                    ? 'bg-amber-850 ring-4 ring-emerald-500 ring-inset z-10 scale-[1.01]' 
                    : 'bg-orange-950 opacity-80 hover:opacity-95'
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-450 shrink-0"></span>
                  Horizon B : {isFr ? "Accumulation (10-40cm)" : "Subsoil (10-40cm)"}
                </span>
                <span className="text-[7px] opacity-75 font-bold truncate mt-0.5">
                  {isFr ? "Argiles fines compactes stockant l'eau" : "Dense iron-rich clays conserving moisture"}
                </span>
              </button>

              {/* Horizon C */}
              <button 
                onClick={() => setSelectedHorizon(2)}
                className={`py-3.5 transition-all duration-200 flex flex-col justify-center px-5 text-left text-white ${
                  selectedHorizon === 2 
                    ? 'bg-amber-700 ring-4 ring-emerald-500 ring-inset z-10 scale-[1.01]' 
                    : 'bg-amber-900 opacity-80 hover:opacity-95'
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300 shrink-0"></span>
                  Horizon C : {isFr ? "Substratum (40-100cm)" : "Bedrock (40-100cm)"}
                </span>
                <span className="text-[7px] opacity-75 font-bold truncate mt-0.5">
                  {isFr ? "Fragments rocheux drainant par gravité" : "Weathered bedrock providing rapid drainage"}
                </span>
              </button>
            </div>

            {/* Détails de l'Horizon sélectionné */}
            {(() => {
              const layer = moistureData[selectedHorizon] || { depth: 'N/A', current: 0, historical: 0 };
              const diff = layer.historical - layer.current;
              
              const horizonDetails = [
                {
                  titleFr: "Horizon A - Couche Humifère Active",
                  titleEn: "Horizon A - Active Humiferous Topsoil",
                  textureFr: "Limon sablo-argileux fertile enrichi en racines vivantes",
                  textureEn: "Fertile sandy-clay loam enriched with active roots",
                  phAdviceFr: "Zone privilégiée pour les jeunes plantules. Idéal pour les cultures maraîchères, sorgho et maïs.",
                  phAdviceEn: "Privileged nursery bed. Ideal for vegetable crops, sorghum and maize.",
                  tipsFr: "Préférer un paillage lourd continu plutôt qu'un labour agressif qui détruirait le réseau racinaire fin.",
                  tipsEn: "Apply rich permanent crop mulching instead of aggressive tillage to save fragile fungal networks."
                },
                {
                  titleFr: "Horizon B - Zone d'Accumulation Minérale",
                  titleEn: "Horizon B - Mineral Accretion Layer",
                  textureFr: "Argile latéritique compacte à forte rétention",
                  textureEn: "Dense lateritic clay with high hydro-retention",
                  phAdviceFr: "Zone de réserve d'eau primordiale durant les phases de sécheresse saisonnière de transition.",
                  phAdviceEn: "Vital hydric buffer during seasonal dry spells and transitional droughts.",
                  tipsFr: "Favoriser des plantes à racines pivots profondes (ex: Coton, Niébé, Gombo) pour rompre l'accumulation.",
                  tipsEn: "Deploy deep-root taproot systems (e.g., Cowpea, Okra) to naturally break subterranean compaction."
                },
                {
                  titleFr: "Horizon C - Matrice Parentale / Roche-mère",
                  titleEn: "Horizon C - Altered Parent Rock Substratum",
                  textureFr: "Quartz grossier, nodules ferro-alumineux et saprolite",
                  textureEn: "Coarse quartz gravel, iron-alumina nodules & saprolite",
                  phAdviceFr: "Filtre naturel guidant l'excédent hydrique vers les nappes phréatiques de surface.",
                  phAdviceEn: "Natural physical filter routing excessive water to regional aquifers.",
                  tipsFr: "Surveiller l'érosion pluviale des horizons supérieurs pour éviter la dénudation définitive de la roche.",
                  tipsEn: "Ensure strong canopy block cover to stop sheet erosion from exposing barren gravel beds."
                }
              ];

              const currentDetails = horizonDetails[selectedHorizon] || horizonDetails[0];

              return (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3.5 animate-in fade-in duration-200">
                  <div className="flex justify-between items-start gap-2 border-b border-slate-200/50 pb-2 flex-wrap">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">
                        {isFr ? currentDetails.titleFr : currentDetails.titleEn}
                      </h4>
                      <p className="text-[8.5px] text-slate-400 font-bold mt-0.5">
                        {isFr ? `Épaisseur active : ${layer.depth}` : `Active depth: ${layer.depth}`}
                      </p>
                    </div>
                    <span className="text-[8px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md shrink-0 uppercase tracking-widest">
                      -{diff}% {isFr ? "d'eau (vs hist.)" : "water (vs hist.)"}
                    </span>
                  </div>

                  {/* Propriétés */}
                  <div className="space-y-2 text-[10px] font-semibold text-slate-650 leading-relaxed pl-0.5">
                    <p>
                      <strong>{isFr ? "Composition" : "Texture Composition"}:</strong> {isFr ? currentDetails.textureFr : currentDetails.textureEn}
                    </p>
                    <p>
                      <strong>{isFr ? "Dynamique racinaire" : "Root dynamics"}:</strong> {isFr ? currentDetails.phAdviceFr : currentDetails.phAdviceEn}
                    </p>
                    <p className="text-emerald-800 bg-emerald-50/50 rounded-2xl p-3 border border-emerald-100/50">
                      <strong>💡 {isFr ? "Conseil de gestion" : "Management Tip"}:</strong> {isFr ? currentDetails.tipsFr : currentDetails.tipsEn}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Interactive Dual-axis Soil Moisture Comparison Bar Chart (SVG) */}
          <div className="bg-slate-50/55 p-4 rounded-3xl border border-slate-150 space-y-2.5">
            <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <span>{isFr ? "Humidité : Actuelle vs Historique (%)" : "Moisture: Current vs Historical (%)"}</span>
              <span className="flex items-center gap-2">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-sm"></span>{isFr ? "Actuel" : "Current"}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-slate-350 rounded-sm"></span>{isFr ? "Hist." : "Hist."}</span>
              </span>
            </div>

            <div className="bg-white/80 p-2.5 rounded-2xl border border-slate-150/40">
              <svg className="w-full h-auto max-h-[130px]" viewBox={`0 0 ${width} ${height}`}>
                {/* Y-Axis Gridlines */}
                {[0, 25, 50, 75, 100].map((val, i) => {
                  const y = padding + (1 - val / 100) * chartHeight;
                  return (
                    <g key={i} className="opacity-20">
                      <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#475569" strokeDasharray="3,3" strokeWidth="0.8" />
                      <text x={padding - 5} y={y + 3} textAnchor="end" fontSize="7" fill="#0f172a" fontWeight="bold">{val}%</text>
                    </g>
                  );
                })}

                {/* SVG Comparative Bars */}
                {moistureData.map((item, idx) => {
                  const groupWidth = 80;
                  const xGroup = padding + idx * groupWidth + (chartWidth - moistureData.length * groupWidth) / 2 + 10;
                  const barWidth = 18;

                  const yCurrent = padding + (1 - item.current / 100) * chartHeight;
                  const hCurrent = (item.current / 100) * chartHeight;

                  const yHistorical = padding + (1 - item.historical / 100) * chartHeight;
                  const hHistorical = (item.historical / 100) * chartHeight;

                  return (
                    <g key={idx} className="group">
                      {/* Historical bar */}
                      <rect
                        x={xGroup}
                        y={yHistorical}
                        width={barWidth}
                        height={hHistorical}
                        fill="#cbd5e1"
                        rx="3"
                        className="transition-all duration-300"
                      />
                      {/* Current active bar */}
                      <rect
                        x={xGroup + 6}
                        y={yCurrent}
                        width={barWidth}
                        height={hCurrent}
                        fill="#3b82f6"
                        rx="3"
                        className="transition-all duration-300"
                      />

                      {/* Values label above bars */}
                      <text x={xGroup + 9} y={yCurrent - 4} textAnchor="middle" fontSize="6.5" fill="#1d4ed8" fontWeight="black">
                        {item.current}%
                      </text>
                      <text x={xGroup - 3} y={yHistorical - 4} textAnchor="middle" fontSize="6" fill="#475569" fontWeight="bold">
                        {item.historical}%
                      </text>

                      {/* X axis labels */}
                      <text x={xGroup + 12} y={height - 5} textAnchor="middle" fontSize="7.5" fill="#334155" fontWeight="extrabold">
                        {item.depth}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Texture Triangulaire Bar */}
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-150/60 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                {isFr ? "PROPORTION DU TYPE DE TEXTURE DU SOL" : "SOIL TEXTURE PARINGS"}
              </span>
              <span className="text-[8.5px] font-black text-slate-800 bg-slate-200/50 px-2 py-0.5 rounded-lg text-center">
                 {selectedProfile.zoneTypeFr.includes("Forêt") ? (isFr ? "Ferralsol Humifère" : "Organic Ferralsol") : (isFr ? "Sol Rougi Ferralitique" : "Leached Ferralsol")}
              </span>
            </div>

            <div className="h-4.5 w-full rounded-xl overflow-hidden flex text-[8.5px] font-black text-white text-center">
              <div 
                style={{ width: `${soil.composition.clay}%` }} 
                className="bg-emerald-650 flex items-center justify-center transition-all duration-500"
                title={`Clay: ${soil.composition.clay}%`}
              >
                {isFr ? "Argile" : "Clay"} {soil.composition.clay}%
              </div>
              <div 
                style={{ width: `${soil.composition.sand}%` }} 
                className="bg-amber-500 flex items-center justify-center transition-all duration-500"
                title={`Sand: ${soil.composition.sand}%`}
              >
                {isFr ? "Sable" : "Sand"} {soil.composition.sand}%
              </div>
              <div 
                style={{ width: `${soil.composition.silt}%` }} 
                className="bg-indigo-500 flex items-center justify-center transition-all duration-500"
                title={`Silt: ${soil.composition.silt}%`}
              >
                {isFr ? "Limon" : "Silt"} {soil.composition.silt}%
              </div>
            </div>

            <div className="flex gap-4 text-[7.5px] font-extrabold text-slate-500 uppercase tracking-wide justify-center pt-1.5 border-t border-slate-200/50">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> {isFr ? "Lourd (Rétention d'eau élevée)" : "Clay (Dense, Water holding)"}</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-550"></span> {isFr ? "Léger (Drainage rapide)" : "Sand (Dry, Aerated)"}</span>
            </div>
          </div>
        </div>
      );
    };

    // Sub-view 2: Nutrient Balance Budgets (N-P-K & pH target comparison)
    const renderNutrientsView = () => {
      const targets = { n: 60, p: 22, k: 65 }; // general optimal crop targets
      const nutrients = [
        { key: 'N', name: isFr ? 'Azote' : 'Nitrogen', value: soil.npk.n, target: targets.n, color: 'bg-emerald-600', text: 'text-emerald-700', bg: 'bg-emerald-50' },
        { key: 'P', name: isFr ? 'Phosphore' : 'Phosphorus', value: soil.npk.p, target: targets.p, color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
        { key: 'K', name: isFr ? 'Potassium' : 'Potassium', value: soil.npk.k, target: targets.k, color: 'bg-indigo-600', text: 'text-indigo-700', bg: 'bg-indigo-50' }
      ];

      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Soil Acidity / pH Dial gauge */}
          <div className="space-y-3 bg-slate-50/50 p-4 rounded-3xl border border-slate-150">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[9px]">
                {isFr ? "INDICATEUR D'ACIDITÉ ET PH DU SOL" : "SOIL ACIDITY GAUGE"}
              </span>
              <span className="font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-xl text-[10.5px]">
                pH {soil.ph} ({soil.ph < 5.5 ? (isFr ? 'Fortement acide' : 'Strongly Acidic') : soil.ph < 6.0 ? (isFr ? 'Modérément acide' : 'Moderately Acidic') : (isFr ? 'Sub-Neutre' : 'Sub-neutral')})
              </span>
            </div>
            
            <div className="relative pt-2 pb-1">
              <div className="h-2 w-full rounded-full bg-gradient-to-r from-red-400 via-amber-350 via-emerald-400 to-blue-500"></div>
              {(() => {
                const percentage = Math.max(0, Math.min(100, ((soil.ph - 4) / 4) * 100));
                return (
                  <div 
                    className="absolute top-0 -mt-1 w-4 h-4 bg-slate-950 border-2 border-white rounded-full shadow-md flex items-center justify-center transition-all duration-500"
                    style={{ left: `calc(${percentage}% - 8px)` }}
                  >
                    <div className="w-1 h-1 bg-emerald-400 rounded-full animate-ping"></div>
                  </div>
                );
              })()}
              <div className="flex justify-between text-[7.5px] text-slate-400 font-bold pt-1.5 uppercase tracking-wider">
                <span>pH 4.0 ({isFr ? "Acide" : "Acidic"})</span>
                <span>pH 6.0</span>
                <span>pH 7.0 ({isFr ? "Neutre" : "Neutral"})</span>
                <span>pH 8.0</span>
              </div>
            </div>
          </div>

          {/* N-P-K comparison progress gauges */}
          <div className="space-y-5">
            <p className="font-extrabold text-slate-400 uppercase tracking-wider text-[9px]">
              {isFr ? "BILAN CHIMIQUE DÉTAILLÉ N-P-K (MG/KG)" : "NPK MACRONUTRIENTS BUDGET (MG/KG)"}
            </p>

            <div className="space-y-4">
              {nutrients.map(nut => {
                const limit = nut.target * 1.5;
                const ratio = Math.min(100, (nut.value / limit) * 100);
                const targetRatio = (nut.target / limit) * 100;
                const percentOfTarget = ((nut.value / nut.target) * 100).toFixed(0);

                return (
                  <div key={nut.key} className="space-y-1.5 bg-slate-50/45 p-3.5 rounded-2xl border border-slate-150/50">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${nut.color}`}></span>
                        {nut.key} - {nut.name}
                      </span>
                      <span className="text-slate-900 bg-white border border-slate-150 px-2 py-0.5 rounded-lg text-[9.5px]">
                        {nut.value} / {nut.target} mg/kg
                      </span>
                    </div>

                    <div className="h-3.5 bg-slate-200 rounded-full relative overflow-visible">
                      {/* Current amount color bar */}
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${nut.color} opacity-85`}
                        style={{ width: `${ratio}%` }}
                      ></div>
                      {/* Target bar slider flag */}
                      <div 
                        className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-rose-600 z-10"
                        style={{ left: `${targetRatio}%` }}
                      >
                        <div className="absolute bottom-full mb-1 bg-rose-600 text-white text-[6.5px] px-1 py-0.5 rounded -translate-x-1/2 whitespace-nowrap font-black uppercase tracking-wider">
                          {isFr ? "Cible" : "Target"}: {nut.target}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[8px] font-black uppercase mt-1">
                      <span className={nut.value >= nut.target ? "text-emerald-700" : "text-amber-700"}>
                        {nut.value >= nut.target ? (isFr ? "✅ Suffisance chimique" : "✅ Chemical sufficiency") : (isFr ? "⚠️ Léger déficit" : "⚠️ Low deficiency")}
                      </span>
                      <span className="text-slate-400 font-bold">
                        {percentOfTarget}% {isFr ? "de la cible" : "of target"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    };

    // Sub-view 3: Regional comparative benchmarking chart across all 5 profiles
    const renderCompareView = () => {
      const metricsInfo = {
        ph: { labelFr: 'pH du sol', labelEn: 'Soil pH', min: 4.5, max: 7.0, suffix: '', icon: 'fa-vial' },
        organicMatter: { labelFr: 'Matière Organique (%)', labelEn: 'Organic Matter (%)', min: 1.0, max: 5.0, suffix: '%', icon: 'fa-leaf' },
        clay: { labelFr: 'Argile (%)', labelEn: 'Clay content (%)', min: 10, max: 60, suffix: '%', icon: 'fa-cubes' },
        sand: { labelFr: 'Sable (%)', labelEn: 'Sand content (%)', min: 10, max: 60, suffix: '%', icon: 'fa-mountain' }
      };

      const currentMetricInfo = metricsInfo[selectedCompareMetric];
      
      const benchmarkData = LOCATION_PROFILES.map(prof => {
        let value = 0;
        if (selectedCompareMetric === 'ph') value = prof.soilData.ph;
        else if (selectedCompareMetric === 'organicMatter') value = prof.soilData.organicMatter;
        else if (selectedCompareMetric === 'clay') value = prof.soilData.composition.clay;
        else if (selectedCompareMetric === 'sand') value = prof.soilData.composition.sand;
        
        return {
          id: prof.id,
          name: isFr ? prof.nameFr.split(' (')[0] : prof.nameEn.split(' (')[0],
          value: value,
          isCurrent: prof.id === selectedProfile.id
        };
      });

      const values = benchmarkData.map(d => d.value);
      const maxVal = Math.max(...values, 1) * 1.1;

      const width = 340;
      const height = 150;
      const padding = 30;
      const chartWidth = width - padding * 2;
      const chartHeight = height - padding * 2;

      return (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Buttons to switch metric */}
          <div className="grid grid-cols-4 gap-1 pb-1">
            {(Object.keys(metricsInfo) as Array<keyof typeof metricsInfo>).map(metricKey => {
              const isActive = selectedCompareMetric === metricKey;
              const info = metricsInfo[metricKey];
              return (
                <button
                  key={metricKey}
                  onClick={() => setSelectedCompareMetric(metricKey)}
                  className={`py-1.5 px-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider text-center transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:text-slate-700 border border-slate-200'
                  }`}
                >
                  {isFr ? info.labelFr.split(' (')[0] : info.labelEn.split(' (')[0]}
                </button>
              );
            })}
          </div>

          <p className="text-[9.5px] text-slate-500 font-bold leading-normal">
            {isFr 
              ? `Analyse comparative du [${currentMetricInfo.labelFr}] sur l'ensemble de notre réseau d'almanach agricole.`
              : `Cross-checking [${currentMetricInfo.labelEn}] across all districts in our offline database.`}
          </p>

          {/* SVG Comparative Bar Chart */}
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-150">
            <svg className="w-full h-auto max-h-[150px]" viewBox={`0 0 ${width} ${height}`}>
              {/* Y Axis grids */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = padding + (1 - ratio) * chartHeight;
                const labelValue = (ratio * maxVal).toFixed(selectedCompareMetric === 'ph' || selectedCompareMetric === 'organicMatter' ? 1 : 0);
                return (
                  <g key={i} className="opacity-15">
                    <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#475569" strokeDasharray="3,3" strokeWidth="0.8" />
                    <text x={padding - 5} y={y + 3} textAnchor="end" fontSize="6.5" fill="#0f172a" fontWeight="bold">
                      {labelValue}{currentMetricInfo.suffix}
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {benchmarkData.map((d, idx) => {
                const barWidth = 20;
                const barSpacing = (chartWidth - (benchmarkData.length * barWidth)) / (benchmarkData.length + 1);
                const x = padding + barSpacing + idx * (barWidth + barSpacing);
                const y = padding + (1 - d.value / maxVal) * chartHeight;
                const h = (d.value / maxVal) * chartHeight;

                const color = d.isCurrent ? '#10b981' : '#64748b'; // Green highlight for selected profile
                const weight = d.isCurrent ? 'black' : 'bold';

                return (
                  <g key={d.id} className="group">
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={h}
                      fill={color}
                      rx="3"
                      className="transition-all duration-300 group-hover:opacity-90"
                    />
                    
                    {/* Value above bar */}
                    <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" fontSize="7" fill={d.isCurrent ? '#047857' : '#475569'} fontWeight="black">
                      {d.value.toFixed(selectedCompareMetric === 'ph' || selectedCompareMetric === 'organicMatter' ? 1 : 0)}{currentMetricInfo.suffix}
                    </text>

                    {/* X axis district name label */}
                    <text x={x + barWidth / 2} y={height - 5} textAnchor="middle" fontSize="6.5" fill={d.isCurrent ? '#0f172a' : '#64748b'} fontWeight={weight}>
                      {d.name.substring(0, 9)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      );
    };

    return (
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-5">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <i className="fa-solid fa-seedling text-emerald-650 animate-pulse"></i>
            {isFr ? "Diagnostic de Sol & Visualisations" : "Soil Health & Visual Analytics"}
          </h3>
          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {isFr ? "Données Visuelles" : "Live Visuals"}
          </span>
        </div>

        {renderVisualTabs()}

        {/* Dynamic sub-view router */}
        {vizView === 'horizons' && renderHorizonsView()}
        {vizView === 'nutrients' && renderNutrientsView()}
        {vizView === 'compare' && renderCompareView()}
      </div>
    );
  };

  const renderSowingCalendar = () => {
    const isFr = language === 'FR';
    const crops = selectedProfile.crops;
    
    // Find the currently selected crop's calendar details
    const activeCropCal = getCalendarForCrop(selectedCropForCalendar);
    
    // Fallback if no matching calendar
    const calendar = activeCropCal || {
      nameFr: selectedCropForCalendar,
      nameEn: selectedCropForCalendar,
      months: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      notesFr: "Données de calendrier spécifiques non définies pour cette culture.",
      notesEn: "Specific calendar data not defined for this crop."
    };

    const monthLabels = isFr 
      ? ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Map phases to visual elements
    const getPhaseInfo = (phaseNum: number) => {
      switch (phaseNum) {
        case 1:
          return {
            label: isFr ? "Préparation" : "Preparation",
            colorClass: "bg-amber-450 text-white border-amber-500 shadow-sm",
            dotColor: "bg-amber-450",
            icon: "fa-solid fa-tractor"
          };
        case 2:
          return {
            label: isFr ? "Semis / Plant" : "Sowing / Plant",
            colorClass: "bg-emerald-600 text-white border-emerald-700 shadow-sm",
            dotColor: "bg-emerald-600",
            icon: "fa-solid fa-seedling"
          };
        case 3:
          return {
            label: isFr ? "Entretien" : "Maintenance",
            colorClass: "bg-indigo-500 text-white border-indigo-600 shadow-sm",
            dotColor: "bg-indigo-500",
            icon: "fa-solid fa-hand-holding-droplet"
          };
        case 4:
          return {
            label: isFr ? "Récolte" : "Harvesting",
            colorClass: "bg-orange-500 text-white border-orange-600 shadow-sm",
            dotColor: "bg-orange-500",
            icon: "fa-solid fa-wheat-awn"
          };
        default:
          return {
            label: isFr ? "Repos" : "Resting",
            colorClass: "bg-slate-100 text-slate-400 border-slate-200",
            dotColor: "bg-slate-400",
            icon: "fa-solid fa-snowflake opacity-20"
          };
      }
    };

    return (
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-5">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <i className="fa-solid fa-calendar-days text-emerald-600 animate-bounce"></i>
            {isFr ? "Calendrier de Semis & Cycles" : "Sowing & Planting Calendar"}
          </h3>
          <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider">
            {isFr ? "Bimodal" : "Bi-modal"}
          </span>
        </div>

        <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
          {isFr 
            ? "Sélectionnez une culture pour visualiser son calendrier cultural optimal :"
            : "Select a crop to display its optimal culture calendar:"
          }
        </p>

        {/* Pill buttons for crop selection */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {crops.map((crop, idx) => {
            const isSelected = crop.name === selectedCropForCalendar;
            return (
              <button
                key={idx}
                onClick={() => setSelectedCropForCalendar(crop.name)}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 duration-200 transition-all ${
                  isSelected 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'bg-slate-50 text-slate-500 hover:text-slate-700 border border-slate-150'
                }`}
              >
                {crop.name.split(' (')[0]}
              </button>
            );
          })}
        </div>

        {/* 12 Months timeline grid */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          {monthLabels.map((month, i) => {
            const phase = calendar.months[i];
            const phaseInfo = getPhaseInfo(phase);
            return (
              <div 
                key={i} 
                className={`p-2 rounded-2xl border flex flex-col items-center text-center transition-all duration-300 ${phaseInfo.colorClass}`}
              >
                <span className="text-[8.5px] font-black uppercase tracking-widest opacity-80 leading-none">
                  {month}
                </span>
                <div className="w-5 h-5 flex items-center justify-center my-1.5 bg-white/15 rounded-lg">
                  <i className={`${phaseInfo.icon} text-[10px]`}></i>
                </div>
                <span className="text-[7.5px] font-black leading-tight tracking-tighter truncate w-full">
                  {phaseInfo.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[8.5px] font-black text-slate-600 grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-450 shrink-0"></span>
            <span>🚜 {isFr ? "Préparation du sol" : "Soil preparation"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
            <span>🌱 {isFr ? "Semis / Plantation" : "Sowing / Planting"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
            <span>🌿 {isFr ? "Entretien" : "Maintenance"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
            <span>🌾 {isFr ? "Récolte" : "Harvesting"}</span>
          </div>
        </div>

        {/* Details & Tips */}
        <div className="bg-emerald-50/40 p-4 rounded-3xl border border-emerald-100/50 space-y-1.5">
          <div className="flex items-center gap-2 text-[10px] font-black text-emerald-800 uppercase tracking-wider">
            <i className="fa-solid fa-circle-info text-emerald-600"></i>
            <span>{isFr ? "Conseil de Cycle Optimal" : "Optimal Cycle Advice"}</span>
          </div>
          <p className="text-[11px] text-slate-650 leading-relaxed font-semibold">
            {isFr ? calendar.notesFr : calendar.notesEn}
          </p>
        </div>
      </div>
    );
  };

  const getPredictionMetrics = () => {
    const cropData = getPredictionCropData(predCrop);
    const soil = selectedProfile.soilData;

    // 1. pH Factor
    const ph = soil.ph;
    const [minPh, maxPh] = cropData.optimalPh;
    let phFactor = 1.0;
    if (ph < minPh) {
      phFactor = Math.max(0.65, 1.0 - (minPh - ph) * 0.3);
    } else if (ph > maxPh) {
      phFactor = Math.max(0.7, 1.0 - (ph - maxPh) * 0.2);
    }

    // 2. Irrigation & Water Factor
    // Local soil top layer moisture deficit
    const topMoisture = soil.moistureProfile[0];
    const moistureDeficit = (topMoisture.historical - topMoisture.current) / topMoisture.historical; // e.g., 0.20 for 20% deficit
    
    let waterFactor = 1.0;
    if (predIrrigation === 'rainfed') {
      // Heavily impacted by dry weather and existing deficit
      const baseLoss = moistureDeficit * 0.7; // up to 30% loss
      const weatherLoss = predWeather === 'dry' ? 0.25 : predWeather === 'wet' ? -0.05 : 0;
      waterFactor = Math.max(0.5, 1.0 - baseLoss - weatherLoss);
    } else if (predIrrigation === 'moderate') {
      const baseLoss = moistureDeficit * 0.2;
      const weatherLoss = predWeather === 'dry' ? 0.08 : predWeather === 'wet' ? -0.02 : 0;
      waterFactor = Math.max(0.8, 1.0 - baseLoss - weatherLoss);
    } else if (predIrrigation === 'optimal') {
      // Fully compensated moisture deficit, plus small premium
      waterFactor = 1.12;
    }

    // 3. Fertilization Factor
    let fertilizerFactor = 1.0;
    if (predFertilizer === 'none') {
      // Depleted NPK yields lower
      const avgNpk = (soil.npk.n + soil.npk.p + soil.npk.k) / 3;
      if (avgNpk < 40) {
        fertilizerFactor = 0.8;
      }
    } else if (predFertilizer === 'organic') {
      fertilizerFactor = 1.25; // Compost helps soil biology and water retention
    } else if (predFertilizer === 'chemical') {
      fertilizerFactor = 1.45; // Chemical NPK gives direct boost
    } else if (predFertilizer === 'mixed') {
      fertilizerFactor = 1.60; // Organo-mineral provides the absolute best of both worlds
    }

    // 4. Weather disease risk (e.g. wet weather causes fungal issues in cacao or groundnuts)
    let weatherFactor = 1.0;
    if (predWeather === 'wet') {
      if (predCrop.includes('Cacao') || predCrop.includes('Arachides')) {
        weatherFactor = 0.85; // Disease outbreaks
      } else {
        weatherFactor = 1.05; // Good for other crops
      }
    } else if (predWeather === 'dry') {
      if (predCrop.includes('Manioc') || predCrop.includes('Sorgho')) {
        weatherFactor = 0.95; // highly resilient
      } else {
        weatherFactor = 0.80; // dry hurts standard crops
      }
    }

    // Calculate Area multiplier
    const areaMultiplier = predAreaUnit === 'm2' ? predArea / 10000 : predArea;

    // Final Yield per Ha
    const yieldPerHa = cropData.baseYield * phFactor * waterFactor * fertilizerFactor * weatherFactor;
    const finalYieldTons = yieldPerHa * areaMultiplier;
    const finalValueFcfa = finalYieldTons * 1000 * cropData.marketPrice;

    return {
      phFactor,
      waterFactor,
      fertilizerFactor,
      weatherFactor,
      yieldPerHa,
      finalYieldTons,
      finalValueFcfa,
      cropData
    };
  };

  const handleGeneratePredictionReport = async () => {
    setPredLoading(true);
    setPredReport('');
    setOfflinePredProgress(0);
    setOfflinePredStepText('');

    const metrics = getPredictionMetrics();
    const isFr = language === 'FR';

    if (isOffline) {
      const steps = isFr ? [
        "Vérification de l'acidité (pH du sol)...",
        "Corrélation des indices d'irrigation locale...",
        "Analyse d'impact du stress météo...",
        "Calcul du rendement de récolte final..."
      ] : [
        "Verifying soil chemical pH...",
        "Correlating local irrigation indexes...",
        "Analyzing weather-stress impact...",
        "Calculating final simulated harvest yield..."
      ];

      let currentStep = 0;
      setOfflinePredStepText(steps[0]);
      setOfflinePredProgress(10);

      const interval = setInterval(() => {
        currentStep++;
        if (currentStep < steps.length) {
          setOfflinePredProgress(Math.round((currentStep / steps.length) * 100));
          setOfflinePredStepText(steps[currentStep]);
        } else {
          clearInterval(interval);
          const crop = isFr ? metrics.cropData.nameFr : metrics.cropData.nameEn;
          const report = isFr
            ? `[RAPPORT DE SIMULATION DE RÉCOLTE - AGROVISION DE SECOURS]
               
               Pour votre culture de ${crop} sur ${predArea} ${predAreaUnit} à ${selectedProfile.nameFr} :
               
               1. ANALYSE PHYSIQUE ET CHIMIQUE DU SOL (pH: ${selectedProfile.soilData.ph})
               La compatibilité du pH est de ${(metrics.phFactor * 100).toFixed(0)}%. Le sol de type "${selectedProfile.zoneTypeFr}" offre des conditions de drainage ${selectedProfile.soilData.composition.clay > 40 ? 'modérées par la densité argileuse' : 'rapides et filtrantes'}.
               
               2. DISPONIBILITÉ HYDRIQUE (Indice hydrique : ${(metrics.waterFactor * 100).toFixed(0)}%)
               Sous un climat "${predWeather === 'dry' ? 'Aride/Saison Sèche' : predWeather === 'wet' ? 'Humide/Mousson' : 'Saison Normale'}" et avec une irrigation "${predIrrigation === 'rainfed' ? 'Dépendante des pluies' : 'D\'appoint contrôlée'}", le stress hydrique est calculé à un niveau ${(100 - metrics.waterFactor * 100).toFixed(0)}%.
               
               3. ENGRAIS & RECOMMANDATIONS AGRONOMIQUES
               La stratégie de fertilisation "${predFertilizer === 'none' ? 'Aucune' : predFertilizer === 'organic' ? 'Biologique/Organique' : 'Synthétique NPK'}" suggère un apport recommandé d'azote de ${getNpkTarget(predCrop).n} kg/ha.`
            : `[AGROVISION CROP SIMULATION ADVISORY - SECURED OFFLINE SUMMARY]
               
               For your ${crop} crop on ${predArea} ${predAreaUnit} in ${selectedProfile.nameEn}:
               
               1. SOIL PHYSICAL ANALYSIS (pH: ${selectedProfile.soilData.ph})
               Soil suitability score is ${(metrics.phFactor * 100).toFixed(0)}%. The local "${selectedProfile.zoneTypeEn}" soil type provides ${selectedProfile.soilData.composition.clay > 40 ? 'high water retention' : 'sandy-loam high drainage'} profiles.
               
               2. HYDRATION AND IRRIGATION (Water factor: ${(metrics.waterFactor * 100).toFixed(0)}%)
               Using a "${predIrrigation}" irrigation framework, we expect a water stress factor of ${(100 - metrics.waterFactor * 100).toFixed(0)}% depending on seasonal dry spells.
               
               3. FERTILIZATION DIET
               For fertilizer choice "${predFertilizer}", an organic integration is highly advised to retain moisture in topsoil layers.`;

          setPredReport(report);
          setOfflinePredProgress(100);
          setOfflinePredStepText('');
          setPredLoading(false);
          showToast(
            isFr ? "Simulation hors-ligne compilée !" : "Offline simulation compiled!",
            "success"
          );
        }
      }, 650); // Progresses nicely over ~2.6s
      return;
    }

    try {
      const report = await generateHarvestPredictionReport(
        isFr ? metrics.cropData.nameFr : metrics.cropData.nameEn,
        predArea,
        predAreaUnit,
        predIrrigation,
        predFertilizer,
        predWeather,
        selectedProfile.soilData,
        isFr ? selectedProfile.nameFr : selectedProfile.nameEn,
        language
      );
      setPredReport(report);
      showToast(
        isFr ? "Rapport d'agronome IA généré avec succès !" : "AI Agronomist report successfully generated!",
        "success"
      );
    } catch (e: any) {
      console.error(e);
      showToast(
        isFr ? "Impossible de joindre le serveur expert IA. Mode secours hors-ligne appliqué." : "Could not reach AI expert. Secured offline report applied.",
        "info"
      );
      // Fallback
      const crop = isFr ? metrics.cropData.nameFr : metrics.cropData.nameEn;
      setPredReport(isFr ? `Erreur réseau ou quota épuisé. Rapport hors-ligne : \n- Culture : ${crop}\n- Rendement simulé : ${metrics.finalYieldTons.toFixed(2)} tonnes.` : `Network or quota limit reached. Offline summary:\n- Crop: ${crop}\n- Yield Simulated: ${metrics.finalYieldTons.toFixed(2)} tons.`);
    } finally {
      setPredLoading(false);
    }
  };

  const saveCurrentSimulation = () => {
    const metrics = getPredictionMetrics();
    const isFr = language === 'FR';
    const newSim = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: Date.now(),
      regionId: selectedProfile.id,
      regionName: isFr ? selectedProfile.nameFr : selectedProfile.nameEn,
      crop: predCrop,
      cropName: isFr ? metrics.cropData.nameFr : metrics.cropData.nameEn,
      area: predArea,
      areaUnit: predAreaUnit,
      irrigation: predIrrigation,
      fertilizer: predFertilizer,
      weather: predWeather,
      yieldTons: metrics.finalYieldTons,
      valueFcfa: metrics.finalValueFcfa,
      ph: selectedProfile.soilData.ph,
      phFactor: metrics.phFactor,
      isOfflineSim: isOffline
    };

    const updated = [newSim, ...savedSimulations];
    setSavedSimulations(updated);
    localStorage.setItem('agrovision_saved_predictions', JSON.stringify(updated));
    showToast(
      isFr ? "Simulation de récolte sauvegardée en local !" : "Harvest simulation saved locally!",
      "success"
    );
  };

  const deleteSimulation = (id: string) => {
    const updated = savedSimulations.filter(s => s.id !== id);
    setSavedSimulations(updated);
    localStorage.setItem('agrovision_saved_predictions', JSON.stringify(updated));
    showToast(
      language === 'FR' ? "Simulation supprimée." : "Simulation deleted.",
      "info"
    );
  };

  const renderPredictionTab = () => {
    const isFr = language === 'FR';
    const metrics = getPredictionMetrics();
    
    // SVG Prediction Curve
    const growthMonths = metrics.cropData.growthMonths;
    const width = 360;
    const height = 160;
    const padding = 30;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // 5 points along growth
    const points = [];
    for (let i = 0; i <= 4; i++) {
      const fraction = i / 4;
      const x = padding + fraction * chartWidth;
      // Growth sigmoid curve
      const baseGrowth = 1 / (1 + Math.exp(-6 * (fraction - 0.5)));
      const yValue = baseGrowth * metrics.finalYieldTons;
      const y = height - padding - (baseGrowth * chartHeight * 0.95);
      points.push({ x, y, value: yValue, stage: i });
    }
    const pathData = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    const stagesFr = ["Semis", "Levée", "Végétatif", "Floraison", "Maturation"];
    const stagesEn = ["Sowing", "Sprouting", "Vegetative", "Flowering", "Maturity"];

    return (
      <div className="space-y-6">
        {/* Simulator Settings Form */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <i className="fa-solid fa-sliders text-emerald-650 animate-pulse"></i>
              {isFr ? "Paramètres de Simulation" : "Simulation Parameters"}
            </h3>
            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {isFr ? "Modèle Prédictif" : "Predictive Model"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Sélection de la culture */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                {isFr ? "Culture à Simuler" : "Crop to Simulate"}
              </label>
              <select
                value={predCrop}
                onChange={(e) => setPredCrop(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                {Object.keys(PREDICTION_CROPS).map(cropKey => (
                  <option key={cropKey} value={cropKey}>
                    {isFr ? PREDICTION_CROPS[cropKey].nameFr : PREDICTION_CROPS[cropKey].nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Superficie de la parcelle */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                {isFr ? "Superficie de la Parcelle" : "Plot Surface Area"}
              </label>
              <div className="flex">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={predArea}
                  onChange={(e) => setPredArea(Math.max(0.1, parseFloat(e.target.value) || 1))}
                  className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-l-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
                <select
                  value={predAreaUnit}
                  onChange={(e: any) => setPredAreaUnit(e.target.value)}
                  className="bg-slate-200 border border-l-0 border-slate-200 rounded-r-xl px-3 text-xs font-black text-slate-700 focus:outline-none"
                >
                  <option value="ha">ha</option>
                  <option value="m2">m²</option>
                </select>
              </div>
            </div>

            {/* 3. Système d'Irrigation */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                {isFr ? "Type d'Irrigation" : "Irrigation Strategy"}
              </label>
              <select
                value={predIrrigation}
                onChange={(e: any) => setPredIrrigation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="rainfed">{isFr ? "Pluvial (dépendant de la pluie)" : "Rainfed (dependent on rain)"}</option>
                <option value="moderate">{isFr ? "Irrigation d'appoint" : "Moderate supplemental irrigation"}</option>
                <option value="optimal">{isFr ? "Irrigation contrôlée optimale" : "Optimal drip irrigation"}</option>
              </select>
            </div>

            {/* 4. Niveau d'intrants (Engrais) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                {isFr ? "Amendements & Fertilisation" : "Fertilizer Inputs"}
              </label>
              <select
                value={predFertilizer}
                onChange={(e: any) => setPredFertilizer(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="none">{isFr ? "Aucune (naturelle brute)" : "None (natural, zero additions)"}</option>
                <option value="organic">{isFr ? "Compost / Amendement organique" : "Organic compost / manure"}</option>
                <option value="chemical">{isFr ? "Engrais chimique de synthèse (NPK)" : "Synthetic Chemical NPK"}</option>
                <option value="mixed">{isFr ? "Mixte (compost + micro-NPK)" : "Mixed (organo-mineral)"}</option>
              </select>
            </div>

            {/* 5. Météo de la saison */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                {isFr ? "Climat Observé sur la Saison" : "Observed Season Weather"}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['dry', 'normal', 'wet'] as const).map(w => {
                  const isActive = predWeather === w;
                  const label = w === 'dry' ? (isFr ? 'Sécheresse' : 'Dry/Drought') : w === 'normal' ? (isFr ? 'Saison Normale' : 'Normal') : (isFr ? 'Humide' : 'Wet/Rainy');
                  const icon = w === 'dry' ? 'fa-sun text-amber-500' : w === 'normal' ? 'fa-cloud-sun text-emerald-500' : 'fa-cloud-showers-heavy text-blue-500';
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setPredWeather(w)}
                      className={`py-3 px-2 rounded-xl border text-[10px] font-black uppercase tracking-wider flex flex-col items-center gap-1 duration-200 transition-all ${
                        isActive
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <i className={`fa-solid ${icon} text-sm`}></i>
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Prediction Outputs Display */}
        <div className="bg-slate-900 text-white rounded-[2.5rem] p-6 shadow-xl space-y-6 relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>

          <div className="flex justify-between items-center pb-3 border-b border-white/10">
            <div>
              <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                {isFr ? "SIMULATION ACTIVE" : "LIVE SIMULATION RESULTS"}
              </span>
              <h4 className="font-black text-xs text-white uppercase tracking-wider mt-0.5">
                {isFr ? "Rendements & Valeurs Estimés" : "Estimated Yields & Values"}
              </h4>
            </div>
            <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
              {metrics.cropData.nameFr}
            </span>
          </div>

          {/* Core KPI metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{isFr ? "RENDEMENT TOTAL" : "TOTAL YIELD ESTIMATE"}</span>
                <p className="text-lg font-black text-emerald-400 mt-1">
                  {metrics.finalYieldTons.toFixed(2)} <span className="text-[10px] text-slate-300">tonnes</span>
                </p>
              </div>
              <p className="text-[9px] text-slate-450 mt-2 italic border-t border-white/5 pt-1.5">
                {isFr ? `Rendement : ${metrics.yieldPerHa.toFixed(2)} t/ha` : `Average: ${metrics.yieldPerHa.toFixed(2)} t/ha`}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{isFr ? "VALEUR MARCHANDE" : "ESTIMATED MARKET VALUE"}</span>
                <p className="text-lg font-black text-amber-400 mt-1">
                  {metrics.finalValueFcfa.toLocaleString()} <span className="text-[10px] text-slate-300">FCFA</span>
                </p>
              </div>
              <p className="text-[9px] text-slate-450 mt-2 italic border-t border-white/5 pt-1.5">
                {isFr ? `Prix : ${metrics.cropData.marketPrice} FCFA/kg` : `Rate: ${metrics.cropData.marketPrice} FCFA/kg`}
              </p>
            </div>
          </div>

          {/* Plant Growth Curve Graphic (SVG) */}
          <div className="space-y-3">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">
              {isFr ? "COURBE DE CROISSANCE SIMULÉE" : "SIMULATED GROWTH CURVE"}
            </span>
            <div className="bg-white/5 border border-white/5 rounded-3xl p-4">
              <svg className="w-full h-auto max-h-[160px]" viewBox={`0 0 ${width} ${height}`}>
                {/* Horizontal reference grids */}
                {[0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = padding + (1 - ratio) * chartHeight;
                  return (
                    <line key={i} x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />
                  );
                })}

                {/* S-Curve Path */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Shading Area underneath */}
                <path
                  d={`${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
                  fill="url(#predGrad)"
                  className="opacity-20"
                />

                {/* Active Interactive dots along growth stages */}
                {points.map((p, idx) => {
                  const label = isFr ? stagesFr[p.stage] : stagesEn[p.stage];
                  return (
                    <g key={idx} className="group">
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="5"
                        fill="#ffffff"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        className="transition-all duration-300 cursor-pointer"
                      />
                      <text x={p.x} y={height - 10} textAnchor="middle" fontSize="7" fill="#94a3b8" fontWeight="bold">
                        {label}
                      </text>
                      <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="8" fill="#34d399" fontWeight="black">
                        {p.value.toFixed(1)} t
                      </text>
                    </g>
                  );
                })}

                <defs>
                  <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Soil-Compatibility Health Warning */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-3 items-start">
            <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${metrics.phFactor > 0.9 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              <i className={`fa-solid ${metrics.phFactor > 0.9 ? 'fa-square-check' : 'fa-triangle-exclamation'} text-xs`}></i>
            </div>
            <div className="space-y-1 text-slate-300 text-[10.5px] leading-relaxed">
              <p className="font-extrabold text-white text-[11px] uppercase tracking-wider">
                {isFr ? "Compatibilité Chimique du Sol" : "Soil Chemical Compatibility"}
              </p>
              <p>
                {isFr 
                  ? `Le sol régional a un pH de ${selectedProfile.soilData.ph}. Pour le ${metrics.cropData.nameFr}, le pH optimal se situe entre ${metrics.cropData.optimalPh[0]} et ${metrics.cropData.optimalPh[1]}. Adéquation de : ${(metrics.phFactor * 100).toFixed(0)}%.`
                  : `The current soil pH is ${selectedProfile.soilData.ph}. For ${metrics.cropData.nameEn}, the optimum is between ${metrics.cropData.optimalPh[0]} and ${metrics.cropData.optimalPh[1]}. Soil suitability score: ${(metrics.phFactor * 100).toFixed(0)}%.`
                }
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                <strong>💡 {isFr ? "Note agronomique" : "Agronomic note"}:</strong> {isFr ? metrics.cropData.notesFr : metrics.cropData.notesEn}
              </p>
            </div>
          </div>

          {/* Action to Request Specialized AI agronomic report */}
          <div className="pt-2 border-t border-white/5 space-y-4">
            
            {/* Step-by-step Progressive Offline Loader UI */}
            {predLoading && offlinePredProgress > 0 && (
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4.5 space-y-3 animate-in fade-in duration-300">
                <div className="flex justify-between items-center text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                  <span>{offlinePredStepText || (isFr ? "Compilation agronomique..." : "Compiling metrics...")}</span>
                  <span>{offlinePredProgress}%</span>
                </div>
                <div className="h-2 bg-emerald-950 rounded-full overflow-hidden border border-emerald-500/10">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${offlinePredProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <button
              onClick={handleGeneratePredictionReport}
              disabled={predLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              {predLoading ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin"></i>
                  {isFr ? "Consultation de l'agronome..." : "Consulting agronomist..."}
                </>
              ) : (
                <>
                  <i className="fa-solid fa-brain"></i>
                  {isFr ? "Générer les conseils agronomiques" : "Generate custom agronomic advice"}
                </>
              )}
            </button>

            {/* Generated simulation report */}
            {predReport && (
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-slate-300 text-xs font-medium leading-relaxed animate-in slide-in-from-bottom duration-300 max-h-[300px] overflow-y-auto scrollbar-thin select-text">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                    <i className="fa-solid fa-file-invoice"></i>
                    <span>CONSEIL DE VULNÉRABILITÉ ET DÉCISIONNEL</span>
                  </div>
                  <div className="whitespace-pre-line text-[11px] leading-relaxed">
                    {predReport}
                  </div>
                </div>

                {/* Save Simulation Button */}
                <button
                  type="button"
                  onClick={saveCurrentSimulation}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-750 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 active:scale-95"
                >
                  <i className="fa-solid fa-floppy-disk text-emerald-400"></i>
                  <span>{isFr ? "Sauvegarder ce Plan de Récolte en local" : "Save this Crop Plan locally"}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Saved simulations list (offline friendly table) */}
        {savedSimulations.length > 0 && (
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-folder-open text-amber-500"></i>
                {isFr ? "Simulations de Récolte Enregistrées" : "Saved Crop Simulations"}
              </h4>
              <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {savedSimulations.length} plan{savedSimulations.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
              {savedSimulations.map(sim => (
                <div key={sim.id} className="bg-slate-50/70 p-4 rounded-2xl border border-slate-150 flex justify-between items-start gap-3 relative group">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black text-slate-850 truncate">
                        {sim.cropName} ({sim.area} {sim.areaUnit})
                      </span>
                      {sim.isOfflineSim && (
                        <span className="text-[7px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1 uppercase tracking-wide">
                          {isFr ? "Hors-ligne" : "Offline"}
                        </span>
                      )}
                    </div>
                    <p className="text-[8.5px] text-slate-400 font-extrabold uppercase tracking-wide">
                      📍 {sim.regionName} • pH: {sim.ph}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-200/50">
                      <div>
                        <span className="text-[7.5px] text-slate-400 font-black block uppercase tracking-wider">{isFr ? "YIELD ESTIMÉ" : "EST. YIELD"}</span>
                        <span className="text-[10.5px] font-black text-emerald-700">{sim.yieldTons.toFixed(2)} t</span>
                      </div>
                      <div>
                        <span className="text-[7.5px] text-slate-400 font-black block uppercase tracking-wider">{isFr ? "VALEUR ESTIMÉE" : "EST. VALUE"}</span>
                        <span className="text-[10.5px] font-black text-amber-700">{sim.valueFcfa.toLocaleString()} F</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => deleteSimulation(sim.id)}
                    className="p-2 text-rose-500 hover:text-rose-700 bg-white hover:bg-rose-50 rounded-xl border border-slate-150 transition-all shrink-0 shadow-sm"
                    title="Supprimer"
                  >
                    <i className="fa-solid fa-trash-can text-xs"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderToolsTab = () => {
    const isFr = language === 'FR';
    const soil = selectedProfile.soilData;

    // Spacing Config mapping
    const spacingConfig: Record<string, { spacingRow: number; spacingPlant: number; seedKgPerHa: number }> = {
      'Manioc': { spacingRow: 1.0, spacingPlant: 1.0, seedKgPerHa: 0 },
      'Sorgho': { spacingRow: 0.75, spacingPlant: 0.20, seedKgPerHa: 10 },
      'Cacao': { spacingRow: 3.0, spacingPlant: 3.0, seedKgPerHa: 0 },
      'Maïs': { spacingRow: 0.75, spacingPlant: 0.25, seedKgPerHa: 25 },
      'Café': { spacingRow: 3.0, spacingPlant: 2.0, seedKgPerHa: 0 },
      'Arachides': { spacingRow: 0.40, spacingPlant: 0.15, seedKgPerHa: 80 },
      'Niébé': { spacingRow: 0.50, spacingPlant: 0.20, seedKgPerHa: 20 },
      'Banane': { spacingRow: 3.0, spacingPlant: 2.0, seedKgPerHa: 0 }
    };

    const getSpacingData = (crop: string) => {
      const keys = Object.keys(spacingConfig);
      const matchedKey = keys.find(k => crop.toLowerCase().includes(k.toLowerCase())) || 'Maïs';
      return spacingConfig[matchedKey];
    };

    // NPK target requirements per hectare
    const npkTargets: Record<string, { n: number; p: number; k: number }> = {
      'Manioc': { n: 80, p: 40, k: 100 },
      'Sorgho': { n: 70, p: 35, k: 40 },
      'Cacao': { n: 60, p: 45, k: 90 },
      'Maïs': { n: 120, p: 60, k: 80 },
      'Café': { n: 100, p: 30, k: 120 },
      'Arachides': { n: 20, p: 40, k: 50 },
      'Niébé': { n: 15, p: 30, k: 40 },
      'Banane': { n: 150, p: 50, k: 220 }
    };

    const getNpkTarget = (crop: string) => {
      const keys = Object.keys(npkTargets);
      const matchedKey = keys.find(k => crop.toLowerCase().includes(k.toLowerCase())) || 'Maïs';
      return npkTargets[matchedKey];
    };

    return (
      <div className="space-y-6">
        {/* Sub-tool Selector */}
        <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 animate-in fade-in duration-300">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => setToolType('spacing')}
              className={`py-2 px-1 text-center rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                toolType === 'spacing' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              📐 {isFr ? "Semis" : "Spacing"}
            </button>
            <button
              onClick={() => setToolType('npk')}
              className={`py-2 px-1 text-center rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                toolType === 'npk' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              🧪 {isFr ? "NPK" : "NPK Needs"}
            </button>
            <button
              onClick={() => setToolType('water')}
              className={`py-2 px-1 text-center rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                toolType === 'water' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              💧 {isFr ? "Eau" : "Water"}
            </button>
          </div>
        </div>

        {/* 1. Spacing and Density Calculator tool */}
        {toolType === 'spacing' && (() => {
          const sData = getSpacingData(spacingCrop);
          const areaMult = fieldAreaUnit === 'm2' ? fieldArea / 10000 : fieldArea;
          const densityPerHa = Math.round(10000 / (sData.spacingRow * sData.spacingPlant));
          const totalPlants = Math.round(densityPerHa * areaMult);
          const seedWeight = sData.seedKgPerHa > 0 ? Math.round(sData.seedKgPerHa * areaMult) : 0;

          return (
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-5 animate-in fade-in duration-300">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <i className="fa-solid fa-expand text-emerald-650"></i>
                  {isFr ? "Densité & Espacement de Semis" : "Density & Planting Spacing"}
                </h4>
              </div>

              {/* Form settings */}
              <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-700">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isFr ? "Culture" : "Crop"}</label>
                  <select
                    value={spacingCrop}
                    onChange={(e) => setSpacingCrop(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    {Object.keys(PREDICTION_CROPS).map(cropKey => (
                      <option key={cropKey} value={cropKey}>
                        {isFr ? PREDICTION_CROPS[cropKey].nameFr : PREDICTION_CROPS[cropKey].nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isFr ? "Superficie" : "Plot Size"}</label>
                  <div className="flex">
                    <input
                      type="number"
                      min="1"
                      value={fieldArea}
                      onChange={(e) => setFieldArea(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-l-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                    <select
                      value={fieldAreaUnit}
                      onChange={(e: any) => setFieldAreaUnit(e.target.value)}
                      className="bg-slate-200 border border-slate-200 rounded-r-xl px-2 text-[10px] font-black"
                    >
                      <option value="ha">ha</option>
                      <option value="m2">m²</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dynamic Grid Diagram */}
              <div className="space-y-1.5">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">{isFr ? "REPRÉSENTATION VISUELLE DU SEMIS" : "SEED POSITIONING VISUAL LAYOUT"}</span>
                <div className="bg-emerald-50/30 border border-emerald-100/50 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden h-28">
                  <div className="flex gap-12 justify-center py-2 z-10">
                    <div className="flex flex-col justify-between h-16 items-center">
                      <span className="text-sm">🌱</span>
                      <span className="text-[7.5px] text-emerald-800 font-extrabold border-l border-dashed border-emerald-500/50 py-0.5">{sData.spacingPlant * 100} cm</span>
                      <span className="text-sm">🌱</span>
                    </div>
                    <div className="flex flex-col justify-between h-16 items-center">
                      <span className="text-sm">🌱</span>
                      <span className="text-[7.5px] text-emerald-800 font-extrabold border-l border-dashed border-emerald-500/50 py-0.5">{sData.spacingPlant * 100} cm</span>
                      <span className="text-sm">🌱</span>
                    </div>
                  </div>
                  <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-amber-500/30 flex justify-center">
                    <span className="bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 text-[7px] font-black text-amber-800 uppercase tracking-wider relative -top-2">
                      {isFr ? `Inter-Ligne : ${sData.spacingRow * 100} cm` : `Row spacing: ${sData.spacingRow * 100} cm`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Planting results stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{isFr ? "DENSITÉ RECOMMANDÉE" : "RECOMMENDED DENSITY"}</span>
                  <p className="text-sm font-black text-slate-900 mt-1">
                    {densityPerHa.toLocaleString()} <span className="text-[9px] font-semibold text-slate-500">{isFr ? "plants/ha" : "stems/ha"}</span>
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{isFr ? "PLANTS REQUIS TOTAL" : "TOTAL SEEDLINGS REQUIRED"}</span>
                  <p className="text-sm font-black text-slate-900 mt-1">
                    {totalPlants.toLocaleString()} <span className="text-[9px] font-semibold text-slate-500">{isFr ? "plants" : "seeds"}</span>
                  </p>
                </div>
                {seedWeight > 0 && (
                  <div className="col-span-2 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100 flex justify-between items-center px-4">
                    <span className="text-[8.5px] font-black text-emerald-800 uppercase tracking-widest">{isFr ? "POIDS DE SEMENCES ESTIMÉ" : "TOTAL SEED WEIGHT NEEDED"}</span>
                    <span className="text-xs font-black text-emerald-950">
                      ~ {seedWeight} kg {isFr ? "de semences" : "of seeds"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* 2. Nutrient deficit optimizer (NPK) tool */}
        {toolType === 'npk' && (() => {
          const targets = getNpkTarget(npkCrop);
          const mult = 1.8;
          const availableN = Math.round(soil.npk.n * mult);
          const availableP = Math.round(soil.npk.p * mult);
          const availableK = Math.round(soil.npk.k * mult);

          const defN = Math.max(0, targets.n - availableN);
          const defP = Math.max(0, targets.p - availableP);
          const defK = Math.max(0, targets.k - availableK);

          const neededCompostTons = Math.ceil(Math.max(defN / 12, defP / 6, defK / 10));
          const npkBags = Math.ceil(Math.max(defN / 7.5, defP / 7.5, defK / 7.5));

          return (
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-5 animate-in fade-in duration-300">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <i className="fa-solid fa-flask-vial text-emerald-650"></i>
                  {isFr ? "Optimiseur de Nutrition N-P-K" : "NPK Fertilizer Optimizer"}
                </h4>
              </div>

              {/* Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{isFr ? "Culture Ciblée" : "Targeted Crop"}</label>
                <select
                  value={npkCrop}
                  onChange={(e) => setNpkCrop(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  {Object.keys(PREDICTION_CROPS).map(cropKey => (
                    <option key={cropKey} value={cropKey}>
                      {isFr ? PREDICTION_CROPS[cropKey].nameFr : PREDICTION_CROPS[cropKey].nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Comparison table */}
              <div className="space-y-2">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">{isFr ? "BILAN DES MACRONUTRIMENTS (KG/HA)" : "MACRONUTRIENTS BUDGET (KG/HA)"}</span>
                <div className="border border-slate-100 rounded-2xl overflow-hidden text-xs">
                  <div className="grid grid-cols-4 bg-slate-50 p-2.5 font-black text-slate-500 uppercase text-[8px] tracking-wider border-b border-slate-100">
                    <span>{isFr ? "Élément" : "Nutrient"}</span>
                    <span>{isFr ? "Cible" : "Target"}</span>
                    <span>{isFr ? "Sol" : "Soil"}</span>
                    <span>{isFr ? "Déficit" : "Deficit"}</span>
                  </div>
                  <div className="grid grid-cols-4 p-2.5 font-bold text-slate-750 border-b border-slate-100/50 items-center">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> N</span>
                    <span>{targets.n} kg</span>
                    <span>{availableN} kg</span>
                    <span className={defN > 0 ? "text-rose-650 font-extrabold" : "text-emerald-600 font-extrabold"}>
                      {defN > 0 ? `${defN} kg` : "OK ✔"}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 p-2.5 font-bold text-slate-750 border-b border-slate-100/50 items-center">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> P</span>
                    <span>{targets.p} kg</span>
                    <span>{availableP} kg</span>
                    <span className={defP > 0 ? "text-rose-650 font-extrabold" : "text-emerald-600 font-extrabold"}>
                      {defP > 0 ? `${defP} kg` : "OK ✔"}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 p-2.5 font-bold text-slate-750 items-center">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> K</span>
                    <span>{targets.k} kg</span>
                    <span>{availableK} kg</span>
                    <span className={defK > 0 ? "text-rose-650 font-extrabold" : "text-emerald-600 font-extrabold"}>
                      {defK > 0 ? `${defK} kg` : "OK ✔"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Practical Fertilizer Recommendations */}
              <div className="bg-emerald-50/40 border border-emerald-100 p-4 rounded-3xl space-y-3">
                <span className="text-[8px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1">
                  <i className="fa-solid fa-seedling"></i>
                  {isFr ? "PLAN DE FERTILISATION ADAPTÉ (PAR HECTARE)" : "TAILORED FERTILIZATION DIET (PER HECTARE)"}
                </span>

                <div className="space-y-2.5 text-[11px] text-slate-750 font-semibold leading-relaxed">
                  <div className="flex gap-2 items-start">
                    <span className="text-emerald-600 font-black mt-0.5">✔</span>
                    <p>
                      <strong>{isFr ? "Option Organique prioritaire" : "Recommended Bio-Option"} :</strong>{' '}
                      {neededCompostTons > 0 ? (
                        isFr 
                          ? `Apporter ${neededCompostTons} tonnes de fumier bien composté pour enrichir durablement la structure argileuse de votre sol.`
                          : `Apply ${neededCompostTons} metric tons of well-composted organic manure per hectare to enrich soil biology.`
                      ) : (
                        isFr ? "Vos réserves de sol sont optimales." : "Your soil baseline reserves are excellent."
                      )}
                    </p>
                  </div>

                  {npkBags > 0 && (
                    <div className="flex gap-2 items-start border-t border-emerald-200/40 pt-2">
                      <span className="text-emerald-600 font-black mt-0.5">✔</span>
                      <p>
                        <strong>{isFr ? "Option de Synthèse d'appoint" : "Mineral/Synthetic Option"} :</strong>{' '}
                        {isFr 
                          ? `Épandre environ ${npkBags} sacs (de 50kg) d'engrais NPK 15-15-15, divisé en deux passages pour limiter le lessivage.`
                          : `Broadcast approximately ${npkBags} bags (50kg each) of balanced NPK 15-15-15 fertilizer split into two phases.`
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* 3. Water requirements estimator tool */}
        {toolType === 'water' && (() => {
          const isLegume = waterCrop.includes('Arachides') || waterCrop.includes('Niébé');
          // Weekly water needs based on age
          let waterNeedsMm = 25;
          if (plantAgeWeeks < 3) {
            waterNeedsMm = isLegume ? 15 : 20;
          } else if (plantAgeWeeks >= 3 && plantAgeWeeks <= 8) {
            waterNeedsMm = isLegume ? 30 : 45;
          } else {
            waterNeedsMm = isLegume ? 20 : 25;
          }

          const litersPerPlant = (waterNeedsMm * 10000) / 53000;

          return (
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-5 animate-in fade-in duration-300">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <i className="fa-solid fa-droplet text-blue-650"></i>
                  {isFr ? "Besoins en Eau & Fréquence d'Irrigation" : "Crop Hydric Needs Estimator"}
                </h4>
              </div>

              {/* Forms */}
              <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-700">
                <div className="space-y-1 col-span-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isFr ? "Culture à évaluer" : "Crop to Assess"}</label>
                  <select
                    value={waterCrop}
                    onChange={(e) => setWaterCrop(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    {Object.keys(PREDICTION_CROPS).map(cropKey => (
                      <option key={cropKey} value={cropKey}>
                        {isFr ? PREDICTION_CROPS[cropKey].nameFr : PREDICTION_CROPS[cropKey].nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isFr ? "Âge de la culture" : "Crop Age (Weeks)"}</label>
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg">{plantAgeWeeks} {isFr ? "semaines" : "weeks"}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={plantAgeWeeks}
                    onChange={(e) => setPlantAgeWeeks(parseInt(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-slate-400 font-bold">
                    <span>1 sem (Semis)</span>
                    <span>10 sem (Floraison)</span>
                    <span>20 sem (Maturation)</span>
                  </div>
                </div>
              </div>

              {/* Calculated Outputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{isFr ? "BESOIN PLUVIAL HEBDO" : "WEEKLY HYDRIC DEPTH"}</span>
                  <p className="text-xl font-black text-blue-650 mt-1">
                    {waterNeedsMm} <span className="text-xs font-bold text-slate-500">mm / m²</span>
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{isFr ? "PAR PLANT (HEBDO)" : "WATER PER PLANT"}</span>
                  <p className="text-xl font-black text-blue-650 mt-1">
                    ~ {litersPerPlant.toFixed(1)} <span className="text-xs font-bold text-slate-500">{isFr ? "Litres" : "L"}</span>
                  </p>
                </div>
              </div>

              {/* Water Smart Irrigation Plan */}
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-3xl space-y-2 text-[11px] text-slate-750 font-semibold leading-relaxed">
                <span className="text-[8px] font-black text-blue-800 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <i className="fa-solid fa-hand-holding-droplet"></i>
                  {isFr ? "PROGRAMME D'IRRIGATION WATER-SMART" : "WATER-SMART IRRIGATION PLAN"}
                </span>

                <div className="space-y-2">
                  <p>
                    <strong>⏱ {isFr ? "Horaire optimal" : "Best Timing"} :</strong> {isFr ? "Toujours arroser tôt le matin ou tard le soir pour stopper les pertes par évaporation directes." : "Irrigate early in the morning or late evening to stop evaporation losses."}
                  </p>
                  <p>
                    <strong>🌾 {isFr ? "Paillage de rétention" : "Mulching Shield"} :</strong> {isFr ? "Un paillage d'épaisseur autour des plants réduit la fréquence d'arrosage de moitié." : "Mulching around plants cuts required irrigation frequency in half."}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  return (
    <div className="p-4 space-y-6 pb-28 text-slate-800 animate-in fade-in duration-300">
      
      {/* Header informatif */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full pointer-events-none"></div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
            <i className="fa-solid fa-cloud-sun-rain text-xl text-emerald-300"></i>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight leading-none">
              {language === 'FR' ? "Cultures & Climat" : "Crops & Climate"}
            </h2>
            <p className="text-emerald-200 text-xs mt-1 font-medium">
              {language === 'FR' ? "Souveraineté alimentaire face au réchauffement" : "Food sovereignty face to climate change"}
            </p>
          </div>
        </div>
      </div>

      {/* Segmented Sub-tab Switcher Bar */}
      <div className="bg-slate-100 p-1 rounded-2xl flex justify-between items-center shadow-inner gap-1 border border-slate-200/50">
        <button
          onClick={() => setSubTab('climate')}
          className={`flex-1 py-2.5 text-center rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 ${
            subTab === 'climate'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <i className="fa-solid fa-cloud-sun-rain"></i>
          <span>{language === 'FR' ? 'Climat & Sol' : 'Climate'}</span>
        </button>
        <button
          onClick={() => setSubTab('prediction')}
          className={`flex-1 py-2.5 text-center rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 ${
            subTab === 'prediction'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <i className="fa-solid fa-chart-line"></i>
          <span>{language === 'FR' ? 'Prédictions' : 'Predictions'}</span>
        </button>
        <button
          onClick={() => setSubTab('tools')}
          className={`flex-1 py-2.5 text-center rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 ${
            subTab === 'tools'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <i className="fa-solid fa-screwdriver-wrench"></i>
          <span>{language === 'FR' ? 'Outils' : 'Tools'}</span>
        </button>
      </div>

      {subTab === 'climate' && (
        <>
          {/* Simulation Mode Hors-ligne / Offline Simulation center */}
          <div className="bg-slate-50/80 rounded-3xl p-4 border border-slate-200/60 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 transition-all duration-350 ${
                isOffline ? 'bg-amber-500 text-white animate-pulse' : 'bg-emerald-600 text-white'
              }`}>
                <i className={`fa-solid ${isOffline ? 'fa-plane-slash' : 'fa-wifi'}`}></i>
              </div>
              <div>
                <h4 className="text-[11px] font-black text-slate-800 leading-tight">
                  {language === 'FR' ? "Simulateur Mode Hors-ligne" : "Offline Simulator"}
                </h4>
                <p className="text-[9px] text-slate-500 font-bold leading-none mt-1">
                  {isOffline 
                    ? (language === 'FR' ? "Rapports & diagnostics locaux activés 🔌" : "Offline local diagnostics active 🔌") 
                    : (language === 'FR' ? "Analyse connectée en temps réel 🌐" : "Live real-time analytics connected 🌐")
                  }
                </p>
              </div>
            </div>
            
            {/* Toggle button element */}
            <button
              onClick={() => setIsOffline(!isOffline)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none ${
                isOffline ? 'bg-amber-500' : 'bg-slate-300'
              }`}
              aria-label="Toggle Offline Mode"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-250 ease-in-out ${
                  isOffline ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sélection Lieu et Synchro GPS */}
          <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 space-y-4">
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {language === 'FR' ? "Sélecteur de Zone Géographique" : "Select Geographical Area"}
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedProfile.id}
                  onChange={handleLocationChange}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  {LOCATION_PROFILES.map(profile => (
                    <option key={profile.id} value={profile.id}>
                      {language === 'FR' ? profile.nameFr : profile.nameEn} (Lat: {profile.lat}, Lon: {profile.lon})
                    </option>
                  ))}
                </select>
     
                <button
                  onClick={handleGpsSync}
                  className={`px-4 py-3 rounded-xl border flex items-center justify-center transition-all active:scale-95 ${
                    useGps 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-350'
                  }`}
                  title={language === 'FR' ? "Utiliser ma position GPS" : "Use my GPS position"}
                >
                  <i className="fa-solid fa-location-crosshairs text-sm"></i>
                </button>
              </div>
            </div>
     
            {/* Méta-infos de la zone sélectionnée */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-50">
                <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{language === 'FR' ? "LATITUDE" : "LATITUDE"}</span>
                <p className="text-xs font-black text-slate-800 mt-0.5">{selectedProfile.lat}° N</p>
              </div>
              <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-50">
                <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{language === 'FR' ? "LONGITUDE" : "LONGITUDE"}</span>
                <p className="text-xs font-black text-slate-800 mt-0.5">{selectedProfile.lon}° E</p>
              </div>
              <div className="col-span-2 bg-emerald-50/30 rounded-xl p-3 border border-emerald-50/50">
                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                  {language === 'FR' ? "BIOME / ZONE AGROÉCOLOGIQUE" : "BIOME / AGROECOLOGICAL ZONE"}
                </span>
                <p className="text-xs font-black text-emerald-900 mt-0.5">
                  {language === 'FR' ? selectedProfile.zoneTypeFr : selectedProfile.zoneTypeEn}
                </p>
              </div>
              
              <button
                onClick={handleExportCSV}
                className="col-span-2 w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-750 rounded-xl border border-emerald-100 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <i className="fa-solid fa-file-csv text-sm"></i>
                {language === 'FR' ? "Exporter les données régionales (CSV)" : "Export regional data (CSV)"}
              </button>
            </div>
          </div>
     
          {/* Graphique de vent et tendance */}
          {renderSvgChart()}

          {/* Centre d'alertes météo et d'épidémies */}
          {renderVigilanceCenter()}

          {/* Graphiques physiques et analyses du sol/Soil Health diagnostics */}
          {renderSoilCharts()}

          {/* Alerte et description de l'impact */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation text-amber-500"></i>
              {language === 'FR' ? "Diagnostic de vulnérabilité" : "Vulnerability Assessment"}
            </h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {language === 'FR' ? selectedProfile.climateImpactFr : selectedProfile.climateImpactEn}
            </p>
          </div>

          {/* Filtres de cultures */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-600 uppercase tracking-wider">
                {language === 'FR' ? "Faisabilité des cultures" : "Crop Feasibility"}
              </h3>
              <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {filteredCrops.length} {language === 'FR' ? "cultures" : "crops"}
              </span>
            </div>

            {/* Boutons de filtres */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <FilterBtn active={activeFilter === 'all'} label={language === 'FR' ? 'Toutes' : 'All'} color="bg-slate-100 text-slate-700" activeColor="bg-slate-800 text-white" onClick={() => setActiveFilter('all')} />
              <FilterBtn active={activeFilter === 'resilient'} label={language === 'FR' ? 'Résistantes' : 'Resilient'} color="bg-emerald-50 text-emerald-600" activeColor="bg-emerald-600 text-white" onClick={() => setActiveFilter('resilient')} />
              <FilterBtn active={activeFilter === 'moderate'} label={language === 'FR' ? 'Modérées' : 'Moderate'} color="bg-amber-50 text-amber-600" activeColor="bg-amber-500 text-white" onClick={() => setActiveFilter('moderate')} />
              <FilterBtn active={activeFilter === 'threatened'} label={language === 'FR' ? 'Menacées' : 'Threatened'} color="bg-red-50 text-red-600" activeColor="bg-red-500 text-white" onClick={() => setActiveFilter('threatened')} />
            </div>

            {/* Liste des cultures filtrées */}
            <div className="space-y-3">
              {filteredCrops.map((crop, idx) => (
                <div key={idx} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-start gap-4 animate-in slide-in-from-bottom duration-300">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-1 ${
                    crop.category === 'resilient' ? 'bg-emerald-100 text-emerald-600' :
                    crop.category === 'moderate' ? 'bg-amber-100 text-amber-600' :
                    'bg-red-100 text-red-650'
                  }`}>
                    <i className={`fa-solid ${
                      crop.category === 'resilient' ? 'fa-circle-check text-base' :
                      crop.category === 'moderate' ? 'fa-circle-exclamation text-base' :
                      'fa-skull-crossbones text-sm'
                    }`}></i>
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex justify-between items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900">{crop.name}</h4>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                        crop.category === 'resilient' ? 'bg-emerald-100 text-emerald-700' :
                        crop.category === 'moderate' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-150 text-red-800'
                      }`}>
                        {crop.category === 'resilient' ? (language === 'FR' ? 'Résistante' : 'Resilient') :
                         crop.category === 'moderate' ? (language === 'FR' ? 'Modérée' : 'Moderate') :
                         (language === 'FR' ? 'Menacée' : 'Threatened')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">{crop.description}</p>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[11px] text-slate-600 leading-normal font-medium flex items-start gap-2">
                      <i className="fa-solid fa-lightbulb text-amber-500 text-xs shrink-0 mt-0.5"></i>
                      <span><strong>{language === 'FR' ? "Astuce adaptive" : "Adaptation tip"} :</strong> {crop.adaptationTip}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendrier de Semis & Cycles Culturaux */}
          {renderSowingCalendar()}

          {/* Consultateur IA Agro-Adaptation */}
          <div className="bg-gradient-to-tr from-slate-950 to-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/2 rounded-bl-full pointer-events-none"></div>
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                 <i className="fa-solid fa-robot text-xl text-emerald-400"></i>
              </div>
              <div>
                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                  {language === 'FR' ? "CONSEILLER SPÉCIALISTE IA" : "AI SPECIALIST ADVISOR"}
                </span>
                <h3 className="text-base font-black tracking-tight mt-0.5 leading-snug">
                  {language === 'FR' ? "Générer un Plan d'Adaptation" : "Generate Adaptation Plan"}
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-400 font-semibold leading-relaxed mb-6">
              {language === 'FR' 
                ? "L'IA analyse les tendances décennales de vent et d'humidité pour dresser un calendrier cultural personnalisé d'agriculture régénératrice pour cette zone précise." 
                : "AI will analyze decadal wind and humidity shifts to construct an organic adaptive planting calendar for this precise microclimate."
              }
            </p>

            {/* Step-by-step Progressive Offline Loader UI */}
            {loadingAI && offlineProgress > 0 && (
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4.5 mb-5 space-y-3 animate-in fade-in duration-300">
                <div className="flex justify-between items-center text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                  <span>{offlineStepText || (language === 'FR' ? "Analyse agronomique..." : "Analyzing statistics...")}</span>
                  <span>{offlineProgress}%</span>
                </div>
                <div className="h-2 bg-emerald-950 rounded-full overflow-hidden border border-emerald-500/10">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${offlineProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <button
              onClick={handleGenerateAIReport}
              disabled={loadingAI}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              {loadingAI ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin"></i>
                  {language === 'FR' ? "Étude des anomalies en cours..." : "Calculating anomalies..."}
                </>
              ) : (
                <>
                  <i className="fa-solid fa-microchip"></i>
                  {language === 'FR' ? "Lancer l'analyse d'adaptation IA" : "Execute AI Adaptation Forecast"}
                </>
              )}
            </button>

            {/* Zone de rapport IA */}
            {aiReport && (
              <div className="mt-6 bg-white/5 border border-white/15 rounded-3xl p-5 text-xs text-slate-300 font-medium leading-relaxed animate-in slide-in-from-bottom duration-500 select-text overflow-y-auto max-h-[300px] scrollbar-thin">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                   <i className="fa-solid fa-clipboard-check text-emerald-400"></i>
                   <span className="text-[10px] font-black tracking-widest uppercase text-white">RAPPORT TECHNIQUE GENERÉ</span>
                </div>
                <div className="space-y-4 whitespace-pre-line text-[11px]">
                  {aiReport}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {subTab === 'prediction' && renderPredictionTab()}

      {subTab === 'tools' && renderToolsTab()}

    </div>
  );
};

const FilterBtn: React.FC<{ active: boolean, label: string, color: string, activeColor: string, onClick: () => void }> = ({ active, label, color, activeColor, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 duration-300 transition-colors ${active ? activeColor : color}`}
  >
    {label}
  </button>
);

export default ClimateCrops;
