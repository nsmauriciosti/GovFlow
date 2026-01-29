
import React, { useState, useEffect } from 'react';
import { SystemSetting } from '../types';

interface SettingsViewProps {
  settings: SystemSetting[];
  onSave: (settings: SystemSetting[]) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<SystemSetting[]>([]);

  useEffect(() => {
    setLocalSettings([...settings]);
  }, [settings]);

  const updateSetting = (key: string, value: string) => {
    setLocalSettings(prev => {
      const exists = prev.find(s => s.key === key);
      if (exists) {
        return prev.map(s => s.key === key ? { ...s, value } : s);
      }
      return [...prev, { key, value }];
    });
  };

  const getValue = (key: string) => localSettings.find(s => s.key === key)?.value || '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localSettings);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Configurações Globais</h2>
        <p className="text-slate-500 text-sm mt-1">Personalize a identidade visual e informações básicas da plataforma.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 space-y-8">
            {/* Seção Identidade */}
            <section>
              <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                Identidade Visual
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Sistema</label>
                  <input 
                    type="text"
                    value={getValue('system_name')}
                    onChange={(e) => updateSetting('system_name', e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 font-bold transition-all"
                    placeholder="Ex: GovFlow Pro"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 italic">Exibido na aba do navegador e no cabeçalho.</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Slogan do Portal</label>
                  <input 
                    type="text"
                    value={getValue('system_slogan')}
                    onChange={(e) => updateSetting('system_slogan', e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 font-bold transition-all"
                    placeholder="Ex: Gestão de Finanças Públicas"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 italic">Exibido na tela de login.</p>
                </div>
              </div>
            </section>

            <div className="h-px bg-slate-100"></div>

            {/* Seção Favicon */}
            <section>
              <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                Favicon & Ícones
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">URL do Favicon (.ico, .png, .svg)</label>
                  <div className="flex gap-4">
                    <input 
                      type="url"
                      value={getValue('favicon_url')}
                      onChange={(e) => updateSetting('favicon_url', e.target.value)}
                      className="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 font-bold transition-all"
                      placeholder="https://exemplo.com/favicon.png"
                    />
                    <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center p-2">
                      {getValue('favicon_url') ? (
                        <img src={getValue('favicon_url')} alt="Preview" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <div className="text-slate-300">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="h-px bg-slate-100"></div>

            {/* Seção Rodapé */}
            <section>
              <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                Informações de Rodapé
              </h3>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Texto de Direitos/Aviso</label>
                <textarea 
                  value={getValue('footer_text')}
                  onChange={(e) => updateSetting('footer_text', e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 font-bold transition-all h-24 resize-none"
                  placeholder="Ex: Sistema restrito para servidores autorizados."
                />
              </div>
            </section>
          </div>

          <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button 
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SettingsView;
