
import React, { useState } from 'react';
import { parseBulkData } from '../services/geminiService';
import { Invoice, Situacao } from '../types';
import { generateId } from '../utils';

interface ImportModalProps {
  onClose: () => void;
  onImport: (newInvoices: Invoice[]) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleProcess = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const parsed = await parseBulkData(text);
      const invoices: Invoice[] = parsed.map(p => ({
        id: generateId(),
        secretaria: p.secretaria || 'NÃO INFORMADA',
        fornecedor: p.fornecedor || 'NÃO INFORMADO',
        ne: p.ne || '---',
        nf: p.nf || '---',
        valor: p.valor || 0,
        vcto: p.vcto || new Date().toISOString().split('T')[0],
        pgto: p.pgto || null,
        situacao: (p.situacao as Situacao) || Situacao.NAO_PAGO
      }));
      onImport(invoices);
      onClose();
    } catch (err) {
      alert("Erro ao processar dados. Verifique o formato.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-bold text-slate-800">Importação Inteligente (Excel/Texto)</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-4">
            Cole abaixo a tabela vinda do Excel ou um texto descritivo. Nossa IA irá extrair os campos automaticamente.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-64 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none text-sm font-mono text-slate-900 bg-white"
            placeholder="Exemplo: Secretaria de Saúde, Fornecedor XYZ, NF 123, R$ 500,00, Venc 10/10/2023..."
          />
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleProcess}
            disabled={loading || !text.trim()}
            className="px-6 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                Processando...
              </>
            ) : 'Processar e Importar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
