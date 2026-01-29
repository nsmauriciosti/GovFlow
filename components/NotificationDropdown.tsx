
import React, { useState, useRef, useEffect } from 'react';
import { Invoice, Situacao } from '../types';
import { formatCurrency, formatDateBR, getDaysUntil } from '../utils';

interface NotificationDropdownProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  theme: 'light' | 'dark';
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ invoices, onSelectInvoice, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const upcoming = invoices.filter(inv => inv.situacao === Situacao.NAO_PAGO).map(inv => ({
    ...inv,
    daysLeft: getDaysUntil(inv.vcto)
  }));

  const critical = upcoming.filter(inv => inv.daysLeft <= 3);
  const warning = upcoming.filter(inv => inv.daysLeft === 5);
  const planning = upcoming.filter(inv => inv.daysLeft === 15);
  
  const totalCount = critical.length + warning.length + planning.length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all outline-none focus:ring-2 focus:ring-indigo-500/20 ${
          isOpen ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        aria-label="Abrir Radar de Vencimentos"
      >
        <svg className={`w-6 h-6 ${totalCount > 0 && !isOpen ? 'animate-bell' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {totalCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[10px] font-black text-white items-center justify-center">
              {totalCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200 transition-colors">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center transition-colors">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">Radar de Vencimentos</h4>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full">{totalCount} Pendências</span>
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {totalCount === 0 ? (
              <div className="p-8 text-center">
                <div className="bg-slate-50 dark:bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors">
                  <svg className="w-6 h-6 text-slate-300 dark:text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="text-sm text-slate-400 dark:text-slate-600 font-medium">Tudo em dia no monitoramento!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-800 transition-colors">
                {/* Críticos */}
                {critical.map(inv => (
                  <button 
                    key={inv.id} 
                    onClick={() => { onSelectInvoice(inv); setIsOpen(false); }}
                    className="w-full p-4 flex gap-3 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors text-left border-l-4 border-l-transparent hover:border-l-rose-500"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-tight mb-0.5">Vencimento Crítico</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{inv.fornecedor}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-500 font-medium">{formatCurrency(inv.valor)} • {inv.daysLeft < 0 ? `Vencido há ${Math.abs(inv.daysLeft)} dias` : (inv.daysLeft === 0 ? 'Vence Hoje' : `Vence em ${inv.daysLeft} dias`)}</p>
                    </div>
                  </button>
                ))}

                {/* Atenção */}
                {warning.map(inv => (
                  <button 
                    key={inv.id} 
                    onClick={() => { onSelectInvoice(inv); setIsOpen(false); }}
                    className="w-full p-4 flex gap-3 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors text-left border-l-4 border-l-transparent hover:border-l-amber-500"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-tight mb-0.5">Atenção (5 dias)</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{inv.fornecedor}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-500 font-medium">{formatCurrency(inv.valor)} • Vencimento: {formatDateBR(inv.vcto)}</p>
                    </div>
                  </button>
                ))}

                {/* Planejamento */}
                {planning.map(inv => (
                  <button 
                    key={inv.id} 
                    onClick={() => { onSelectInvoice(inv); setIsOpen(false); }}
                    className="w-full p-4 flex gap-3 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors text-left border-l-4 border-l-transparent hover:border-l-indigo-500"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" /></svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-tight mb-0.5">Planejamento (15 dias)</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{inv.fornecedor}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-500 font-medium">{formatCurrency(inv.valor)} • Vencimento: {formatDateBR(inv.vcto)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 text-center transition-colors">
            <button onClick={() => setIsOpen(false)} className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 uppercase tracking-widest transition-colors">Fechar Painel</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bell-swing {
          0% { transform: rotate(0); }
          10% { transform: rotate(15deg); }
          20% { transform: rotate(-10deg); }
          30% { transform: rotate(5deg); }
          40% { transform: rotate(-5deg); }
          50% { transform: rotate(0); }
          100% { transform: rotate(0); }
        }
        .animate-bell {
          animation: bell-swing 2s ease-in-out infinite;
          transform-origin: top center;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'dark' ? '#334155' : '#e2e8f0'}; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default NotificationDropdown;
