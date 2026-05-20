import React, { useState } from 'react';
import { UserRole } from '../types';
import { useApp } from '../App';
import { StorageService } from '../services/storage';

interface OnboardingProps {
  onComplete: (data: { name: string; phone: string; city: string; role: UserRole }) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { showToast, language } = useApp();
  const [view, setView] = useState<'landing' | 'register'>('landing');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    role: '' as UserRole | '',
    customRole: ''
  });

  const roles = ['Agriculteur', 'Ingénieur Agronome', 'ONG', 'Particulier', 'Autres'] as const;

  const handleConnect = () => {
    const savedUser = StorageService.getUser();
    if (savedUser && savedUser.name && savedUser.phone && savedUser.city && savedUser.role) {
      showToast(
        language === 'FR' 
          ? `Ravi de vous revoir, ${savedUser.name} !` 
          : `Welcome back, ${savedUser.name}!`, 
        "success"
      );
      onComplete(savedUser);
    } else {
      showToast(
        language === 'FR' 
          ? "Aucun compte trouvé sur cet appareil. Veuillez vous inscrire pour continuer." 
          : "No account found on this device. Please register to continue.", 
        "error"
      );
      setView('register');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRole = formData.role === 'Autres' 
      ? (formData.customRole.trim() || 'Autres') 
      : formData.role;

    if (formData.name && formData.phone && formData.city && finalRole) {
      onComplete({
        name: formData.name,
        phone: formData.phone,
        city: formData.city,
        role: finalRole as UserRole
      });
    }
  };

  const isFormValid = () => {
    if (!formData.name.trim()) return false;
    if (!formData.phone.trim()) return false;
    if (!formData.city.trim()) return false;
    if (!formData.role) return false;
    if (formData.role === 'Autres' && !formData.customRole.trim()) return false;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 flex items-center justify-center p-6 my-auto">
      <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-500 my-auto">
        
        {view === 'landing' ? (
          /* Landing view with Register and Sign In options */
          <div className="p-8 text-center py-12 space-y-8 animate-in fade-in duration-300">
            <div className="space-y-4">
              <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner rotate-3 transition-transform hover:rotate-6 duration-350">
                <i className="fa-solid fa-wheat-awn text-5xl text-emerald-600"></i>
              </div>
              <h2 className="text-4xl font-black text-gray-900 leading-none tracking-tight">AgroVision AI</h2>
              <p className="text-emerald-700 font-bold text-xs uppercase tracking-widest">
                {language === 'FR' ? "L'agriculture de précision" : "Precision Agriculture"}
              </p>
              <p className="text-gray-400 font-semibold text-xs leading-snug px-4">
                {language === 'FR' 
                  ? "Diagnostic d'herbiers, conseils agronomiques par IA, socialisation et robustesse offline."
                  : "Weed detection, AI advisory, social networking and fully resilient offline mode."}
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <button
                onClick={handleConnect}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-950/15 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-right-to-bracket text-sm"></i>
                {language === 'FR' ? "Se Connecter" : "Sign In"}
              </button>

              <button
                onClick={() => setView('register')}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 py-4 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <i className="fa-solid fa-user-plus text-xs animate-pulse"></i>
                {language === 'FR' ? "S'inscrire" : "Sign Up"}
              </button>
            </div>

            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              {language === 'FR' ? "AgroVision AI — Version 2.0" : "AgroVision AI — Version 2.0"}
            </div>
          </div>
        ) : (
          /* Registration view with Back option */
          <div className="animate-in slide-in-from-right duration-300">
            <div className="p-8 text-center pt-8 pb-4 relative">
              <button 
                onClick={() => setView('landing')}
                className="absolute left-6 top-8 text-gray-400 hover:text-gray-700 transition-colors w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
                title={language === 'FR' ? "Retour" : "Back"}
              >
                <i className="fa-solid fa-arrow-left text-sm"></i>
              </button>

              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                <i className="fa-solid fa-wheat-awn text-3xl text-emerald-600"></i>
              </div>
              <h2 className="text-2xl font-black text-gray-900 leading-tight">
                {language === 'FR' ? "Inscription" : "Registration"}
              </h2>
              <p className="text-gray-500 font-semibold text-[10px] uppercase tracking-wider mt-0.5">
                {language === 'FR' ? "Créer votre profil AgroVision" : "Create your AgroVision Profile"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 pt-0 space-y-4">
              <div className="space-y-4">
                
                {/* Nom & Prénom */}
                <div className="group">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    {language === 'FR' ? "Nom et Prénom" : "Full Name"}
                  </label>
                  <div className="relative">
                    <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-sm text-sm"
                      placeholder="Moussa Koné"
                      required
                    />
                  </div>
                </div>

                {/* Téléphone */}
                <div className="group">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    {language === 'FR' ? "Numéro de Téléphone" : "Phone Number"}
                  </label>
                  <div className="relative">
                    <i className="fa-solid fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-sm text-sm"
                      placeholder="+223 70 00 00 00"
                      required
                    />
                  </div>
                </div>

                {/* Ville */}
                <div className="group">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    {language === 'FR' ? "Ville" : "City"}
                  </label>
                  <div className="relative">
                    <i className="fa-solid fa-city absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                    <input 
                      type="text" 
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500 outline-none transition-all shadow-sm text-sm"
                      placeholder="Bamako"
                      required
                    />
                  </div>
                </div>

                {/* Choix de la fonction */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1 text-center">
                    {language === 'FR' ? "Choisissez votre fonction" : "Choose your Role"}
                  </label>
                  
                  <div className="flex flex-wrap gap-2 justify-center">
                    {roles.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFormData({...formData, role: r})}
                        className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 active:scale-95 ${
                          formData.role === r 
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/10' 
                            : 'bg-white text-gray-600 border-slate-100 hover:border-emerald-200'
                        }`}
                      >
                        <span>{r}</span>
                        {formData.role === r && <i className="fa-solid fa-check text-[10px]"></i>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Précisez autre fonction */}
                {formData.role === 'Autres' && (
                  <div className="group animate-in slide-in-from-top duration-250">
                    <label className="block text-xs font-bold text-amber-600 uppercase tracking-widest mb-1.5 ml-1">
                      {language === 'FR' ? "Spécifiez votre fonction" : "Specify your function"}
                    </label>
                    <div className="relative">
                      <i className="fa-solid fa-briefcase absolute left-4 top-1/2 -translate-y-1/2 text-amber-500"></i>
                      <input 
                        type="text" 
                        value={formData.customRole}
                        onChange={(e) => setFormData({...formData, customRole: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-amber-50/50 border border-amber-200 focus:bg-white focus:border-amber-500 outline-none transition-all shadow-sm text-sm text-gray-800"
                        placeholder="Ex: Enseignant, Étudiant, Maraîcher..."
                        required
                      />
                    </div>
                  </div>
                )}

              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setView('landing')}
                  className="w-1/3 bg-slate-100 hover:bg-slate-200 text-gray-600 py-4 rounded-2xl font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  {language === 'FR' ? "Retour" : "Back"}
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid()}
                  className="w-2/3 bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-950/15 disabled:opacity-35 disabled:shadow-none hover:bg-emerald-700 active:scale-98 transition-all"
                >
                  {language === 'FR' ? "S'inscrire" : "Register"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
