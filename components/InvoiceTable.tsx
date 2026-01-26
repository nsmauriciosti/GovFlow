
import React from 'react';
import { Invoice, Situacao } from '../types';
import { formatCurrency, formatDateBR } from '../utils';

interface InvoiceTableProps {
  invoices: Invoice[];
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices, onDelete, onToggleStatus }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Secretaria</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fornecedor</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">NE / NF</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Valor</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vencimento</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pagamento</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Situação</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-400 font-medium">
                  Nenhuma nota fiscal encontrada para os filtros aplicados.
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => {
                const isPendencia = invoice.situacao === Situacao.NAO_PAGO && !invoice.pgto;
                
                return (
                  <tr key={invoice.id} className={`hover:bg-slate-50 transition-colors ${isPendencia ? 'bg-amber-50/30' : ''}`}>
                    <td className="p-4 text-sm text-slate-700 font-medium">{invoice.secretaria}</td>
                    <td className="p-4 text-sm text-slate-600">{invoice.fornecedor}</td>
                    <td className="p-4 text-sm text-slate-500">
                      <div className="font-mono text-xs">NE: {invoice.ne}</div>
                      <div className="font-mono text-xs">NF: {invoice.nf}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-900 font-bold text-right">{formatCurrency(invoice.valor)}</td>
                    <td className="p-4 text-sm text-slate-600">{formatDateBR(invoice.vcto)}</td>
                    <td className="p-4 text-sm text-slate-600">{formatDateBR(invoice.pgto)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        invoice.situacao === Situacao.PAGO 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {invoice.situacao}
                        {isPendencia && <span className="ml-1 text-[10px] uppercase font-black text-rose-500">(Pendência)</span>}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => onToggleStatus(invoice.id)}
                          title="Alternar Status"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </button>
                        <button 
                          onClick={() => onDelete(invoice.id)}
                          title="Excluir"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceTable;
