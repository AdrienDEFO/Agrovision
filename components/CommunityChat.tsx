
import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, UserRole } from '../types';

interface CommunityChatProps {
  user: User;
}

const CommunityChat: React.FC<CommunityChatProps> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const mockUsers = [
    { id: '1', name: 'Dr. Keita', email: 'keita@univ.ml', phone: '+22370001122', role: 'Ingénieur Agronome' as UserRole },
    { id: '2', name: 'Amadou Cissé', email: 'amadou@ferme.gn', phone: '+22460012345', role: 'Agriculteur' as UserRole },
    { id: '3', name: 'ONG Sahel Vert', email: 'contact@sahelvert.org', phone: '+22720202020', role: 'ONG' as UserRole },
    { id: 'cm_mbarga', name: 'Prof. Jean-Pierre Mbarga', email: 'jp.mbarga@agro.cm', phone: '+237699112233', role: 'Ingénieur Agronome' as UserRole },
    { id: 'cm_ndip', name: 'Florence Ndip', email: 'florence@ferme-ndip.cm', phone: '+237677445566', role: 'Cultivateur' as UserRole },
    { id: 'cm_fosto', name: 'Dieudonné Fosto', email: 'fosto@intrants-cameroun.com', phone: '+237655889900', role: 'Vendeur' as UserRole },
    { id: 'cm_saphir', name: 'GIC Saphir Cameroun', email: 'contact@saphircam.org', phone: '+237622334455', role: 'ONG' as UserRole },
    { id: 'cm_talla', name: 'Emmanuel Talla', email: 'e.talla@invest-agri.cm', phone: '+237688778899', role: 'Investisseur' as UserRole },
  ];

  const getSenderContact = (senderId: string, senderName: string) => {
    const contact = mockUsers.find(u => u.id === senderId || u.name === senderName);
    if (!contact && senderId === user.id) {
      return { email: user.email || 'mon.email@agrovision.ai', phone: user.phone };
    }
    return contact;
  };

  useEffect(() => {
    setMessages([
      { id: '1', senderId: 'bot', senderName: 'Système', senderRole: 'Particulier', text: 'Bienvenue dans la communauté AgroVision ! Échangez vos connaissances ici.', timestamp: Date.now() - 3600000 },
      { id: '2', senderId: 'agro1', senderName: 'Dr. Keita', senderRole: 'Ingénieur Agronome', text: 'Attention, des chenilles légionnaires ont été aperçues près de Sikasso.', timestamp: Date.now() - 1800000 },
      { id: '3', senderId: 'cm_mbarga', senderName: 'Prof. Jean-Pierre Mbarga', senderRole: 'Ingénieur Agronome', text: 'Pour les sols ferrallitiques de l\'Ouest du Cameroun (pH ~5.2), je conseille un amendement calcaire (dolomie/chaux) pour remonter le pH avant de planter.', timestamp: Date.now() - 900000 },
      { id: '4', senderId: 'cm_ndip', senderName: 'Florence Ndip', senderRole: 'Cultivateur', text: 'Bonjour les amis ! Est-ce que quelqu\'un à Foumbot fait la culture sous serre pour la tomate ? Nos rendements s\'améliorent nettement.', timestamp: Date.now() - 600000 },
      { id: '5', senderId: 'cm_fosto', senderName: 'Dieudonné Fosto', senderRole: 'Vendeur', text: 'Arrivage de pulvérisateurs et semences améliorées de maïs à Douala et Yaoundé. Me contacter pour les prix.', timestamp: Date.now() - 300000 }
    ]);
  }, []);

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const newMessage: ChatMessage = {
      id: Math.random().toString(),
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      text: inputText,
      timestamp: Date.now()
    };
    setMessages([...messages, newMessage]);
    setInputText('');
  };

  const filteredUsers = mockUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="bg-white px-4 py-3 border-b border-gray-100 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-gray-900 text-xl tracking-tight">Espace Social</h2>
          <button onClick={() => setIsSearching(!isSearching)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isSearching ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
            <i className="fa-solid fa-magnifying-glass"></i>
          </button>
        </div>

        {isSearching && (
          <div className="animate-in slide-in-from-top duration-300 space-y-2">
            <input 
              type="text" 
              placeholder="Rechercher un expert ou agriculteur..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border-none text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <div className="max-h-48 overflow-y-auto bg-white rounded-xl border border-gray-100 shadow-lg p-2 space-y-1">
                {filteredUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`} className="w-8 h-8 rounded-full bg-gray-100" />
                      <div>
                        <p className="text-xs font-bold text-gray-800">{u.name}</p>
                        <p className="text-[9px] text-emerald-600 font-medium uppercase tracking-tighter">{u.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a href={`mailto:${u.email}`} className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-xs shadow-sm active:scale-90 transition-all">
                        <i className="fa-solid fa-envelope"></i>
                      </a>
                      <a href={`tel:${u.phone}`} className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-xs shadow-sm active:scale-90 transition-all">
                        <i className="fa-solid fa-phone"></i>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.senderId === user.id ? 'flex-row-reverse' : ''}`}>
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.senderId === 'bot' ? 'system' : m.senderName}`} 
              className="w-10 h-10 rounded-2xl shadow-sm self-end bg-white border border-gray-100" 
              alt="Avatar" 
            />
            <div className={`max-w-[80%] ${m.senderId === user.id ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[10px] font-black text-gray-900">{m.senderName}</span>
                <span className="text-[8px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-black tracking-widest uppercase">{m.senderRole}</span>
              </div>
              <div className={`p-4 rounded-3xl text-sm shadow-sm leading-relaxed ${
                m.senderId === user.id 
                ? 'bg-emerald-600 text-white rounded-br-none' 
                : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
              }`}>
                {m.text}
              </div>
              
              {/* Call or Email action buttons directly below the response message */}
              {m.senderId !== 'bot' && (() => {
                const contact = getSenderContact(m.senderId, m.senderName);
                if (contact) {
                  return (
                    <div className={`flex gap-1.5 mt-1.5 ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all active:scale-95 ${
                            m.senderId === user.id
                              ? 'bg-emerald-700/40 text-emerald-100 border-emerald-500/30 hover:bg-emerald-700/60'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                          }`}
                          title={`Appeler ${contact.name}`}
                        >
                          <i className="fa-solid fa-phone text-[8px]"></i>
                          <span>Appeler</span>
                        </a>
                      )}
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all active:scale-95 ${
                            m.senderId === user.id
                              ? 'bg-emerald-700/40 text-emerald-100 border-emerald-500/30 hover:bg-emerald-700/60'
                              : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100'
                          }`}
                          title={`Emailer ${contact.name}`}
                        >
                          <i className="fa-solid fa-envelope text-[8px]"></i>
                          <span>E-mail</span>
                        </a>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              <span className="text-[8px] text-gray-400 mt-1 font-medium">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-3">
        <button className="text-gray-300 hover:text-emerald-500 transition-colors">
          <i className="fa-solid fa-camera text-xl"></i>
        </button>
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Partagez un conseil ou une image..." 
          className="flex-1 bg-slate-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        />
        <button 
          onClick={sendMessage}
          className="bg-emerald-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <i className="fa-solid fa-paper-plane text-sm"></i>
        </button>
      </div>
    </div>
  );
};

export default CommunityChat;
