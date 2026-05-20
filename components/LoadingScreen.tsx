
import React, { useState, useEffect } from 'react';

const messages = [
  "Préparation de vos outils agricoles...",
  "Analyse des données climatiques...",
  "Optimisation de l'IA pour vos sols...",
  "Cultiver l'Excellence, Nourrir l'Afrique...",
  "Chargement de l'expertise communautaire...",
];

const LoadingScreen: React.FC = () => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-emerald-900 flex flex-col items-center justify-center p-8 text-center">
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-emerald-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="relative w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-3 animate-bounce">
          <i className="fa-solid fa-seedling text-6xl text-emerald-600"></i>
        </div>
      </div>
      
      <div className="space-y-4 max-w-xs">
        <h2 className="text-white text-3xl font-black tracking-tight leading-none">AgroVision AI</h2>
        <div className="flex justify-center gap-1">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        </div>
        <p className="text-emerald-100/70 text-sm font-bold italic h-10 px-4">
          {messages[msgIndex]}
        </p>
      </div>

      <div className="absolute bottom-12 text-emerald-500/50 text-[10px] font-black uppercase tracking-[0.3em]">
        Cultiver l'Excellence, Nourrir l'Afrique
      </div>
    </div>
  );
};

export default LoadingScreen;
