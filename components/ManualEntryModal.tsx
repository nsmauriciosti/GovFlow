
import React, { useState, useEffect } from 'react';
import { Invoice, Situacao } from '../types';
import { generateId, formatDateBR } from '../utils';
import { ToastType } from './Toast';

interface ManualEntryModalProps {
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
  onToast: (msg: string, type: ToastType) => void;
  invoice?: Invoice | null;
  theme: 'light' | 'dark';
}

const ManualEntryModal: React.FC<ManualEntryModalProps> = ({ onClose, onSave, onToast, invoice, theme }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    secretaria: '',
    fornecedor: '',
    ne: '',
    nf: '',
    valor: '',
    vcto: new Date().toISOString().split('T')[0],
    pgto: '',
    situacao: Situacao.NAO_PAGO
  });

  useEffect(() => {
    if (invoice) {
      setFormData({
        secretaria: invoice.secretaria,
        fornecedor: invoice.fornecedor,
        ne: invoice.ne,
        nf: invoice.nf,
        valor: invoice.valor.toString(),
        vcto: invoice.vcto,
        pgto: invoice.pgto || '',
        situacao: invoice.situacao
      });
    }
  }, [invoice]);

  const formattedHistory = (invoice?.history || [])
    .map(entry => `[${formatDateBR(entry.date.split('T')[0])}] ${entry.user}: ${entry.description}`)
    .join('\n');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    
    const valorNum = parseFloat(formData.valor);
    
    if (!formData.nf.trim()) {
      newErrors.nf = "Número da NF obrigatório.";
    }

    if (isNaN(valorNum) || valorNum <= 0) {
      newErrors.valor = "Valor financeiro inválido.";
    }

    if (formData.situacao === Situacao.PAGO && !formData.pgto) {
      newErrors.pgto = "Data de pagamento necessária.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      onToast("Verifique os campos obrigatórios antes de salvar.", "warning");
      return;
    }

    const updatedInvoice: Invoice = {
      id: invoice?.id || generateId(),
      secretaria: formData.secretaria.trim() || 'NÃO INFORMADA',
      fornecedor: formData.fornecedor.trim() || 'NÃO INFORMADO',
      ne: formData.ne.trim() || '---',
      nf: formData.nf.trim(), 
      valor: valorNum,
      vcto: formData.vcto,
      pgto: formData.situacao === Situacao.PAGO ? formData.pgto : null,
      situacao: formData.situacao,
      history: invoice?.history || []
    };

    onSave(updatedInvoice);
    onClose();
  };

  const handleSituacaoChange = (newSit: Situacao) => {
    setFormData(prev => {
      let updatedPgto = prev.pgto;
      if (newSit === Situacao.PAGO && !prev.pgto) {
        updatedPgto = new Date().toISOString().split('T')[0];
      }
      if (newSit !== Situacao.PAGO) {
        updatedPgto = '';
      }
      return {
        ...prev,
        situacao: newSit,
        pgto: updatedPgto
      };
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[95vh] flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 transition-colors">
        <div className="p-5 lg:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl sm:rounded-t-[2rem] transition-colors">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            </div>
            <div>
              <h3 className="text-lg lg:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{invoice ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Entrada de Dados</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-all p-2 hover:bg-slate-200/50 dark:hover:bg-slate-700 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 lg:p-8 space-y-5 lg:space-y-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <div className="md:col-span-2">
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1">Secretaria Destinatária</label>
              <input required type="text" placeholder="Ex: Secretaria de Saúde" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none text-sm font-bold text-slate-900 dark:text-slate-100 transition-all" value={formData.secretaria} onChange={(e) => setFormData({...formData, secretaria: e.target.value})} />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1">Fornecedor</label>
              <input required type="text" placeholder="Razão Social..." className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none text-sm font-bold text-slate-900 dark:text-slate-100 transition-all" value={formData.fornecedor} onChange={(e) => setFormData({...formData, fornecedor: e.target.value})} />
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1">NE (Empenho)</label>
              <input type="text" placeholder="2024NE0001" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-bold text-slate-900 dark:text-slate-100" value={formData.ne} onChange={(e) => setFormData({...formData, ne: e.target.value})} />
            </div>
            
            <div>
              <label className={`block text-[9px] font-black uppercase mb-1.5 ml-1 ${errors.nf ? 'text-rose-600' : 'text-slate-400'}`}>Nota Fiscal *</label>
              <input required type="text" placeholder="Número..." className={`w-full px-4 py-2.5 border rounded-xl outline-none text-sm font-black transition-all ${errors.nf ? 'border-rose-500 bg-rose-50/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'}`} value={formData.nf} onChange={(e) => {setFormData({...formData, nf: e.target.value}); if (errors.nf) setErrors(prev => { const n = {...prev}; delete n.nf; return n; });}} />
            </div>

            <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-800 my-1"></div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1">Valor (R$)</label>
              <input required type="number" step="0.01" min="0" placeholder="0,00" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm font-black text-slate-900 dark:text-slate-100" value={formData.valor} onChange={(e) => setFormData({...formData, valor: e.target.value})} />
            </div>

            <div>
              <label className="block text-[9px] font-black text-indigo-600 uppercase mb-1.5 ml-1">Vencimento *</label>
              <input required type="date" className="w-full px-4 py-2.5 border border-indigo-200 dark:border-indigo-900 rounded-xl outline-none text-sm font-black text-slate-900 dark:text-slate-100 bg-indigo-50/10" value={formData.vcto} onChange={(e) => setFormData({...formData, vcto: e.target.value})} />
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1">Situação</label>
              <select className="w-full px-4 py-2.5 border rounded-xl outline-none text-xs font-black bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-slate-100" value={formData.situacao} onChange={(e) => handleSituacaoChange(e.target.value as Situacao)}>
                <option value={Situacao.NAO_PAGO}>🔴 PENDENTE</option>
                <option value={Situacao.PAGO}>🟢 LIQUIDADO</option>
                <option value={Situacao.CANCELADO}>⚪ CANCELADO</option>
              </select>
            </div>

            <div>
              <label className={`block text-[9px] font-black uppercase mb-1.5 ml-1 ${formData.situacao === Situacao.PAGO ? 'text-emerald-600' : 'text-slate-400'}`}>Liquidação</label>
              <input type="date" disabled={formData.situacao !== Situacao.PAGO} className={`w-full px-4 py-2.5 border rounded-xl outline-none text-sm font-black transition-all ${formData.situacao === Situacao.PAGO ? 'bg-emerald-50/10 border-emerald-200' : 'bg-slate-100 dark:bg-slate-950 cursor-not-allowed border-slate-200 dark:border-slate-800 opacity-50'}`} value={formData.pgto} onChange={(e) => setFormData({...formData, pgto: e.target.value})} />
            </div>

            {invoice && (
              <div className="md:col-span-2 mt-2">
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1.5 ml-1">Histórico</label>
                <textarea readOnly className="w-full h-24 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-mono text-slate-600 dark:text-slate-400 resize-none outline-none" value={formattedHistory || "Sem histórico."} />
              </div>
            )}
          </div>
        </form>

        <div className="p-5 lg:p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl sm:rounded-b-[2rem] flex flex-col sm:flex-row gap-2 lg:gap-3 transition-colors">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl text-slate-500 font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-all order-2 sm:order-1">Cancelar</button>
          <button onClick={handleSubmit} className="px-8 py-3 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white font-black text-[10px] sm:text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-xl order-1 sm:order-2 flex-1 sm:flex-none">Confirmar Registro</button>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ManualEntryModal;
