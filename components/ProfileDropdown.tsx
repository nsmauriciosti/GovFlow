
import React, { useState, useRef, useEffect } from 'react';
import { User, ViewType } from '../types';

interface ProfileDropdownProps {
  currentUser: User | null;
  onNavigate: (view: ViewType) => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ currentUser, onNavigate, onLogout, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 p-1 rounded-full transition-all border ${
          isOpen 
          ? 'border-indigo-500 ring-2 ring-indigo-500/10' 
          : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        aria-label="Abrir menu de perfil"
      >
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-inner overflow-hidden">
          {currentUser.avatar ? (
            <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
          ) : (
            currentUser.name.charAt(0).toUpperCase()
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Conta Ativa</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-lg overflow-hidden shrink-0">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{currentUser.name}</p>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-black bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                    {currentUser.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2 space-y-1">
            <button 
              onClick={() => { onNavigate('profile'); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all group"
            >
              <div className="p-1.5 bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 group-hover:text-indigo-600 transition-colors rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              Meu Perfil
            </button>
            <div className="h-px bg-slate-100 dark:bg-slate-800 mx-2 my-1"></div>
            <button 
              onClick={() => { onLogout(); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all group"
            >
              <div className="p-1.5 bg-rose-50 dark:bg-rose-900/30 group-hover:bg-rose-500 group-hover:text-white transition-colors rounded-lg text-rose-600 dark:text-rose-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3 3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </div>
              Encerrar Sessão
            </button>
          </div>
          
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 text-center border-t border-slate-100 dark:border-slate-800 transition-colors">
            <p className="text-[9px] text-slate-400 font-bold italic truncate px-2">{currentUser.email}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
