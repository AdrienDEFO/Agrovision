
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import CallInterface from './CallInterface';

interface InboxProps {
  user: User;
}

const Inbox: React.FC<InboxProps> = ({ user }) => {
  const [activeCall, setActiveCall] = useState<{type: 'audio' | 'video' | 'ai', name: string} | null>(null);

  const conversations = [
    { id: 'c1', name: 'Dr. Keita', role: 'Ingénieur Agronome' as UserRole, lastMsg: 'Avez-vous essayé de réduire l\'azote ?', time: '14:20', unread: true, email: 'keita@agri.africa', phone: '+22370001122' },
    { id: 'c2', name: 'Amadou Cissé', role: 'Agriculteur' as UserRole, lastMsg: 'Les semences sont arrivées hier.', time: 'Hier', unread: false, email: 'amadou@ferme.gn', phone: '+22460012345' },
    { id: 'c3', name: 'AgroCare ONG', role: 'ONG' as UserRole, lastMsg: 'Nouvelle campagne prévue...', time: 'Lun.', unread: false, email: 'contact@agrocare.org', phone: '+22720202020' },
  ];

  return (
    <div className="bg-white min-h-full pb-24">
      {activeCall && (
        <CallInterface 
          type={activeCall.type as any} 
          contactName={activeCall.name} 
          onClose={() => setActiveCall(null)} 
        />
      )}

      <div className="p-8 border-b border-gray-50 bg-gradient-to-b from-slate-50/50 to-white">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Messages</h2>
        <div className="mt-6 flex gap-3">
          <button 
            onClick={() => setActiveCall({type: 'ai', name: 'Assistant IA Expert'})}
            className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-robot"></i> Appel Expert IA
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {conversations.map((c) => (
          <div key={c.id} className="p-5 flex items-center gap-4 hover:bg-slate-50 transition-all cursor-pointer">
            <div className="relative">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.name}`} className="w-16 h-16 rounded-2xl bg-emerald-50 border border-gray-100 shadow-sm" alt={c.name} />
              {c.unread && <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex justify-between items-baseline">
                <h3 className="font-black text-gray-900 truncate">{c.name}</h3>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{c.time}</span>
              </div>
              <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest mb-1">{c.role}</p>
              <p className={`text-xs truncate ${c.unread ? 'font-black text-gray-800' : 'text-gray-500 font-medium'}`}>{c.lastMsg}</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <a 
                href={`tel:${c.phone}`}
                className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-sm shadow-sm hover:bg-emerald-600 hover:text-white transition-all"
              >
                <i className="fa-solid fa-phone"></i>
              </a>
              <a 
                href={`mailto:${c.email}`}
                className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-sm shadow-sm hover:bg-blue-600 hover:text-white transition-all"
              >
                <i className="fa-solid fa-envelope"></i>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Inbox;
