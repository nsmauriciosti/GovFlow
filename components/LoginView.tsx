
import React, { useState } from 'react';
import { UserRole } from '../types';

interface LoginViewProps {
  onLogin: (email: string, pass: string) => void;
  error?: string;
  isLoading?: boolean;
  systemName: string;
  systemSlogan: string;
  footerText: string;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, error, isLoading, systemName, systemSlogan, footerText }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  const [firstName, ...rest] = systemName.split(' ');
  const lastName = rest.join(' ');

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md p-4 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden">
          <div className="p-10">
            <div className="flex flex-col items-center mb-10">
              <div className="bg-indigo-600 p-4 rounded-2xl shadow-xl shadow-indigo-600/20 mb-6">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                {firstName} <span className="text-indigo-500">{lastName}</span>
              </h1>
              <p className="text-slate-400 text-sm mt-2 font-medium">{systemSlogan}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-2xl text-xs font-bold flex flex-col gap-2 animate-shake">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">E-mail Corporativo</label>
                  <input 
                    required
                    type="email" 
                    placeholder="exemplo@gov.br"
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-white text-sm transition-all placeholder:text-slate-600"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Senha de Acesso</label>
                  <input 
                    required
                    type="password" 
                    placeholder="••••••••"
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-white text-sm transition-all placeholder:text-slate-600"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-black text-sm rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                ) : (
                  <>
                    Entrar no Sistema
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="bg-white/[0.02] border-t border-white/5 p-6 text-center">
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed whitespace-pre-wrap">
              {footerText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
