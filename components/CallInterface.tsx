
import React, { useEffect, useState, useRef } from 'react';
import { connectToExpertIA } from '../services/gemini';

interface CallInterfaceProps {
  type: 'audio' | 'video' | 'ai';
  contactName: string;
  onClose: () => void;
}

const CallInterface: React.FC<CallInterfaceProps> = ({ type, contactName, onClose }) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);

  useEffect(() => {
    if (type === 'ai') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const session = connectToExpertIA(async (base64) => {
        setIsConnecting(false);
        if (!audioContextRef.current) return;

        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        
        const dataInt16 = new Int16Array(bytes.buffer);
        const buffer = audioContextRef.current.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        
        const startTime = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
        source.start(startTime);
        nextStartTimeRef.current = startTime + buffer.duration;
      }, () => {
        // Handle interruption
        nextStartTimeRef.current = 0;
      });

      return () => {
        session.then(s => s.close());
        audioContextRef.current?.close();
      };
    } else {
      setTimeout(() => setIsConnecting(false), 1500);
    }
  }, [type]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col text-white animate-in fade-in zoom-in duration-300">
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <img 
            src={type === 'ai' ? 'https://api.dicebear.com/7.x/bottts/svg?seed=expert' : `https://api.dicebear.com/7.x/avataaars/svg?seed=${contactName}`} 
            className="w-40 h-40 rounded-full border-4 border-emerald-500 bg-slate-800 shadow-2xl relative z-10" 
            alt="Contact"
          />
        </div>
        <h2 className="mt-8 text-3xl font-black tracking-tight">{contactName}</h2>
        <p className="text-emerald-400 font-bold uppercase tracking-widest text-[10px] mt-4 flex items-center gap-2">
          {isConnecting ? (
            <>Connexion en cours<span className="flex gap-1"><span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce"></span><span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce delay-75"></span></span></>
          ) : (
            <>En ligne • {type === 'ai' ? 'Assistant IA Expert' : 'Expert Humain'}</>
          )}
        </p>
      </div>

      <div className="p-12 pb-24 flex justify-center gap-6">
        <button className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-xl hover:bg-white/20 transition-all">
          <i className="fa-solid fa-microphone-slash"></i>
        </button>
        <button 
          onClick={onClose}
          className="w-20 h-20 bg-red-500 rounded-3xl flex items-center justify-center text-2xl shadow-2xl shadow-red-500/40 active:scale-90 transition-all"
        >
          <i className="fa-solid fa-phone-slash"></i>
        </button>
        <button className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-xl hover:bg-white/20 transition-all">
          <i className="fa-solid fa-volume-high"></i>
        </button>
      </div>
    </div>
  );
};

export default CallInterface;
