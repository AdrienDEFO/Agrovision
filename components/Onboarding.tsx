import React, { useState } from 'react';
import { UserRole } from '../types';

interface OnboardingProps {
  onComplete: (data: { name: string; phone: string; city: string; role: UserRole }) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    role: '' as UserRole | '',
    customRole: ''
  });

  const roles = ['Agriculteur', 'Ingénieur Agronome', 'ONG', 'Particulier', 'Autres'] as const;

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
        
        <div className="p-8 text-center pt-10">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner rotate-3">
            <i className="fa-solid fa-wheat-awn text-4xl text-emerald-600"></i>
          </div>
          <h2 className="text-3xl font-black text-gray-900 leading-tight">AgroVision AI</h2>
          <p className="text-gray-500 mt-2 font-semibold text-xs uppercase tracking-wider">L'agriculture de précision pour l'Afrique</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-0 space-y-4">
          <div className="space-y-4">
            
            {/* Nom & Prénom */}
            <div className="group">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                Nom et Prénom
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
                Numéro de Téléphone
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
                Ville
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
                Choisissez votre fonction
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
                  Spécifiez votre fonction
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

          <button
            type="submit"
            disabled={!isFormValid()}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-950/15 disabled:opacity-35 disabled:shadow-none hover:bg-emerald-700 active:scale-98 transition-all mt-4"
          >
            S'inscrire et Commencer
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
