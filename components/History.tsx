
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

  const exportToExcel = (item: HistoryItem) => {
    const headers = ["ID", "Common Name", "Scientific Name", "Type", "Soil Type", "Description", "Biological Treatment", "Mechanical Treatment", "Chemical Treatment", "Date"];
    const type = item.isDisease ? "Maladie" : item.isWeed ? "Herbe" : "Saine";
    const dateStr = new Date(item.timestamp).toLocaleString();
    const row = [
      item.id,
      item.commonName,
      item.scientificName,
      type,
      item.soilType,
      item.description.replace(/"/g, '""'),
      item.eradicationMethod.biological.replace(/"/g, '""'),
      item.eradicationMethod.mechanical.replace(/"/g, '""'),
      item.eradicationMethod.chemical.replace(/"/g, '""'),
      dateStr
    ];
    
    const csvContent = "\uFEFF" 
      + [headers.map(h => `"${h}"`).join(","), row.map(r => `"${r}"`).join(",")].join("\n");
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `AgroVision_Diagnostic_${item.commonName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = (item: HistoryItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les fenêtres pop-up pour imprimer le PDF.");
      return;
    }
    const type = item.isDisease ? "Maladie" : item.isWeed ? "Herbe" : "Saine";
    const dateStr = new Date(item.timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Rapport de Diagnostic AgroVision AI - ${item.commonName}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; padding: 40px; line-height: 1.6; }
            .header { border-bottom: 3px solid #047857; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .logo { font-size: 24px; font-weight: 900; color: #064e3b; text-decoration: none; }
            .badge { background: ${item.isDisease ? '#ef4444' : item.isWeed ? '#f59e0b' : '#10b981'}; color: white; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            h1 { font-size: 28px; margin: 0 0 10px 0; font-weight: 800; color: #0f172a; }
            .scientific { font-style: italic; color: #059669; font-size: 18px; margin-bottom: 20px; }
            .meta { background: #f8fafc; padding: 15px; border-radius: 12px; font-size: 13px; margin-bottom: 30px; border-left: 4px solid #047857; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 16px; font-weight: bold; text-transform: uppercase; color: #064e3b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 15px; }
            .content { font-size: 14px; }
            .treatments { display: grid; grid-template-columns: 1fr; gap: 15px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; }
            .card h5 { margin: 0 0 5px 0; color: #047857; font-size: 12px; text-transform: uppercase; }
            .footer { margin-top: 50px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            .plant-img { text-align: center; margin-bottom: 25px; }
            .plant-img img { max-width: 100%; max-height: 250px; object-fit: cover; border-radius: 16px; border: 2px solid #047857; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">AgroVision AI</div>
            <div class="badge">${type}</div>
          </div>
          
          <div class="plant-img">
            <img src="${item.image}" alt="${item.commonName}" />
          </div>

          <h1>${item.commonName}</h1>
          <div class="scientific">${item.scientificName}</div>
          
          <div class="meta">
            <div><strong>Date du diagnostic :</strong> ${dateStr}</div>
            <div><strong>Sol enregistré :</strong> ${item.soilType}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Description et Analyse</div>
            <div class="content">${item.description}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Méthodes de Lutte et Traitement</div>
            <div class="treatments">
              <div class="card">
                <h5>Lutte Biologique</h5>
                <p style="margin: 5px 0 0 0; font-size: 13px;">${item.eradicationMethod.biological}</p>
              </div>
              <div class="card">
                <h5>Lutte Mécanique / Physique</h5>
                <p style="margin: 5px 0 0 0; font-size: 13px;">${item.eradicationMethod.mechanical}</p>
              </div>
              <div class="card">
                <h5>Lutte Chimique</h5>
                <p style="margin: 5px 0 0 0; font-size: 13px;">${item.eradicationMethod.chemical}</p>
              </div>
            </div>
          </div>
          
          <div class="footer">
            Document généré par AgroVision AI - Souveraineté Alimentaire & Progrès Agronomique.
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exportToPNG = (item: HistoryItem) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = item.image;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 700;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const grad = ctx.createLinearGradient(0, 0, 0, 700);
      grad.addColorStop(0, '#064e3b');
      grad.addColorStop(1, '#022c22');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 700);
      
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 760, 660);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('AGROVISION AI', 50, 70);
      
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('RAPPORT DE DIAGNOSTIC AGRONOMIQUE', 50, 95);
      
      const badgeColor = item.isDisease ? '#ef4444' : item.isWeed ? '#f59e0b' : '#10b981';
      ctx.fillStyle = badgeColor;
      ctx.beginPath();
      ctx.roundRect(530, 50, 220, 35, 10);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      const typeLabel = item.isDisease ? 'MALADIE DETECTEE' : item.isWeed ? 'HERBE DETECTEE' : 'PLANTE SAINE';
      ctx.fillText(typeLabel, 640, 72);
      ctx.textAlign = 'left';
      
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, 120);
      ctx.lineTo(750, 120);
      ctx.stroke();
      
      // Draw plant photo nicely on the right side
      try {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(500, 145, 250, 180, 12);
        ctx.clip();
        ctx.drawImage(img, 500, 145, 250, 180);
        ctx.restore();
        
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(500, 145, 250, 180, 12);
        ctx.stroke();
      } catch (e) {
        console.error("Failed to draw image in PNG export", e);
      }
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(item.commonName.toUpperCase(), 50, 175);
      
      ctx.fillStyle = '#10b981';
      ctx.font = 'italic 18px sans-serif';
      ctx.fillText(item.scientificName, 50, 210);
      
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      const dateStr = new Date(item.timestamp).toLocaleDateString('fr-FR');
      ctx.fillText(`Date: ${dateStr}`, 50, 250);
      ctx.fillText(`Sol: ${item.soilType}`, 250, 250);
      
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '14px sans-serif';
      const descText = item.description;
      const words = descText.split(' ');
      let line = '';
      let y = 300;
      const maxWidth = 420; // safe margin to avoid overlapping with the image on the right
      const lineHeight = 22;
      
      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, 50, y);
          line = words[n] + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
        if (y > 420) {
          ctx.fillText(line + '...', 50, y);
          line = '';
          break;
        }
      }
      if (line !== '') {
        ctx.fillText(line, 50, y);
      }
      
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, 450);
      ctx.lineTo(750, 450);
      ctx.stroke();
      
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('RECOMMANDATIONS DE LUTTE : ', 50, 480);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '13px sans-serif';
      const treatText = `Lutte biologique: ${item.eradicationMethod.biological} | Lutte mécanique: ${item.eradicationMethod.mechanical} | Lutte chimique: ${item.eradicationMethod.chemical}`;
      const treatWords = treatText.split(' ');
      let treatLine = '';
      let treatY = 510;
      const fullWidth = 700;
      for (let n = 0; n < treatWords.length; n++) {
        let testLine = treatLine + treatWords[n] + ' ';
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > fullWidth && n > 0) {
          ctx.fillText(treatLine, 50, treatY);
          treatLine = treatWords[n] + ' ';
          treatY += 20;
        } else {
          treatLine = testLine;
        }
        if (treatY > 640) {
          ctx.fillText(treatLine + '...', 50, treatY);
          treatLine = '';
          break;
        }
      }
      if (treatLine !== '') {
        ctx.fillText(treatLine, 50, treatY);
      }
      
      const imgURL = canvas.toDataURL('image/png');
      const link = document.createElement("a");
      link.setAttribute("href", imgURL);
      link.setAttribute("download", `AgroVision_Rapport_${item.commonName.replace(/\s+/g, '_')}.png`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.onerror = () => {
      // Fallback
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('AGROVISION AI - ' + item.commonName, 50, 70);
      const imgURL = canvas.toDataURL('image/png');
      const link = document.createElement("a");
      link.setAttribute("href", imgURL);
      link.setAttribute("download", `AgroVision_Rapport_${item.commonName.replace(/\s+/g, '_')}.png`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
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

             {/* Export Actions Section */}
             <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl mb-6">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5 text-center">Exportations disponibles</p>
                <div className="flex gap-2">
                   <button
                     onClick={() => exportToExcel(selectedItem)}
                     className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-1 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                     title="Exporter vers Excel (CSV)"
                   >
                     <i className="fa-solid fa-file-excel text-xs"></i>
                     <span>Excel</span>
                   </button>
                   <button
                     onClick={() => exportToPDF(selectedItem)}
                     className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-1 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                     title="Imprimer / Exporter en PDF"
                   >
                     <i className="fa-solid fa-file-pdf text-xs"></i>
                     <span>PDF</span>
                   </button>
                   <button
                     onClick={() => exportToPNG(selectedItem)}
                     className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-1 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                     title="Télécharger l'image PNG"
                   >
                     <i className="fa-solid fa-image text-xs"></i>
                     <span>PNG</span>
                   </button>
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
