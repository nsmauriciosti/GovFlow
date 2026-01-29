
import React, { useState, useRef } from 'react';
import { User } from '../types';

interface ProfileViewProps {
  user: User;
  onSave: (userData: User) => void;
  onToast: (msg: string, type: any) => void;
  theme: 'light' | 'dark';
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, onSave, onToast, theme }) => {
  const [formData, setFormData] = useState<User>({ ...user });
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        onToast("A imagem deve ter menos de 1MB", "warning");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      onToast("Perfil atualizado com sucesso!", "success");
    } catch (err) {
      onToast("Erro ao atualizar perfil.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Meu Perfil</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gerencie suas informações pessoais e credenciais de acesso.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
          {/* Header/Banner Perfil */}
          <div className="h-32 bg-gradient-to-r from-indigo-600 to-indigo-800 relative">
            <div className="absolute -bottom-12 left-10">
              <div className="relative group">
                <div className="w-28 h-28 rounded-[2rem] bg-white dark:bg-slate-900 p-1.5 shadow-xl transition-colors">
                  <div className="w-full h-full rounded-[1.6rem] bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-100 dark:border-slate-800 transition-colors">
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-black text-indigo-300 dark:text-indigo-800">{formData.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 -right-1 bg-indigo-600 text-white p-2 rounded-xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95 z-10"
                  title="Mudar Foto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              </div>
            </div>
          </div>

          <div className="p-10 pt-16 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/10 focus:border-indigo-600 dark:focus:border-indigo-500 outline-none text-slate-900 dark:text-slate-100 font-bold transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">E-mail (Login)</label>
                <input 
                  type="email" 
                  value={formData.email}
                  disabled
                  className="w-full px-5 py-3.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-600 font-bold cursor-not-allowed transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                <input 
                  type="text" 
                  placeholder="(00) 00000-0000"
                  value={formData.phone || ''}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/10 focus:border-indigo-600 dark:focus:border-indigo-500 outline-none text-slate-900 dark:text-slate-100 font-bold transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nível de Acesso</label>
                <div className="px-5 py-3.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase transition-colors">
                  {formData.role}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Breve Biografia / Cargo</label>
              <textarea 
                value={formData.bio || ''}
                onChange={e => setFormData({...formData, bio: e.target.value})}
                placeholder="Descreva sua função ou cargo na secretaria..."
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/10 focus:border-indigo-600 dark:focus:border-indigo-500 outline-none text-slate-900 dark:text-slate-100 font-medium transition-all h-28 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Segurança da Conta</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Último acesso em: {formData.lastLogin}</p>
              </div>
              <button 
                type="button"
                className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase hover:underline"
                onClick={() => onToast("Funcionalidade de troca de senha em desenvolvimento.", "info")}
              >
                Alterar Senha
              </button>
            </div>
          </div>

          <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end transition-colors">
            <button 
              type="submit"
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-10 py-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Salvando...
                </>
              ) : "Atualizar Cadastro"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProfileView;
