
import React, { useState, useEffect } from 'react';
import { SystemSetting } from '../types';

interface SettingsViewProps {
  settings: SystemSetting[];
  onSave: (settings: SystemSetting[]) => void;
  theme: 'light' | 'dark';
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave, theme }) => {
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
    // Pequeno delay para recarregar a página e re-instanciar o cliente Supabase com as novas chaves
    setTimeout(() => window.location.reload(), 1500);
  };

  const isAiEnabled = getValue('ai_enabled') === 'true';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-20 transition-colors">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight transition-colors">Configurações Globais</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 transition-colors">Personalize a identidade visual e informações básicas da plataforma.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
          <div className="p-8 space-y-8">
            {/* Seção Governança de IA */}
            <section className="p-6 bg-indigo-50 dark:bg-indigo-950/20 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/40">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex gap-4">
                  <div className={`p-3 rounded-2xl transition-colors ${isAiEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Motor de Inteligência Artificial</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Controla o uso do Gemini para análise de dados e importação.</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => updateSetting('ai_enabled', isAiEnabled ? 'false' : 'true')}
                  className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none ${isAiEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isAiEnabled ? 'translate-x-9' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="mt-4 flex gap-2">
                <div className="w-1 h-auto bg-indigo-200 dark:bg-indigo-800 rounded-full"></div>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest leading-relaxed">
                  {isAiEnabled 
                    ? "A IA está ATIVA. O sistema gerará resumos executivos e processará notas fiscais automaticamente." 
                    : "A IA está DESATIVADA. O sistema não consumirá tokens e as funcionalidades de análise e importação inteligente ficarão suspensas."}
                </p>
              </div>
            </section>

            <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

            {/* Seção Identidade */}
            <section>
              <h3 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                Identidade Visual
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nome do Sistema</label>
                  <input 
                    type="text"
                    value={getValue('system_name')}
                    onChange={(e) => updateSetting('system_name', e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 dark:text-slate-100 font-bold transition-all placeholder:text-slate-400"
                    placeholder="Ex: GovFlow Pro"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic">Exibido na aba do navegador e no cabeçalho.</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Slogan do Portal</label>
                  <input 
                    type="text"
                    value={getValue('system_slogan')}
                    onChange={(e) => updateSetting('system_slogan', e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 dark:text-slate-100 font-bold transition-all placeholder:text-slate-400"
                    placeholder="Ex: Gestão de Finanças Públicas"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic">Exibido na tela de login.</p>
                </div>
              </div>
            </section>

            <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

            {/* Seção Favicon */}
            <section>
              <h3 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                Favicon & Ícones
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">URL do Favicon (.ico, .png, .svg)</label>
                  <div className="flex gap-4">
                    <input 
                      type="url"
                      value={getValue('favicon_url')}
                      onChange={(e) => updateSetting('favicon_url', e.target.value)}
                      className="flex-1 px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 dark:text-slate-100 font-bold transition-all placeholder:text-slate-400"
                      placeholder="https://exemplo.com/favicon.png"
                    />
                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center p-2 transition-colors">
                      {getValue('favicon_url') ? (
                        <img src={getValue('favicon_url')} alt="Preview" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <div className="text-slate-300 dark:text-slate-700">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="h-px bg-slate-100 dark:bg-slate-800 transition-colors"></div>

            {/* Seção Banco de Dados (Supabase) */}
            <section>
              <h3 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                Integração Supabase (Persistência em Nuvem)
              </h3>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Supabase URL</label>
                  <input 
                    type="text"
                    value={getValue('supabase_url')}
                    onChange={(e) => updateSetting('supabase_url', e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 dark:text-slate-100 font-mono text-xs transition-all"
                    placeholder="https://xxxxx.supabase.co"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Supabase Anon Key</label>
                  <input 
                    type="password"
                    value={getValue('supabase_key')}
                    onChange={(e) => updateSetting('supabase_key', e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 dark:text-slate-100 font-mono text-xs transition-all"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  />
                  <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-2 font-bold italic transition-colors">⚠️ Nota: Alterar estas chaves reiniciará a conexão com o banco. Se o link for inválido (404), o sistema usará o armazenamento local.</p>
                </div>
              </div>
            </section>

            <div className="h-px bg-slate-100 dark:bg-slate-800 transition-colors"></div>

            {/* Seção Rodapé */}
            <section>
              <h3 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                Informações de Rodapé
              </h3>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Texto de Direitos/Aviso</label>
                <textarea 
                  value={getValue('footer_text')}
                  onChange={(e) => updateSetting('footer_text', e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 dark:text-slate-100 font-bold transition-all h-24 resize-none placeholder:text-slate-400"
                  placeholder="Ex: Sistema restrito para servidores autorizados."
                />
              </div>
            </section>
          </div>

          <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end transition-colors">
            <button 
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
            >
              Salvar Alterações e Reiniciar Conexão
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SettingsView;
