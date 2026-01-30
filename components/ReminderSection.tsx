
import React from 'react';
import { Invoice, Situacao } from '../types';
import { getDaysUntil, formatCurrency, formatDateBR } from '../utils';

interface ReminderSectionProps {
  invoices: Invoice[];
}

const ReminderSection: React.FC<ReminderSectionProps> = ({ invoices }) => {
  const upcoming = invoices.filter(inv => inv.situacao === Situacao.NAO_PAGO).map(inv => ({
    ...inv,
    daysLeft: getDaysUntil(inv.vcto)
  }));

  // Lógica para lembretes específicos
  const remindersCritical = upcoming.filter(inv => inv.daysLeft <= 3); // Crítico: 3 dias ou menos (inclui atrasados)
  const remindersWarning = upcoming.filter(inv => inv.daysLeft > 3 && inv.daysLeft <= 5); // Alerta: 4 a 5 dias
  const remindersPlanning = upcoming.filter(inv => inv.daysLeft > 5 && inv.daysLeft <= 15); // Planejamento: 6 a 15 dias

  const hasReminders = remindersCritical.length > 0 || remindersWarning.length > 0 || remindersPlanning.length > 0;

  if (!hasReminders) return null;

  return (
    <div className="mt-4 space-y-4 no-print animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-center gap-3 mb-1">
        <div className="bg-slate-900 dark:bg-indigo-600 p-2 rounded-xl shadow-lg">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div>
          <h3 className="text-base lg:text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">
            Radar de Vencimentos
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Alertas automáticos: 3, 5 e 15 dias</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {/* Crítico - 3 Dias ou Menos */}
        {remindersCritical.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/50 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
            <div className="bg-rose-50/50 dark:bg-rose-950/20 px-4 py-3 border-b border-rose-100 dark:border-rose-900/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-rose-700 dark:text-rose-400 font-black text-[10px] uppercase tracking-wider">Urgente (≤ 3d)</span>
              </div>
              <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black shadow-sm">{remindersCritical.length}</span>
            </div>
            <div className="p-3 space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
              {remindersCritical.map(inv => (
                <div key={inv.id} className="group p-2.5 rounded-xl border border-slate-50 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900 transition-all flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate">{inv.fornecedor}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                       <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{formatDateBR(inv.vcto)}</span>
                       <span className={`text-[9px] px-1.5 py-0.25 rounded-md font-black uppercase ${inv.daysLeft < 0 ? 'bg-rose-600 text-white animate-pulse' : 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400'}`}>
                         {inv.daysLeft < 0 ? `Atrasado` : (inv.daysLeft === 0 ? 'Hoje' : `${inv.daysLeft}d`)}
                       </span>
                    </div>
                  </div>
                  <p className="font-black text-slate-900 dark:text-slate-100 text-[11px] ml-3">{formatCurrency(inv.valor)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerta - 5 Dias */}
        {remindersWarning.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-900/50 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
            <div className="bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 border-b border-amber-100 dark:border-amber-900/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-amber-700 dark:text-amber-400 font-black text-[10px] uppercase tracking-wider">Atenção (≤ 5d)</span>
              </div>
              <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black shadow-sm">{remindersWarning.length}</span>
            </div>
            <div className="p-3 space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
              {remindersWarning.map(inv => (
                <div key={inv.id} className="group p-2.5 rounded-xl border border-slate-50 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-900 transition-all flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate">{inv.fornecedor}</p>
                    <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">{formatDateBR(inv.vcto)} • <span className="text-amber-600 dark:text-amber-400 font-black tracking-tight">{inv.daysLeft} dias para vencer</span></p>
                  </div>
                  <p className="font-black text-slate-900 dark:text-slate-100 text-[11px] ml-3">{formatCurrency(inv.valor)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Planejamento - 15 Dias */}
        {remindersPlanning.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 px-4 py-3 border-b border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" />
                </svg>
                <span className="text-indigo-700 dark:text-indigo-400 font-black text-[10px] uppercase tracking-wider">Monitoramento (≤ 15d)</span>
              </div>
              <span className="bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black shadow-sm">{remindersPlanning.length}</span>
            </div>
            <div className="p-3 space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
              {remindersPlanning.map(inv => (
                <div key={inv.id} className="group p-2.5 rounded-xl border border-slate-50 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate">{inv.fornecedor}</p>
                    <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">{formatDateBR(inv.vcto)} • <span className="text-indigo-600 dark:text-indigo-400 font-black tracking-tight">{inv.daysLeft} dias restantes</span></p>
                  </div>
                  <p className="font-black text-slate-900 dark:text-slate-100 text-[11px] ml-3">{formatCurrency(inv.valor)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default ReminderSection;
