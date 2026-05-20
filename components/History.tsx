
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { HistoryItem } from '../types';

const History: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    setHistory(StorageService.getHistory());
  }, []);

  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat('fr-FR', { 
      day: '2-digit', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    }).format(ts);
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] p-8 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <i className="fa-solid fa-clock-rotate-left text-3xl text-slate-300"></i>
        </div>
        <h3 className="text-xl font-black text-slate-900">Aucun historique</h3>
        <p className="text-slate-500 text-sm mt-2">Commencez par scanner une plante pour voir apparaître vos diagnostics ici.</p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-28 space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Historique <span className="text-emerald-500 text-sm ml-2">{history.length}</span></h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auto-purge 30j</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {history.map((item) => (
          <div 
            key={item.id} 
            onClick={() => setSelectedItem(item)}
            className="bg-white rounded-[2rem] overflow-hidden shadow-md border border-slate-100 active:scale-95 transition-transform"
          >
            <div className="h-32 relative">
              <img src={item.image} className="w-full h-full object-cover" alt={item.commonName} />
              <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-white shadow-lg ${item.isDisease ? 'bg-red-500' : item.isWeed ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                {item.isDisease ? 'Maladie' : item.isWeed ? 'Herbe' : 'Saine'}
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-black text-slate-900 text-xs truncate uppercase tracking-tighter">{item.commonName}</h4>
              <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase">{formatDate(item.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Détails */}
      {selectedItem && (
        <div className="fixed inset-0 z-[110] bg-slate-900/95 backdrop-blur-md p-4 flex flex-col animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-4 pt-4">
            <h3 className="text-white font-black text-lg">Diagnostic Passé</h3>
            <button onClick={() => setSelectedItem(null)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-white rounded-[3rem] p-6">
             <img src={selectedItem.image} className="w-full h-64 object-cover rounded-[2.5rem] mb-6 shadow-xl" />
             <div className="flex justify-between items-start mb-4">
                <div>
                   <h2 className="text-3xl font-black text-slate-900 leading-none">{selectedItem.commonName}</h2>
                   <p className="text-emerald-600 font-bold italic mt-2 text-sm">{selectedItem.scientificName}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase">{formatDate(selectedItem.timestamp)}</p>
                </div>
             </div>
             <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100 mb-6">
                <p className="text-[10px] font-black text-orange-800 uppercase tracking-tighter">Sol enregistré : {selectedItem.soilType}</p>
             </div>
             <p className="text-slate-600 text-sm leading-relaxed mb-8">{selectedItem.description}</p>
             
             <div className="space-y-4">
               <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest flex items-center gap-2">
                 <i className="fa-solid fa-vial-virus text-red-500"></i> Traitements
               </h4>
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs text-slate-700 font-medium">Bio : {selectedItem.eradicationMethod.biological}</p>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
