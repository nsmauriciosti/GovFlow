
import React, { useEffect, useRef } from 'react';
import { Invoice, Situacao } from '../types';
import { formatCurrency, formatDateBR } from '../utils';

interface InvoiceDetailsPanelProps {
  invoice: Invoice | null;
  onClose: () => void;
  theme: 'light' | 'dark';
}

const InvoiceDetailsPanel: React.FC<InvoiceDetailsPanelProps> = ({ invoice, onClose, theme }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (invoice) {
      // Focar o botão de fechar ao abrir para melhorar navegação por teclado
      setTimeout(() => closeButtonRef.current?.focus(), 100);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [invoice, onClose]);

  if (!invoice) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in duration-300 transition-colors" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div 
        className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-[70] animate-in slide-in-from-right duration-500 flex flex-col border-l border-slate-100 dark:border-slate-800 transition-colors"
        role="dialog"
        aria-modal="true"
        aria-labelledby="details-title"
      >
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h3 id="details-title" className="text-xl font-bold text-slate-900 dark:text-slate-100">Detalhes da Nota</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">NF: {invoice.nf} • NE: {invoice.ne}</p>
          </div>
          <button 
            ref={closeButtonRef}
            onClick={onClose} 
            aria-label="Fechar painel de detalhes"
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 focus:ring-2 focus:ring-indigo-500 rounded-full transition-colors outline-none"
          >
            <svg className="w-6 h-6 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Status and Summary */}
          <section aria-labelledby="summary-heading" className="space-y-4">
             <h4 id="summary-heading" className="sr-only">Resumo da Nota</h4>
             <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
               <div className="flex justify-between items-start mb-4">
                 <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${
                   invoice.situacao === Situacao.PAGO ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800'
                 }`}>
                   {invoice.situacao}
                 </span>
                 <span className="text-2xl font-black text-slate-900 dark:text-slate-100 transition-colors" aria-label={`Valor: ${formatCurrency(invoice.valor)}`}>
                   {formatCurrency(invoice.valor)}
                 </span>
               </div>
               
               <div className="grid grid-cols-2 gap-y-4 text-sm mt-6">
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Secretaria</p>
                   <p className="font-bold text-slate-700 dark:text-slate-300">{invoice.secretaria}</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Vencimento</p>
                   <p className="font-bold text-slate-700 dark:text-slate-300">{formatDateBR(invoice.vcto)}</p>
                 </div>
                 <div className="col-span-2">
                   <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Fornecedor</p>
                   <p className="font-bold text-slate-700 dark:text-slate-300 truncate">{invoice.fornecedor}</p>
                 </div>
               </div>
             </div>
          </section>

          {/* History / Timeline */}
          <section aria-labelledby="history-heading" className="space-y-4">
            <h4 id="history-heading" className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Histórico de Eventos
            </h4>
            
            <div className={`relative pl-6 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] ${theme === 'dark' ? 'before:bg-slate-800' : 'before:bg-slate-100'}`}>
              {invoice.history && invoice.history.length > 0 ? (
                invoice.history.map((entry, idx) => (
                  <div key={entry.id} className="relative group">
                    <div className={`absolute -left-[19px] top-1.5 w-[10px] h-[10px] rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500 group-hover:scale-125 transition-transform`} />
                    <div className="bg-white dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 p-3 rounded-xl shadow-sm hover:border-indigo-200 dark:hover:border-indigo-500 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">{formatDateBR(entry.date.split('T')[0])}</span>
                        <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded transition-colors">{entry.user}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-400 font-medium leading-relaxed">{entry.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center transition-colors">
                  <p className="text-xs text-slate-400 dark:text-slate-600 italic">Nenhum evento registrado para esta nota.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 transition-colors">
           <button 
             onClick={onClose}
             className="w-full py-3 bg-slate-900 dark:bg-indigo-600 text-white font-bold rounded-2xl hover:bg-slate-800 dark:hover:bg-indigo-500 focus:ring-4 focus:ring-slate-900/20 dark:focus:ring-indigo-500/20 transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98] outline-none"
           >
             Fechar Visualização
           </button>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'dark' ? '#334155' : '#e2e8f0'}; border-radius: 10px; }
      `}</style>
    </>
  );
};

export default InvoiceDetailsPanel;
