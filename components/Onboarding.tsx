
import React, { useState } from 'react';
import { UserRole } from '../types';

interface OnboardingProps {
  onComplete: (data: { name: string, email: string, phone: string, role: UserRole }) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '' as UserRole | ''
  });

  const roles: UserRole[] = ['Agriculteur', 'Ingénieur Agronome', 'ONG', 'Particulier'];

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.phone && formData.role) {
      onComplete(formData as any);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 flex items-center justify-center p-6">
      <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-500">
        
        <div className="h-1.5 w-full bg-gray-100 flex">
          <div className={`h-full bg-emerald-500 transition-all duration-500 ${step === 1 ? 'w-1/2' : 'w-full'}`}></div>
        </div>

        <div className="p-8 text-center pt-10">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner rotate-3">
            <i className="fa-solid fa-wheat-awn text-4xl text-emerald-600"></i>
          </div>
          <h2 className="text-3xl font-black text-gray-900 leading-tight">AgroVision AI</h2>
          <p className="text-gray-500 mt-2 font-medium">L'agriculture de précision pour l'Afrique</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-2 space-y-5">
          {step === 1 ? (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              <div className="group">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nom Complet</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500 outline-none transition-all"
                  placeholder="Moussa Koné"
                  required
                />
              </div>

              <div className="group">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500 outline-none transition-all"
                  placeholder="moussa@agri.africa"
                  required
                />
              </div>

              <div className="group">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Téléphone</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-emerald-500 outline-none transition-all"
                  placeholder="+223 ..."
                  required
                />
              </div>

              <button
                type="button"
                onClick={nextStep}
                disabled={!formData.name || !formData.email || !formData.phone}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-emerald-900/20 disabled:opacity-30"
              >
                Suivant <i className="fa-solid fa-arrow-right ml-2 text-sm"></i>
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-2">Choisir un profil d'activité</label>
              <div className="grid grid-cols-1 gap-2">
                {roles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFormData({...formData, role: r})}
                    className={`p-4 text-left rounded-2xl border-2 transition-all flex items-center justify-between ${
                      formData.role === r ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-white border-slate-100'
                    }`}
                  >
                    <span className={`font-bold ${formData.role === r ? 'text-emerald-900' : 'text-gray-700'}`}>{r}</span>
                    {formData.role === r && <i className="fa-solid fa-circle-check text-emerald-500"></i>}
                  </button>
                ))}
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 mt-4">
                <i className="fa-solid fa-triangle-exclamation text-amber-500 mt-1"></i>
                <p className="text-[10px] text-amber-800 font-bold leading-tight">
                  IMPORTANT : Les diagnostics de l'IA sont des outils d'aide. L'avis d'un expert humain reste primordial en cas de doute ou de décision majeure.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={prevStep} className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold">Retour</button>
                <button
                  type="submit"
                  disabled={!formData.role}
                  className="flex-[2] bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-xl"
                >
                  Finaliser
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
