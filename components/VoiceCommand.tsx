import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../App';

interface VoiceCommandProps {
  onClose?: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const VoiceCommand: React.FC<VoiceCommandProps> = ({ isOpen, setIsOpen }) => {
  const { 
    language, 
    setLanguage, 
    activeTab, 
    setActiveTab, 
    isOffline, 
    setIsOffline, 
    showToast 
  } = useApp();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  const [manualCommand, setManualCommand] = useState('');

  const recognitionRef = useRef<any>(null);

  // Initialize Speech Synthesis & Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = language === 'FR' ? 'fr-FR' : 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setMicError(null);
        setTranscript(language === 'FR' ? "Écoute en cours..." : "Listening...");
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        setTranscript(resultText);
        processCommand(resultText);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          setMicError(language === 'FR' 
            ? "Accès micro refusé. Veuillez autoriser le microphone ou taper la commande." 
            : "Microphone permission denied. Please allow micro access or type your command."
          );
        } else if (event.error === 'no-speech') {
          setMicError(language === 'FR' ? "Aucune parole détectée." : "No speech detected.");
        } else {
          setMicError(`${language === 'FR' ? "Erreur" : "Error"}: ${event.error}`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    } else {
      setMicError(language === 'FR' 
        ? "Reconnaissance vocale non supportée par ce navigateur." 
        : "Voice recognition not supported by this browser."
      );
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language]);

  // Say helper
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'FR' ? 'fr-FR' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const startSpeech = () => {
    if (recognitionRef.current) {
      try {
        window.speechSynthesis.cancel(); // Mute speech when recording
        setTranscript('');
        setAssistantResponse('');
        setMicError(null);
        recognitionRef.current.lang = language === 'FR' ? 'fr-FR' : 'en-US';
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Speech recognition already running", e);
      }
    }
  };

  const stopSpeech = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const processCommand = (command: string) => {
    const isFr = language === 'FR';
    const cleanCmd = command.toLowerCase().trim();
    setTranscript(command);

    // Help commands
    if (cleanCmd.includes('aide') || cleanCmd.includes('help') || cleanCmd.includes('instructions') || cleanCmd.includes('commande')) {
      const resp = isFr 
        ? "Vous pouvez dire Climat, Scan, Chat, IA, Réglages, ou me demander de lire les alertes météo ou de passer en français ou anglais."
        : "You can say Climate, Scan, Chat, AI, Settings, or ask me to read active weather alerts or switch languages.";
      setAssistantResponse(resp);
      speakText(resp);
      return;
    }

    // Tab Navigation commands
    if (cleanCmd.includes('climat') || cleanCmd.includes('climate')) {
      setActiveTab('climate');
      const resp = isFr ? "Navigation vers le profil de climat et de cultures." : "Navigating to Climate and Crops profile.";
      setAssistantResponse(resp);
      speakText(resp);
      showToast(resp, "success");
      setTimeout(() => setIsOpen(false), 2000);
      return;
    }

    if (cleanCmd.includes('scan') || cleanCmd.includes('ouvrir l\'appareil') || cleanCmd.includes('appareil') || cleanCmd.includes('photo') || cleanCmd.includes('maladie') || cleanCmd.includes('disease')) {
      setActiveTab('scan');
      const resp = isFr ? "Ouverture de la caméra de diagnostic des maladies." : "Opening the disease diagnosis scanner.";
      setAssistantResponse(resp);
      speakText(resp);
      showToast(resp, "success");
      setTimeout(() => setIsOpen(false), 2000);
      return;
    }

    if (cleanCmd.includes('social') || cleanCmd.includes('communauté') || cleanCmd.includes('chat') || cleanCmd.includes('community')) {
      setActiveTab('community');
      const resp = isFr ? "Ouverture du chat communautaire agricole." : "Opening the cooperative farming community chat.";
      setAssistantResponse(resp);
      speakText(resp);
      showToast(resp, "success");
      setTimeout(() => setIsOpen(false), 2000);
      return;
    }

    if (cleanCmd.includes('ia') || cleanCmd.includes('intelligence artificielle') || cleanCmd.includes('robot') || cleanCmd.includes('ai') || cleanCmd.includes('assistant')) {
      setActiveTab('ai');
      const resp = isFr ? "Lancement de l'assistant de conseil agronomique IA." : "Launching the AI agricultural advisor chat.";
      setAssistantResponse(resp);
      speakText(resp);
      showToast(resp, "success");
      setTimeout(() => setIsOpen(false), 2000);
      return;
    }

    if (cleanCmd.includes('réglages') || cleanCmd.includes('paramètres') || cleanCmd.includes('settings') || cleanCmd.includes('config')) {
      setActiveTab('settings');
      const resp = isFr ? "Ouverture du panneau des configurations de l'application." : "Navigating to the settings control panel.";
      setAssistantResponse(resp);
      speakText(resp);
      showToast(resp, "success");
      setTimeout(() => setIsOpen(false), 2000);
      return;
    }

    if (cleanCmd.includes('historique') || cleanCmd.includes('history')) {
      setActiveTab('history');
      const resp = isFr ? "Ouverture de votre historique de diagnostics." : "Opening your scan diagnostic history.";
      setAssistantResponse(resp);
      speakText(resp);
      showToast(resp, "success");
      setTimeout(() => setIsOpen(false), 2000);
      return;
    }

    // Language switcher commands
    if (cleanCmd.includes('français') || cleanCmd.includes('french')) {
      setLanguage('FR');
      const resp = "Langue modifiée en Français.";
      setAssistantResponse(resp);
      speakText(resp);
      showToast(resp, "success");
      return;
    }

    if (cleanCmd.includes('english') || cleanCmd.includes('anglais')) {
      setLanguage('EN');
      const resp = "Language switched to English.";
      setAssistantResponse(resp);
      speakText(resp);
      showToast(resp, "success");
      return;
    }

    // Offline / Online toggle commands
    if (cleanCmd.includes('mode hors ligne') || cleanCmd.includes('hors ligne') || cleanCmd.includes('déconnecter') || cleanCmd.includes('offline')) {
      setIsOffline(true);
      const resp = isFr ? "Mode local hors-ligne activé." : "Local offline mode enabled.";
      setAssistantResponse(resp);
      speakText(resp);
      showToast(resp, "info");
      return;
    }

    if (cleanCmd.includes('mode en ligne') || cleanCmd.includes('connecter') || cleanCmd.includes('online')) {
      setIsOffline(false);
      const resp = isFr ? "Connexion cloud activée." : "Cloud online connection enabled.";
      setAssistantResponse(resp);
      speakText(resp);
      showToast(resp, "success");
      return;
    }

    // Read alerts commands
    if (cleanCmd.includes('alerte') || cleanCmd.includes('météo') || cleanCmd.includes('epidemic') || cleanCmd.includes('weather') || cleanCmd.includes('read alert')) {
      const alertsStr = isFr 
        ? "Alerte active: Vigilance canicule et invasion active de la chenille légionnaire sur le sorgho. Plan d'adaptation requis."
        : "Active alerts: Heatwave warnings and Fall Armyworm outbreak on sorghum. Urgent adaptation recommended.";
      setAssistantResponse(alertsStr);
      speakText(alertsStr);
      return;
    }

    // Default unrecognized command
    const defaultResp = isFr 
      ? `Commande "${command}" non reconnue. Dites "aide" pour voir les commandes.`
      : `Command "${command}" not recognized. Say "help" to list valid options.`;
    setAssistantResponse(defaultResp);
    speakText(defaultResp);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCommand.trim()) return;
    processCommand(manualCommand);
    setManualCommand('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[110] flex items-end justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md p-6 shadow-2xl border border-slate-100 flex flex-col space-y-6 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-12 duration-400">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <i className="fa-solid fa-microphone text-emerald-600 animate-pulse"></i>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {language === 'FR' ? "Assistant Vocal" : "Voice Control"}
              </h3>
              <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">
                AgroVision Hands-Free
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              window.speechSynthesis.cancel();
              setIsOpen(false);
            }}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Dynamic Voice Pulsing State */}
        <div className="flex flex-col items-center justify-center py-6 space-y-4 relative">
          
          {/* Waves Visualizer */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            {isListening && (
              <>
                <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping duration-1000"></div>
                <div className="absolute inset-2 rounded-full bg-emerald-500/20 animate-ping duration-1500 delay-300"></div>
                <div className="absolute inset-4 rounded-full bg-emerald-500/30 animate-pulse duration-700"></div>
              </>
            )}
            <button 
              onClick={isListening ? stopSpeech : startSpeech}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 duration-300 ${
                isListening 
                  ? 'bg-red-500 text-white shadow-red-500/30 hover:bg-red-600' 
                  : 'bg-emerald-600 text-white shadow-emerald-600/30 hover:bg-emerald-500'
              }`}
            >
              <i className={`fa-solid ${isListening ? 'fa-square text-xl' : 'fa-microphone text-3xl'} transition-transform duration-300`}></i>
            </button>
          </div>

          <div className="text-center space-y-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              {isListening 
                ? (language === 'FR' ? "EN COURS D'ENREGISTREMENT..." : "RECORDING NOW...")
                : (language === 'FR' ? "TAPOTEZ POUR PARLER" : "TAP MICROPHONE TO TALK")
              }
            </span>
            <p className="text-xs font-black text-slate-800">
              {isListening 
                ? (language === 'FR' ? "Dites 'climat', 'scan' ou 'aide'" : "Say 'climate', 'scan' or 'help'")
                : (language === 'FR' ? "Posez une commande vocale" : "Request a voice command")
              }
            </p>
          </div>
        </div>

        {/* Transcripts & Speech Box */}
        {(transcript || assistantResponse || micError) && (
          <div className="bg-slate-50 rounded-3xl p-4.5 border border-slate-100 space-y-3">
            
            {/* User Speech Transcription */}
            {transcript && (
              <div className="space-y-1">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">
                  {language === 'FR' ? "Votre voix :" : "You said:"}
                </span>
                <p className="text-xs font-bold text-slate-700 italic">
                  "{transcript}"
                </p>
              </div>
            )}

            {/* Assistant Voice Response */}
            {assistantResponse && (
              <div className="border-t border-slate-200/50 pt-2.5 space-y-1">
                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest block flex items-center gap-1">
                  <i className="fa-solid fa-reply"></i>
                  {language === 'FR' ? "Réponse d'AgroVision :" : "AgroVision's response:"}
                </span>
                <p className="text-[11px] font-black text-slate-900 leading-relaxed">
                  {assistantResponse}
                </p>
              </div>
            )}

            {/* Error notifications */}
            {micError && (
              <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-xl text-[10px] text-rose-700 font-bold">
                <i className="fa-solid fa-circle-exclamation text-rose-500 mr-1.5"></i>
                {micError}
              </div>
            )}
          </div>
        )}

        {/* Manual Keyboard Command Fallback */}
        <form onSubmit={handleManualSubmit} className="space-y-2">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 block">
            {language === 'FR' ? "Saisie clavier alternative :" : "Alternative text command:"}
          </label>
          <div className="relative">
            <input 
              type="text" 
              value={manualCommand}
              onChange={(e) => setManualCommand(e.target.value)}
              placeholder={language === 'FR' ? "Ex: climat, scan, passer en anglais..." : "E.g., climate, scan, switch to english..."}
              className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-150 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <button 
              type="submit"
              className="absolute right-1.5 top-1.5 bottom-1.5 w-9 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer"
            >
              <i className="fa-solid fa-paper-plane text-[10px]"></i>
            </button>
          </div>
        </form>

        {/* Cheat Sheet Commands List */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">
            {language === 'FR' ? "Commandes Valides :" : "Valid Voice Commands:"}
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-[9.5px] text-slate-600 font-bold">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              📂 <span className="text-slate-800">"Climat" / "Climate"</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              📷 <span className="text-slate-800">"Scan" / "Scanner"</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              💬 <span className="text-slate-800">"Social" / "Chat"</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              🤖 <span className="text-slate-800">"IA" / "AI"</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              ⚙ <span className="text-slate-800">"Réglages" / "Settings"</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              🗣 <span className="text-slate-800">"Français" / "English"</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              🚨 <span className="text-slate-800">"Alerte" / "Météo"</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              ✈ <span className="text-slate-800">"Hors ligne" / "Offline"</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VoiceCommand;
