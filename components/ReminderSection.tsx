
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

  const reminders3 = upcoming.filter(inv => inv.daysLeft >= 0 && inv.daysLeft <= 3);
  const reminders5 = upcoming.filter(inv => inv.daysLeft === 5);
  const reminders15 = upcoming.filter(inv => inv.daysLeft === 15);

  const hasReminders = reminders3.length > 0 || reminders5.length > 0 || reminders15.length > 0;

  if (!hasReminders) return null;

  return (
    <div className="mt-8 space-y-5 no-print animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-3 mb-1">
        <div className="bg-slate-900 p-2 rounded-lg shadow-sm">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800 tracking-tight leading-none flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" />
            </svg>
            Radar de Vencimentos
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">Monitoramento automático de prazos críticos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Urgente - 3 Dias */}
        {reminders3.length > 0 && (
          <div className="bg-white border border-rose-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="bg-rose-50/50 px-4 py-3 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-rose-700 font-bold text-[10px] uppercase tracking-wider">Urgente (≤ 3 dias)</span>
              </div>
              <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">{reminders3.length}</span>
            </div>
            <div className="p-3 space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar">
              {reminders3.map(inv => (
                <div key={inv.id} className="group p-2.5 rounded-xl border border-slate-50 hover:border-rose-200 hover:bg-rose-50/30 transition-all flex justify-between items-center bg-slate-50/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 text-xs truncate">{inv.fornecedor}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                       <span className="text-[10px] font-semibold text-slate-400">{formatDateBR(inv.vcto)}</span>
                       <span className="text-[10px] px-1.5 py-0.25 rounded bg-rose-100 text-rose-700 font-bold">Hoje +{inv.daysLeft}d</span>
                    </div>
                  </div>
                  <p className="font-bold text-slate-900 text-xs ml-3">{formatCurrency(inv.valor)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Atenção - 5 Dias */}
        {reminders5.length > 0 && (
          <div className="bg-white border border-amber-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="bg-amber-50/50 px-4 py-3 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-amber-700 font-bold text-[10px] uppercase tracking-wider">Atenção (5 dias)</span>
              </div>
              <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">{reminders5.length}</span>
            </div>
            <div className="p-3 space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar">
              {reminders5.map(inv => (
                <div key={inv.id} className="group p-2.5 rounded-xl border border-slate-50 hover:border-amber-200 hover:bg-amber-50/30 transition-all flex justify-between items-center bg-slate-50/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 text-xs truncate">{inv.fornecedor}</p>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{formatDateBR(inv.vcto)} • <span className="text-amber-600">Faltam 5 dias</span></p>
                  </div>
                  <p className="font-bold text-slate-900 text-xs ml-3">{formatCurrency(inv.valor)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Programação - 15 Dias */}
        {reminders15.length > 0 && (
          <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="bg-indigo-50/50 px-4 py-3 border-b border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" />
                </svg>
                <span className="text-indigo-700 font-bold text-[10px] uppercase tracking-wider">Planejamento (15 dias)</span>
              </div>
              <span className="bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">{reminders15.length}</span>
            </div>
            <div className="p-3 space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar">
              {reminders15.map(inv => (
                <div key={inv.id} className="group p-2.5 rounded-xl border border-slate-50 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all flex justify-between items-center bg-slate-50/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 text-xs truncate">{inv.fornecedor}</p>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{formatDateBR(inv.vcto)} • <span className="text-indigo-600">Em 2 semanas</span></p>
                  </div>
                  <p className="font-bold text-slate-900 text-xs ml-3">{formatCurrency(inv.valor)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default ReminderSection;
