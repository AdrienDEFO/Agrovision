
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { chatWithAI } from '../services/gemini';

interface AIChatProps {
  user: User;
}

const AIChat: React.FC<AIChatProps> = ({ user }) => {
  const [messages, setMessages] = useState<{ text: string, isAI: boolean }[]>([
    { text: `Bonjour ${user.name}, je suis votre assistant agronome. Comment puis-je vous aider aujourd'hui ?`, isAI: true }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;

    const userMsg = inputText;
    setInputText('');
    setMessages(prev => [...prev, { text: userMsg, isAI: false }]);
    setLoading(true);

    const history = messages.map(m => ({
      role: m.isAI ? 'model' as const : 'user' as const,
      parts: [{ text: m.text }]
    }));

    const response = await chatWithAI(userMsg, history);
    setMessages(prev => [...prev, { text: response || "Erreur de connexion", isAI: true }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#fdfdfd]">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center relative border border-white/30">
            <i className="fa-solid fa-robot text-2xl"></i>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-emerald-600 rounded-full"></div>
          </div>
          <div>
            <h2 className="font-bold text-xl leading-tight">Assistant AgroVision</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-emerald-100 uppercase tracking-widest font-bold">Expert IA Agronome</span>
            </div>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 pt-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.isAI ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-4 rounded-3xl shadow-sm relative ${
              m.isAI 
              ? 'bg-white text-gray-800 rounded-bl-none border border-emerald-100 shadow-emerald-900/5' 
              : 'bg-emerald-600 text-white rounded-br-none shadow-emerald-700/20'
            }`}>
              {m.isAI && <i className="fa-solid fa-microchip absolute -top-3 -left-3 bg-emerald-500 text-white w-6 h-6 rounded-lg flex items-center justify-center text-[10px] shadow-md border border-white"></i>}
              <p className="text-sm leading-relaxed whitespace-pre-line">{m.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl border border-emerald-50 flex gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-75"></span>
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-100 safe-area-bottom">
        <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-2 border border-slate-100">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Posez une question agronomique..." 
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
          />
          <button 
            onClick={handleSend}
            disabled={loading}
            className="bg-emerald-600 text-white w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-50 shadow-md active:scale-95 transition-all"
          >
            <i className="fa-solid fa-paper-plane text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
