
import React, { useState, useEffect } from 'react';
import { LOCATION_PROFILES, LocationProfile, getClosestProfile } from '../data/climateData';
import { analyzeClimateAdaptation } from '../services/gemini';
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

  useEffect(() => {
    if (selectedProfile && selectedProfile.crops.length > 0) {
      setSelectedCropForCalendar(selectedProfile.crops[0].name);
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

    if (isOffline) {
      setTimeout(() => {
        const report = generateOfflineReport(selectedProfile, language);
        setAiReport(report);
        setLoadingAI(false);
        showToast(
          language === 'FR' 
            ? "Rapport d'adaptation local généré (Hors-ligne) !" 
            : "Local adaptation report generated (Offline)!",
          "success"
        );
      }, 8000); // 800ms simulation
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
    
    return (
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-6">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <i className="fa-solid fa-seedling text-emerald-650 animate-pulse"></i>
            {isFr ? "Sondage & Profil Physico-Chimique" : "Physical & Chemical Soil Profiling"}
          </h3>
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
            {isFr ? "Visualisation Sol" : "Soil Health"}
          </span>
        </div>

        {/* 1. Acidité - pH Meter */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
              {isFr ? "ACIDITÉ ET PH DU SOL" : "SOIL ACIDITY & PH"}
            </span>
            <span className="font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-xl text-[11px]">
              pH {soil.ph} ({soil.ph < 5.5 ? (isFr ? 'Fortement acide' : 'Strongly Acidic') : soil.ph < 6.0 ? (isFr ? 'Modérément acide' : 'Moderately Acidic') : (isFr ? 'Neutre' : 'Sub-neutral')})
            </span>
          </div>
          
          <div className="relative pt-2">
            <div className="h-2 w-full rounded-full bg-gradient-to-r from-red-400 via-amber-350 via-emerald-400 to-blue-500"></div>
            {(() => {
              const percentage = Math.max(0, Math.min(100, ((soil.ph - 4) / 4) * 100));
              return (
                <div 
                  className="absolute top-0 -mt-1 w-4.5 h-4.5 bg-slate-900 border-2 border-white rounded-full shadow-md flex items-center justify-center transition-all duration-500"
                  style={{ left: `calc(${percentage}% - 9px)` }}
                  title={`pH ${soil.ph}`}
                >
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></div>
                </div>
              );
            })()}
            <div className="flex justify-between text-[8px] text-slate-400 font-bold pt-1.5">
              <span>pH 4.0 (Acide)</span>
              <span>pH 6.0</span>
              <span>pH 7.0 (Neutre)</span>
              <span>pH 8.0 (Alcalin)</span>
            </div>
          </div>
        </div>

        {/* 2. Coupe interactive des Horizons du sol */}
        <div className="space-y-3 pt-1">
          <p className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
            {isFr ? "EXPLORATEUR INTERACTIF DU SOL" : "INTERACTIVE SOIL VERTICAL VIEW"}
          </p>
          
          <div className="space-y-4">
            <div className="flex flex-col rounded-3xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 relative">
              {/* Horizon A */}
              <button 
                onClick={() => setSelectedHorizon(0)}
                className={`py-4 relative transition-all duration-300 flex flex-col justify-center px-5 border-b-2 border-emerald-650 text-left text-white ${
                  selectedHorizon === 0 
                    ? 'bg-amber-950 ring-4 ring-emerald-500 ring-inset z-10 scale-[1.01]' 
                    : 'bg-stone-900 opacity-80 hover:opacity-95'
                }`}
              >
                <div className="absolute top-0 inset-x-0 h-1 bg-emerald-600 animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                  Horizon A : {isFr ? "Surface (0-10cm)" : "Topsoil (0-10cm)"}
                </span>
                <span className="text-[7.5px] opacity-75 font-bold truncate mt-0.5">
                  {isFr ? "Humus & Activité biologique intense" : "Organic Humus & High Micro-activity"}
                </span>
              </button>

              {/* Horizon B */}
              <button 
                onClick={() => setSelectedHorizon(1)}
                className={`py-4 transition-all duration-300 flex flex-col justify-center px-5 border-b border-stone-800 text-left text-white ${
                  selectedHorizon === 1 
                    ? 'bg-amber-850 ring-4 ring-emerald-500 ring-inset z-10 scale-[1.01]' 
                    : 'bg-orange-950 opacity-80 hover:opacity-95'
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                  Horizon B : {isFr ? "Accumulation (10-40cm)" : "Subsoil (10-40cm)"}
                </span>
                <span className="text-[7.5px] opacity-75 font-bold truncate mt-0.5">
                  {isFr ? "Zone Argileuse compacte retenant l'eau" : "Dense Clay & Mineral absorption"}
                </span>
              </button>

              {/* Horizon C */}
              <button 
                onClick={() => setSelectedHorizon(2)}
                className={`py-4 transition-all duration-300 flex flex-col justify-center px-5 text-left text-white ${
                  selectedHorizon === 2 
                    ? 'bg-amber-700 ring-4 ring-emerald-500 ring-inset z-10 scale-[1.01]' 
                    : 'bg-amber-900 opacity-80 hover:opacity-95'
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300 shrink-0"></span>
                  Horizon C : {isFr ? "Substratum (40-100cm)" : "Bedrock (40-100cm)"}
                </span>
                <span className="text-[7.5px] opacity-75 font-bold truncate mt-0.5">
                  {isFr ? "Roche-mère désagrégée hautement drainante" : "Altered bedrock, rapid gravity drainage"}
                </span>
              </button>
            </div>

            {/* Détails de l'Horizon sélectionné */}
            {(() => {
              const layer = soil.moistureProfile[selectedHorizon] || { depth: 'N/A', current: 0, historical: 0 };
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
                <div className="bg-slate-50 p-4.5 rounded-3xl border border-slate-150 space-y-4 animate-in fade-in duration-300">
                  <div className="flex justify-between items-start gap-2 border-b border-slate-200/50 pb-2.5">
                    <div>
                      <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                        {isFr ? currentDetails.titleFr : currentDetails.titleEn}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                        {isFr ? `Épaisseur active : ${layer.depth}` : `Active depth: ${layer.depth}`}
                      </p>
                    </div>
                    <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg shrink-0">
                      -{diff}% {isFr ? "d'eau (vs hist.)" : "water (vs hist.)"}
                    </span>
                  </div>

                  {/* Humidité progressive */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-wider">
                      <span>{isFr ? "Statut hydrique actuel" : "Current moisture density"}</span>
                      <span className="text-blue-600 font-black">{layer.current}% / 100%</span>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden relative">
                      <div 
                        className="h-full bg-linear-to-r from-blue-600 to-sky-400 rounded-full transition-all duration-500"
                        style={{ width: `${layer.current}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Propriétés */}
                  <div className="space-y-2.5 text-[10px] font-semibold text-slate-650 leading-relaxed pl-0.5">
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
        </div>

        {/* 3. Macronutriments du sol (N-P-K) */}
        <div className="space-y-3 pt-1">
          <p className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
             {isFr ? "MACRONUTRIMENTS ESSENTIELS N-P-K" : "ESSENTIAL MACRONUTRIENTS N-P-K"}
          </p>
          
          <div className="grid grid-cols-3 gap-3">
            {/* Azote N */}
            <div className="bg-emerald-50/40 rounded-2xl p-3 border border-emerald-100/50 flex flex-col items-center">
              <span className="text-[15px] font-black text-emerald-800 leading-none">N</span>
              <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest mt-1">{isFr ? "Azote" : "Nitrogen"}</span>
              <p className="text-xs font-black text-emerald-900 mt-1.5">{soil.npk.n} <span className="text-[8px] font-normal">mg/kg</span></p>
              <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full mt-2 uppercase ${
                soil.npk.n > 60 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {soil.npk.n > 60 ? (isFr ? 'Optimal' : 'Optimal') : (isFr ? 'Moyen' : 'Medium')}
              </span>
            </div>

            {/* Phosphore P */}
            <div className="bg-amber-50/40 rounded-2xl p-3 border border-amber-150 flex flex-col items-center">
              <span className="text-[15px] font-black text-amber-800 leading-none">P</span>
              <span className="text-[7px] font-black text-amber-600 uppercase tracking-widest mt-1">{isFr ? "Phosphore" : "Phosphorus"}</span>
              <p className="text-xs font-black text-amber-900 mt-1.5">{soil.npk.p} <span className="text-[8px] font-normal">mg/kg</span></p>
              <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full mt-2 uppercase ${
                soil.npk.p > 20 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {soil.npk.p > 20 ? (isFr ? 'Abondant' : 'Abundant') : (isFr ? 'Carence' : 'Low')}
              </span>
            </div>

            {/* Potassium K */}
            <div className="bg-indigo-50/40 rounded-2xl p-3 border border-indigo-100 flex flex-col items-center">
              <span className="text-[15px] font-black text-indigo-800 leading-none">K</span>
              <span className="text-[7px] font-black text-indigo-600 uppercase tracking-widest mt-1">{isFr ? "Potassium" : "Potassium"}</span>
              <p className="text-xs font-black text-indigo-900 mt-1.5">{soil.npk.k} <span className="text-[8px] font-normal">mg/kg</span></p>
              <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full mt-2 uppercase ${
                soil.npk.k > 60 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {soil.npk.k > 60 ? 'Riche' : (isFr ? 'Moyen' : 'Medium')}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Texture Triangulaire */}
        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-150/60 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
              {isFr ? "PROPORTION DU TYPE DE TEXTURE DU SOL" : "SOIL TEXTURE PAIRINGS"}
            </span>
            <span className="text-[9px] font-black text-slate-800 bg-slate-200/50 px-2 py-0.5 rounded-lg text-center">
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
            <i className="fa-solid fa-file-csv text-sm animate-bounce"></i>
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
                  <i className="fa-solid fa-lightbulb text-amber-500 text-xs shrink-0 mt-0.5 animate-bounce"></i>
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
