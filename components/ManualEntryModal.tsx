
import React, { useState, useEffect } from 'react';
import { Invoice, Situacao } from '../types';
import { generateId, formatDateBR } from '../utils';
import { ToastType } from './Toast';

interface ManualEntryModalProps {
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
  onToast: (msg: string, type: ToastType) => void;
  invoice?: Invoice | null;
}

const ManualEntryModal: React.FC<ManualEntryModalProps> = ({ onClose, onSave, onToast, invoice }) => {
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
      if (newSit === Situacao.NAO_PAGO) {
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200 animate-in zoom-in-95 duration-200 custom-scrollbar">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800">{invoice ? 'Editar Registro Financeiro' : 'Novo Registro Manual'}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Secretaria</label>
              <input 
                required
                type="text" 
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none text-sm text-slate-900 transition-shadow bg-white"
                value={formData.secretaria}
                onChange={(e) => setFormData({...formData, secretaria: e.target.value})}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Fornecedor</label>
              <input 
                required
                type="text" 
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none text-sm text-slate-900 transition-shadow bg-white"
                value={formData.fornecedor}
                onChange={(e) => setFormData({...formData, fornecedor: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Nota de Empenho (NE)</label>
              <input 
                type="text" 
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none text-sm text-slate-900 transition-shadow bg-white"
                value={formData.ne}
                onChange={(e) => setFormData({...formData, ne: e.target.value})}
              />
            </div>
            
            <div>
              <label className={`block text-xs font-bold uppercase mb-1 tracking-wider ${errors.nf ? 'text-rose-600' : 'text-indigo-600'}`}>
                Nota Fiscal (NF) *
              </label>
              <input 
                required
                type="text" 
                className={`w-full p-2.5 border rounded-lg outline-none text-sm text-slate-900 transition-all ${
                  errors.nf ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-indigo-200 focus:ring-2 focus:ring-indigo-600'
                }`}
                value={formData.nf}
                onChange={(e) => {
                  setFormData({...formData, nf: e.target.value});
                  if (errors.nf) setErrors(prev => { const n = {...prev}; delete n.nf; return n; });
                }}
              />
              {errors.nf && <p className="text-[10px] text-rose-600 font-bold mt-1 uppercase">{errors.nf}</p>}
            </div>

            <div className="md:col-span-2 border-t border-slate-100 pt-2 mt-2"></div>

            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Valor (R$)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">R$</span>
                <input 
                  required
                  type="number" 
                  step="0.01"
                  min="0"
                  className={`w-full p-2.5 pl-9 border rounded-lg outline-none text-sm font-bold text-slate-900 ${
                    errors.valor ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 focus:ring-2 focus:ring-indigo-600'
                  }`}
                  value={formData.valor}
                  onChange={(e) => setFormData({...formData, valor: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-indigo-600 uppercase mb-1 tracking-wider">Vencimento *</label>
              <input 
                required
                type="date" 
                className="w-full p-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none text-sm font-bold text-slate-900 bg-indigo-50/30"
                value={formData.vcto}
                onChange={(e) => setFormData({...formData, vcto: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">Situação</label>
              <select 
                className={`w-full p-2.5 border rounded-lg focus:ring-2 outline-none text-sm font-bold transition-all ${
                  formData.situacao === Situacao.PAGO 
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 focus:ring-emerald-500' 
                  : 'border-rose-200 bg-rose-50 text-rose-700 focus:ring-rose-500'
                }`}
                value={formData.situacao}
                onChange={(e) => handleSituacaoChange(e.target.value as Situacao)}
              >
                <option value={Situacao.NAO_PAGO}>🔴 NÃO PAGO</option>
                <option value={Situacao.PAGO}>🟢 PAGO</option>
              </select>
            </div>

            <div>
              <label className={`block text-xs font-bold uppercase mb-1 tracking-wider transition-colors ${
                formData.situacao === Situacao.PAGO ? 'text-indigo-600' : 'text-slate-500'
              }`}>
                Data de Pagamento {formData.situacao === Situacao.PAGO ? '*' : ''}
              </label>
              <input 
                type="date" 
                required={formData.situacao === Situacao.PAGO}
                disabled={formData.situacao === Situacao.NAO_PAGO}
                className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none text-sm font-bold transition-all ${
                  formData.situacao === Situacao.PAGO 
                  ? 'bg-indigo-50/30 border-indigo-200 text-indigo-900' 
                  : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                }`}
                value={formData.pgto}
                onChange={(e) => setFormData({...formData, pgto: e.target.value})}
              />
              {errors.pgto && <p className="text-[10px] text-rose-600 font-bold mt-1 uppercase">{errors.pgto}</p>}
            </div>

            {invoice && (
              <div className="md:col-span-2 mt-4">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Histórico de Eventos</label>
                <textarea 
                  readOnly
                  className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 resize-none outline-none focus:ring-0 cursor-default"
                  value={formattedHistory || "Nenhum histórico disponível para este registro."}
                />
              </div>
            )}
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 sticky bottom-0 bg-white pb-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-8 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95"
            >
              {invoice ? 'Salvar Alterações' : 'Confirmar e Salvar'}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ManualEntryModal;
