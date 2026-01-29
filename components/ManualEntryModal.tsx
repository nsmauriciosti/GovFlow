
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
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 custom-scrollbar transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-600/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{invoice ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Manual Data Entry</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-all p-2 hover:bg-slate-200/50 dark:hover:bg-slate-700 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Secretaria Destinatária</label>
              <input 
                required
                type="text" 
                placeholder="Ex: Secretaria de Saúde"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-600/10 dark:focus:ring-indigo-500/10 focus:border-indigo-600 dark:focus:border-indigo-500 outline-none text-sm font-bold text-slate-900 dark:text-slate-100 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                value={formData.secretaria}
                onChange={(e) => setFormData({...formData, secretaria: e.target.value})}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Razão Social do Fornecedor</label>
              <input 
                required
                type="text" 
                placeholder="Ex: Comércio de Medicamentos LTDA"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-600/10 dark:focus:ring-indigo-500/10 focus:border-indigo-600 dark:focus:border-indigo-500 outline-none text-sm font-bold text-slate-900 dark:text-slate-100 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                value={formData.fornecedor}
                onChange={(e) => setFormData({...formData, fornecedor: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Nota de Empenho (NE)</label>
              <input 
                type="text" 
                placeholder="2024NE0001"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-600/10 dark:focus:ring-indigo-500/10 focus:border-indigo-600 dark:focus:border-indigo-500 outline-none text-sm font-bold text-slate-900 dark:text-slate-100 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                value={formData.ne}
                onChange={(e) => setFormData({...formData, ne: e.target.value})}
              />
            </div>
            
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-1 ${errors.nf ? 'text-rose-600' : 'text-slate-400 dark:text-slate-500'}`}>
                Nota Fiscal (NF) *
              </label>
              <input 
                required
                type="text" 
                placeholder="000.123.456"
                className={`w-full px-4 py-3 border rounded-2xl outline-none text-sm font-black text-slate-900 dark:text-slate-100 transition-all ${
                  errors.nf ? 'border-rose-500 dark:border-rose-700 bg-rose-50/30 dark:bg-rose-950/20 ring-4 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-4 focus:ring-indigo-600/10 dark:focus:ring-indigo-500/10 focus:border-indigo-600 dark:focus:border-indigo-500'
                }`}
                value={formData.nf}
                onChange={(e) => {
                  setFormData({...formData, nf: e.target.value});
                  if (errors.nf) setErrors(prev => { const n = {...prev}; delete n.nf; return n; });
                }}
              />
              {errors.nf && <p className="text-[10px] text-rose-600 dark:text-rose-400 font-black mt-1.5 ml-1 uppercase">{errors.nf}</p>}
            </div>

            <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-800 my-2"></div>

            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Valor do Título (R$)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 font-black text-xs">R$</span>
                <input 
                  required
                  type="number" 
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  className={`w-full pl-10 pr-4 py-3 border rounded-2xl outline-none text-sm font-black text-slate-900 dark:text-slate-100 transition-all ${
                    errors.valor ? 'border-rose-500 dark:border-rose-700 bg-rose-50/30 dark:bg-rose-950/20 ring-4 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-4 focus:ring-indigo-600/10 dark:focus:ring-indigo-500/10 focus:border-indigo-600 dark:focus:border-indigo-500'
                  }`}
                  value={formData.valor}
                  onChange={(e) => setFormData({...formData, valor: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-2 ml-1">Data de Vencimento *</label>
              <input 
                required
                type="date" 
                className="w-full px-4 py-3 border border-indigo-200 dark:border-indigo-900 rounded-2xl focus:ring-4 focus:ring-indigo-600/10 dark:focus:ring-indigo-500/10 focus:border-indigo-600 dark:focus:border-indigo-500 outline-none text-sm font-black text-slate-900 dark:text-slate-100 bg-indigo-50/30 dark:bg-indigo-950/20 transition-colors"
                value={formData.vcto}
                onChange={(e) => setFormData({...formData, vcto: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Situação do Título</label>
              <select 
                className={`w-full px-4 py-3 border rounded-2xl focus:ring-4 outline-none text-xs font-black transition-all ${
                  formData.situacao === Situacao.PAGO 
                  ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 focus:ring-emerald-500/10 focus:border-emerald-500' 
                  : formData.situacao === Situacao.CANCELADO
                  ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 focus:ring-slate-400/10 focus:border-slate-400'
                  : 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 focus:ring-rose-500/10 focus:border-rose-500'
                }`}
                value={formData.situacao}
                onChange={(e) => handleSituacaoChange(e.target.value as Situacao)}
              >
                <option value={Situacao.NAO_PAGO}>🔴 PENDENTE (NÃO PAGO)</option>
                <option value={Situacao.PAGO}>🟢 LIQUIDADO (PAGO)</option>
                <option value={Situacao.CANCELADO}>⚪ CANCELADO</option>
              </select>
            </div>

            <div>
              <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-2 ml-1 transition-colors ${
                formData.situacao === Situacao.PAGO ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
              }`}>
                Data da Liquidação {formData.situacao === Situacao.PAGO ? '*' : ''}
              </label>
              <input 
                type="date" 
                required={formData.situacao === Situacao.PAGO}
                disabled={formData.situacao !== Situacao.PAGO}
                className={`w-full px-4 py-3 border rounded-2xl focus:ring-4 outline-none text-sm font-black transition-all ${
                  formData.situacao === Situacao.PAGO 
                  ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-slate-900 dark:text-slate-100 focus:ring-emerald-600/10 dark:focus:ring-emerald-500/10 focus:border-emerald-600 dark:focus:border-emerald-500' 
                  : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
                }`}
                value={formData.pgto}
                onChange={(e) => setFormData({...formData, pgto: e.target.value})}
              />
              {errors.pgto && <p className="text-[10px] text-rose-600 dark:text-rose-400 font-black mt-1.5 ml-1 uppercase">{errors.pgto}</p>}
            </div>

            {invoice && (
              <div className="md:col-span-2 mt-4">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Linha do Tempo / Histórico</label>
                <textarea 
                  readOnly
                  className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-[11px] font-mono text-slate-600 dark:text-slate-400 resize-none outline-none focus:ring-0 cursor-default shadow-inner transition-colors"
                  value={formattedHistory || "Sem eventos registrados."}
                />
              </div>
            )}
          </div>

          <div className="pt-8 flex flex-col sm:flex-row justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900 pb-2 mt-4 transition-colors">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3.5 rounded-2xl text-slate-500 dark:text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Descartar
            </button>
            <button
              type="submit"
              className="px-10 py-3.5 rounded-2xl bg-slate-900 dark:bg-indigo-600 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-xl shadow-slate-900/20 dark:shadow-indigo-600/20 active:scale-95"
            >
              {invoice ? 'Salvar Alterações' : 'Confirmar Registro'}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'dark' ? '#334155' : '#e2e8f0'}; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${theme === 'dark' ? '#475569' : '#cbd5e1'}; }
      `}</style>
    </div>
  );
};

export default ManualEntryModal;
