
export interface ClimateDataPoint {
  year: number;
  ws2mMin: number;
}

export interface CropInfo {
  name: string;
  category: 'resilient' | 'moderate' | 'threatened';
  description: string;
  adaptationTip: string;
}

export interface SoilData {
  ph: number;
  organicMatter: number; // in %
  composition: { clay: number; sand: number; silt: number }; // out of 100
  npk: { n: number; p: number; k: number }; // mg/kg
  moistureProfile: { depth: string; current: number; historical: number }[];
}

export interface LocationProfile {
  id: string;
  nameKey: string;
  nameFr: string;
  nameEn: string;
  lat: number;
  lon: number;
  zoneTypeFr: string;
  zoneTypeEn: string;
  climateImpactFr: string;
  climateImpactEn: string;
  historicalData: ClimateDataPoint[];
  crops: CropInfo[];
  soilData: SoilData;
}

export const LOCATION_PROFILES: LocationProfile[] = [
  {
    id: 'bertoua',
    nameKey: 'Bertoua',
    nameFr: 'Bertoua (Est Cameroun)',
    nameEn: 'Bertoua (East Cameroon)',
    lat: 4.5,
    lon: 13.75,
    zoneTypeFr: 'Transition Forêt-Savane',
    zoneTypeEn: 'Forest-Savanna Transition',
    climateImpactFr: 'Allongement des saisons sèches et augmentation des températures maximales. Les minima de vitesse de vent fluctuants indiquent des sautes de vents thermiques perturbant l\'évapotranspiration.',
    climateImpactEn: 'Longer dry seasons and higher maximum temperatures. Fluctuating wind speed minimums indicate microclimatic shifts affecting plant evapotranspiration.',
    historicalData: [
      { year: 1985, ws2mMin: 0.02 },
      { year: 1990, ws2mMin: 0.03 },
      { year: 1995, ws2mMin: 0.01 },
      { year: 2000, ws2mMin: 0.01 },
      { year: 2005, ws2mMin: 0.01 },
      { year: 2010, ws2mMin: 0.02 },
      { year: 2015, ws2mMin: 0.01 },
      { year: 2020, ws2mMin: 0.02 },
      { year: 2025, ws2mMin: 0.01 }
    ],
    crops: [
      {
        name: 'Manioc (Cassava)',
        category: 'resilient',
        description: 'Excellent pourvoyeur de calories, très tolérant à la sécheresse prolongée.',
        adaptationTip: 'Pailler le sol pour conserver l\'humidité résiduelle lors du premier mois de plantation.'
      },
      {
        name: 'Sorgho (Sorghum)',
        category: 'resilient',
        description: 'Graminée robuste s\'adaptant bien aux sols pauvres et aux climats chauds.',
        adaptationTip: 'Opter pour des variétés précoces pour synchroniser avec l\'irrégularité des pluies.'
      },
      {
        name: 'Cacao (Cocoa)',
        category: 'threatened',
        description: 'Sensible aux vagues de chaleur extrêmes et à l\'insolation directe sur la lisière forestière.',
        adaptationTip: 'Planter sous ombrage agroforestier (ex: bananiers ou arbres légumineux fixateurs d\'azote) pour freiner le vent sec.'
      },
      {
        name: 'Maïs (Maize)',
        category: 'moderate',
        description: 'Donne de bons rendements mais reste vulnérable si la pluie s\'arrête brusquement durant la floraison.',
        adaptationTip: 'Privilégier le semis sous couvert végétal pour protéger les jeunes pousses du dessèchement précoce.'
      }
    ],
    soilData: {
      ph: 5.8,
      organicMatter: 2.1,
      composition: { clay: 45, sand: 35, silt: 20 },
      npk: { n: 42, p: 25, k: 58 },
      moistureProfile: [
        { depth: '0-10cm', current: 28, historical: 35 },
        { depth: '10-40cm', current: 42, historical: 48 },
        { depth: '40-100cm', current: 55, historical: 58 }
      ]
    }
  },
  {
    id: 'garoua_boulai',
    nameKey: 'Garoua-Boulaï',
    nameFr: 'Garoua-Boulaï (Frontière RCA)',
    nameEn: 'Garoua-Boulaï (CAR Border)',
    lat: 5.5,
    lon: 14.375,
    zoneTypeFr: 'Savane Sahélienne/Guinéenne',
    zoneTypeEn: 'Guinean Savanna',
    climateImpactFr: 'Pression de la désertification et vents desséchants de l\'Harmattan plus intenses. Le vent minimum historique montre des pics pendant les années El Niño, asséchant drastiquement les couches supérieures du sol.',
    climateImpactEn: 'Encroaching aridification and more intense drying Harmattan winds. Historical minimum wind speeds show anomalies during dry El Niño cycles, speeding up soil erosion.',
    historicalData: [
      { year: 1985, ws2mMin: 0.03 },
      { year: 1990, ws2mMin: 0.01 },
      { year: 1995, ws2mMin: 0.01 },
      { year: 2000, ws2mMin: 0.04 },
      { year: 2005, ws2mMin: 0.04 },
      { year: 2010, ws2mMin: 0.05 },
      { year: 2015, ws2mMin: 0.01 },
      { year: 2020, ws2mMin: 0.03 },
      { year: 2025, ws2mMin: 0.04 }
    ],
    crops: [
      {
        name: 'Millet / Sorgho',
        category: 'resilient',
        description: 'Hautement rustiques, demandent très peu de précipitations après l\'implantation.',
        adaptationTip: 'Associer les cultures avec du niébé (haricot indigène) pour fixer l\'azote et couvrir le sol.'
      },
      {
        name: 'Niébé (Cowpea)',
        category: 'resilient',
        description: 'Légumineuse extrêmement robuste au stress hydrique, enrichit naturellement les sols.',
        adaptationTip: 'Planter comme culture de couverture intercalaire pour limiter l\'assèchement provoqué par le vent sec.'
      },
      {
        name: 'Igname (Yam)',
        category: 'moderate',
        description: 'Se comporte bien mais exige un tuteurage ombragé et souffre si le sol durcit trop tôt.',
        adaptationTip: 'Creuser des buttes profondes enrichies en compost pour garder un sol meuble.'
      },
      {
        name: 'Café Robusta',
        category: 'threatened',
        description: 'Très sévèrement affecté par la sécheresse de l\'air et les excès de vent chaud.',
        adaptationTip: 'Installer des brise-vents de Moringa ou de Calliandra autour des parcelles.'
      }
    ],
    soilData: {
      ph: 6.2,
      organicMatter: 1.5,
      composition: { clay: 30, sand: 55, silt: 15 },
      npk: { n: 30, p: 15, k: 45 },
      moistureProfile: [
        { depth: '0-10cm', current: 15, historical: 26 },
        { depth: '10-40cm', current: 31, historical: 40 },
        { depth: '40-100cm', current: 44, historical: 51 }
      ]
    }
  },
  {
    id: 'berberati',
    nameKey: 'Berbérati',
    nameFr: 'Berbérati (Sud-Ouest RCA)',
    nameEn: 'Berberati (South-West CAR)',
    lat: 4.5,
    lon: 15.0,
    zoneTypeFr: 'Forêt Semi-Décidue',
    zoneTypeEn: 'Semi-Deciduous Forest',
    climateImpactFr: 'Saisons pluviales erratiques. Les écarts brutaux de vents de surface signalent des microrafales locales qui déchirent le feuillage des cultures à grandes feuilles comme le plantain.',
    climateImpactEn: 'Highly erratic wet seasons. Abrupt spikes in surface winds signify local micro-gusts that damage large-leaved crops like banana plantain.',
    historicalData: [
      { year: 1985, ws2mMin: 0.05 },
      { year: 1990, ws2mMin: 0.05 },
      { year: 1995, ws2mMin: 0.02 },
      { year: 2000, ws2mMin: 0.02 },
      { year: 2005, ws2mMin: 0.01 },
      { year: 2010, ws2mMin: 0.03 },
      { year: 2015, ws2mMin: 0.01 },
      { year: 2020, ws2mMin: 0.02 },
      { year: 2025, ws2mMin: 0.01 }
    ],
    crops: [
      {
        name: 'Arachide (Groundnut)',
        category: 'resilient',
        description: 'S\'adapte aux cycles courts et tolère des variations de vents.',
        adaptationTip: 'Semer tôt, dès les toutes premières pluies stables, pour esquiver les sécheresses tardives.'
      },
      {
        name: 'Manioc doux',
        category: 'resilient',
        description: 'Aliment de base impérissable dans le sol qui survit aux chaleurs.',
        adaptationTip: 'Sélectionner des boutures saines pour contrer les pucerons actifs par temps sec.'
      },
      {
        name: 'Banane Plantain',
        category: 'threatened',
        description: 'Son feuillage et son système racinaire superficiel la rendent très vulnérable aux vents modérés et aux tempêtes sèches.',
        adaptationTip: 'Planter au cœur de parcelles sylvicoles denses pour casser l\'élan des microrafales.'
      },
      {
        name: 'Caféier (Robusta)',
        category: 'moderate',
        description: 'Rendements en baisse sous l\'effet de la hausse générale nocturne des températures.',
        adaptationTip: 'Mettre en place des pratiques de taille sévère après récolte et implanter de l\'ombrage épais.'
      }
    ],
    soilData: {
      ph: 5.5,
      organicMatter: 2.8,
      composition: { clay: 40, sand: 40, silt: 20 },
      npk: { n: 48, p: 18, k: 50 },
      moistureProfile: [
        { depth: '0-10cm', current: 24, historical: 33 },
        { depth: '10-40cm', current: 39, historical: 45 },
        { depth: '40-100cm', current: 52, historical: 56 }
      ]
    }
  },
  {
    id: 'yokadouma',
    nameKey: 'Yokadouma',
    nameFr: 'Yokadouma (Est Forêt Cameroun)',
    nameEn: 'Yokadouma (Cameroon Rain Forest)',
    lat: 3.0,
    lon: 13.75,
    zoneTypeFr: 'Forêt Équatoriale Dense',
    zoneTypeEn: 'Humid Equatorial Forest',
    climateImpactFr: 'Pluviométrie intense de mousson mais parfois concentrée sur de courtes périodes délugéennes. L\'air calme de forêt dense (minimums à 0 m/s dominants) conserve l\'humidité mais engendre de féroces attaques de pathogènes sous de fortes chaleurs.',
    climateImpactEn: 'Monsoon heavy rain cycles concentrated over brief torrential bursts. Stagnant humid forest air (0 m/s minimums) retains ground dampness, triggering aggressive fungal outbreaks on cocoa trees during heatwaves.',
    historicalData: [
      { year: 1985, ws2mMin: 0.0 },
      { year: 1990, ws2mMin: 0.0 },
      { year: 1995, ws2mMin: 0.0 },
      { year: 2000, ws2mMin: 0.0 },
      { year: 2005, ws2mMin: 0.0 },
      { year: 2010, ws2mMin: 0.0 },
      { year: 2015, ws2mMin: 0.0 },
      { year: 2020, ws2mMin: 0.0 },
      { year: 2025, ws2mMin: 0.0 }
    ],
    crops: [
      {
        name: 'Macabo / Taro',
        category: 'resilient',
        description: 'Tubercules prospérant dans les sols profonds humides de sous-bois forestiers.',
        adaptationTip: 'Assurer un drainage adéquat pour éviter l\'engorgement des racines lors de pluies violentes.'
      },
      {
        name: 'Bananier Plantain',
        category: 'moderate',
        description: 'Bonne humidité disponible, mais attention aux vents violents en bordure de déforestation.',
        adaptationTip: 'Éviter de planter sur les crêtes de collines dégagées, préférer les vallons.'
      },
      {
        name: 'Manioc (Buttes)',
        category: 'moderate',
        description: 'Pousse bien, mais le surcroît d\'humidité stagnante peut provoquer la pourriture racinaire.',
        adaptationTip: 'Planter impérativement sur des buttes d\'au moins 40cm pour un drainage gravitaire.'
      },
      {
        name: 'Cacaoyer (Cocoa)',
        category: 'threatened',
        description: 'Forte sensibilité à la pourriture brune des cabosses induite par l\'extrême humidité stagnante combinée aux températures élevées.',
        adaptationTip: 'Élaguer régulièrement les branches du cacaoyer et des arbres d\'ombrage pour favoriser la circulation d\'air.'
      }
    ],
    soilData: {
      ph: 5.2,
      organicMatter: 4.5,
      composition: { clay: 50, sand: 20, silt: 30 },
      npk: { n: 70, p: 12, k: 80 },
      moistureProfile: [
        { depth: '0-10cm', current: 48, historical: 53 },
        { depth: '10-40cm', current: 62, historical: 66 },
        { depth: '40-100cm', current: 75, historical: 78 }
      ]
    }
  },
  {
    id: 'nola',
    nameKey: 'Nola',
    nameFr: 'Nola (Sud Centrafrique)',
    nameEn: 'Nola (South CAR Forest)',
    lat: 3.5,
    lon: 15.625,
    zoneTypeFr: 'Forêt Humide Congolaise',
    zoneTypeEn: 'Congolian Wet Forest',
    climateImpactFr: 'Chauffage climatique global asséchant la lisière de la grande forêt de la Sangha. Les vents calmes au sol de niveau -999 ou 0 indiquent un couvert végétal encore protecteur mais très fragile face au déboisement.',
    climateImpactEn: 'Global warming causing drying edges on the great Sangha basin Forest. Humid calm wind speeds reflect intact forest cover, highly vulnerable to canopy disruption.',
    historicalData: [
      { year: 1985, ws2mMin: 0.0 },
      { year: 1990, ws2mMin: 0.01 },
      { year: 1995, ws2mMin: 0.0 },
      { year: 2000, ws2mMin: 0.01 },
      { year: 2005, ws2mMin: 0.0 },
      { year: 2010, ws2mMin: 0.01 },
      { year: 2015, ws2mMin: 0.0 },
      { year: 2020, ws2mMin: 0.01 },
      { year: 2025, ws2mMin: 0.0 }
    ],
    crops: [
      {
        name: 'Igname forestière (Yam)',
        category: 'resilient',
        description: 'Tubercule adapté à la friche à haute litière de feuilles.',
        adaptationTip: 'Réaliser un paillage avec des résidus de feuilles forestières pour simuler l\'humus naturel.'
      },
      {
        name: 'Banane de table',
        category: 'moderate',
        description: 'Exige une bonne alimentation en eau disponible toute l\'année.',
        adaptationTip: 'Favoriser l\'agriculture de bas-fonds irrigués naturellement mais hors crues.'
      },
      {
        name: 'Avocatier',
        category: 'moderate',
        description: 'S\'épanouit bien mais craint les sécheresses d\'air lors de la floraison.',
        adaptationTip: 'Pratiquer l\'agroforesterie en intercalant des fruitiers de haute stature.'
      },
      {
        name: 'Caféier Robusta cultivé',
        category: 'threatened',
        description: 'Les hausses de températures nocturnes perturbent la maturation du fruit.',
        adaptationTip: 'Associer les plants avec des essences forestières indigènes denses conservatrices de fraîcheur.'
      }
    ],
    soilData: {
      ph: 5.4,
      organicMatter: 3.8,
      composition: { clay: 45, sand: 25, silt: 30 },
      npk: { n: 65, p: 14, k: 75 },
      moistureProfile: [
        { depth: '0-10cm', current: 36, historical: 44 },
        { depth: '10-40cm', current: 51, historical: 58 },
        { depth: '40-100cm', current: 68, historical: 72 }
      ]
    }
  }
];

export const getClosestProfile = (lat: number, lon: number): LocationProfile => {
  let closest = LOCATION_PROFILES[0];
  let minDistance = Infinity;
  
  for (const profile of LOCATION_PROFILES) {
    const dist = Math.sqrt(Math.pow(profile.lat - lat, 2) + Math.pow(profile.lon - lon, 2));
    if (dist < minDistance) {
      minDistance = dist;
      closest = profile;
    }
  }
  
  return closest;
};
