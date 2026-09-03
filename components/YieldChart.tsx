import React, { useState } from 'react';
import { Language, HistoryItem } from '../types';
import { IDBService, YieldMetrics, YieldDataPoint } from '../services/indexedDB';

interface YieldChartProps {
  language: Language;
  history?: HistoryItem[];
  onExportCSV?: () => void;
}

const YieldChart: React.FC<YieldChartProps> = ({ language, history = [], onExportCSV }) => {
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const metrics: YieldMetrics = IDBService.calculateYieldMetrics(history);

  const isFr = language === 'FR';

  const activePoint = selectedCrop 
    ? metrics.dataPoints.find(p => p.crop === selectedCrop) || metrics.dataPoints[0]
    : metrics.dataPoints[0];

  // Calcul pour la mise à l'échelle du graphique SVG
  const maxVal = Math.max(...metrics.dataPoints.map(d => d.potentialYield), 1);
  const chartHeight = 160;
  const barWidth = 32;
  const gap = 24;

  return (
    <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 space-y-4">
      {/* En-tête du graphique */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
              <i className="fa-solid fa-chart-simple text-xs"></i>
            </div>
            <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
              {isFr ? "Graphique de Rendement Agricole" : "Crop Yield & Harvest Analytics"}
            </h4>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold mt-1">
            {isFr 
              ? "Projections de récolte & estimation des pertes évitées par traitement" 
              : "Harvest projections & prevented crop losses via early diagnosis"}
          </p>
        </div>
        <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
          {metrics.overallHealthScore}% {isFr ? "Santé" : "Health"}
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">
            {isFr ? "Rendement Moyen" : "Average Yield"}
          </span>
          <span className="text-base font-black text-slate-900 block mt-0.5">
            {metrics.averageYieldTonsHa} <span className="text-[9px] font-bold text-slate-500">t/ha</span>
          </span>
        </div>

        <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100 shadow-sm text-center">
          <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest block">
            {isFr ? "Gain Sauvegardé" : "Loss Saved"}
          </span>
          <span className="text-base font-black text-emerald-600 block mt-0.5">
            +{metrics.totalSavedYieldTonsHa} <span className="text-[9px] font-bold text-emerald-600">t/ha</span>
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">
            {isFr ? "Parcelles Saines" : "Healthy Plots"}
          </span>
          <span className="text-base font-black text-teal-600 block mt-0.5">
            {metrics.healthyPlotsCount} <span className="text-[9px] font-bold text-slate-400">/ {metrics.dataPoints.length}</span>
          </span>
        </div>
      </div>

      {/* Visual SVG Bar & Performance Chart */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-3 text-[9px] font-black uppercase text-slate-400 tracking-wider">
          <span>{isFr ? "Rendement (Tonnes / Hectare)" : "Yield (Tons / Hectare)"}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {isFr ? "Projeté" : "Projected"}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              {isFr ? "Sauvé (IA)" : "Saved (AI)"}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-200"></span>
              {isFr ? "Potentiel" : "Potential"}
            </span>
          </div>
        </div>

        {/* SVG Container with Horizontal Scroll for responsiveness */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[320px]">
            <svg 
              className="w-full h-44 overflow-visible" 
              viewBox={`0 0 ${metrics.dataPoints.length * (barWidth + gap) + 30} ${chartHeight + 35}`}
            >
              {/* Lignes de repère horizontales */}
              {[0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = chartHeight - ratio * (chartHeight - 20);
                return (
                  <g key={idx}>
                    <line 
                      x1="10" 
                      y1={y} 
                      x2={metrics.dataPoints.length * (barWidth + gap) + 20} 
                      y2={y} 
                      stroke="#f1f5f9" 
                      strokeDasharray="3 3" 
                    />
                    <text 
                      x="0" 
                      y={y + 3} 
                      fill="#94a3b8" 
                      fontSize="7" 
                      fontWeight="bold"
                    >
                      {Math.round(ratio * maxVal)}
                    </text>
                  </g>
                );
              })}

              {/* Barres par culture */}
              {metrics.dataPoints.map((dp, i) => {
                const x = 20 + i * (barWidth + gap);
                const isSelected = (selectedCrop || metrics.dataPoints[0].crop) === dp.crop;

                const potentialHeight = Math.max(8, (dp.potentialYield / maxVal) * (chartHeight - 20));
                const projectedHeight = Math.max(6, (dp.projectedYield / maxVal) * (chartHeight - 20));
                const savedHeight = Math.max(3, (dp.lossPrevented / maxVal) * (chartHeight - 20));

                const potentialY = chartHeight - potentialHeight;
                const projectedY = chartHeight - projectedHeight;
                const savedY = projectedY - savedHeight;

                return (
                  <g 
                    key={dp.crop} 
                    className="cursor-pointer transition-transform group"
                    onClick={() => setSelectedCrop(dp.crop)}
                  >
                    {/* Colonne d'arrière-plan interactif */}
                    <rect
                      x={x - 4}
                      y={10}
                      width={barWidth + 8}
                      height={chartHeight + 25}
                      fill={isSelected ? '#ecfdf5' : 'transparent'}
                      rx="8"
                      className="transition-colors"
                    />

                    {/* Potentiel théorique (gris clair) */}
                    <rect 
                      x={x} 
                      y={potentialY} 
                      width={barWidth} 
                      height={potentialHeight} 
                      fill="#e2e8f0" 
                      rx="4"
                    />

                    {/* Rendement projeté (vert émeraude) */}
                    <rect 
                      x={x} 
                      y={projectedY} 
                      width={barWidth} 
                      height={projectedHeight} 
                      fill={isSelected ? "#059669" : "#10b981"} 
                      rx="4"
                    />

                    {/* Gain de rendement préservé grâce aux traitements (doré/ambre) */}
                    <rect 
                      x={x} 
                      y={Math.max(12, savedY)} 
                      width={barWidth} 
                      height={savedHeight} 
                      fill="#f59e0b" 
                      rx="3"
                    />

                    {/* Valeur au-dessus de la barre */}
                    <text 
                      x={x + barWidth / 2} 
                      y={Math.max(8, savedY - 4)} 
                      textAnchor="middle" 
                      fill={isSelected ? "#047857" : "#475569"} 
                      fontSize="8" 
                      fontWeight="900"
                    >
                      {dp.projectedYield}t
                    </text>

                    {/* Libellé culture en dessous */}
                    <text 
                      x={x + barWidth / 2} 
                      y={chartHeight + 15} 
                      textAnchor="middle" 
                      fill={isSelected ? "#064e3b" : "#64748b"} 
                      fontSize="9" 
                      fontWeight={isSelected ? "900" : "700"}
                    >
                      {dp.crop}
                    </text>

                    {/* Indicateur de risque sous le nom */}
                    <circle
                      cx={x + barWidth / 2}
                      cy={chartHeight + 25}
                      r="2.5"
                      fill={dp.riskLevel === 'Faible' ? '#10b981' : dp.riskLevel === 'Modéré' ? '#f59e0b' : '#ef4444'}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Détail de la culture sélectionnée */}
        {activePoint && (
          <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-200">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-900 uppercase text-[11px]">{activePoint.crop}</span>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase ${
                  activePoint.riskLevel === 'Faible' ? 'bg-emerald-100 text-emerald-800' :
                  activePoint.riskLevel === 'Modéré' ? 'bg-amber-100 text-amber-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {isFr ? `Risque ${activePoint.riskLevel}` : `${activePoint.riskLevel} Risk`}
                </span>
              </div>
              <p className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                {isFr 
                  ? `Potentiel: ${activePoint.potentialYield} t/ha • Réel: ${activePoint.projectedYield} t/ha (+${activePoint.lossPrevented} t/ha sauvé)` 
                  : `Potential: ${activePoint.potentialYield} t/ha • Real: ${activePoint.projectedYield} t/ha (+${activePoint.lossPrevented} t/ha saved)`}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{isFr ? "Taux Santé" : "Health Rate"}</span>
              <span className="font-black text-emerald-700 text-xs">{activePoint.healthRate}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Bouton d'export CSV intégré directement ou accessible */}
      {onExportCSV && (
        <button
          onClick={onExportCSV}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-100 transition-all cursor-pointer active:scale-95"
        >
          <i className="fa-solid fa-file-csv text-xs text-emerald-200"></i>
          {isFr ? "Exporter Données de Rendement & Diagnostics (CSV)" : "Export Yield & Diagnostic Data (CSV)"}
        </button>
      )}
    </div>
  );
};

export default YieldChart;
