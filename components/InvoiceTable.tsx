
import React, { useState, useMemo, useEffect } from 'react';
import { Invoice, Situacao } from '../types';
import { formatCurrency, formatDateBR } from '../utils';

interface InvoiceTableProps {
  invoices: Invoice[];
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onSelectInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
}

const InvoiceRow = React.memo(({ 
  invoice, 
  onDelete, 
  onToggleStatus, 
  onSelectInvoice,
  onEditInvoice
}: { 
  invoice: Invoice; 
  onDelete: (id: string) => void; 
  onToggleStatus: (id: string) => void; 
  onSelectInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
}) => {
  const isPendencia = invoice.situacao === Situacao.NAO_PAGO && !invoice.pgto;
  
  return (
    <tr 
      tabIndex={0}
      role="button"
      title="Clique uma vez para detalhes, clique duplo para editar"
      aria-label={`Nota Fiscal ${invoice.nf} de ${invoice.fornecedor}. Clique duplo para editar.`}
      className={`hover:bg-indigo-50/40 transition-colors cursor-pointer group focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 ${isPendencia ? 'bg-amber-50/10' : ''}`}
      onClick={() => onSelectInvoice(invoice)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onEditInvoice(invoice);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectInvoice(invoice);
        }
      }}
    >
      <td className="p-4 text-sm text-slate-700 font-medium border-b border-slate-100">{invoice.secretaria}</td>
      <td className="p-4 text-sm text-slate-600 border-b border-slate-100">{invoice.fornecedor}</td>
      <td className="p-4 text-sm text-slate-500 border-b border-slate-100">
        <div className="font-mono text-xs">NE: {invoice.ne}</div>
        <div className="font-mono text-xs">NF: {invoice.nf}</div>
      </td>
      <td className="p-4 text-sm text-slate-900 font-bold text-right border-b border-slate-100">{formatCurrency(invoice.valor)}</td>
      <td className="p-4 text-sm text-slate-600 border-b border-slate-100">{formatDateBR(invoice.vcto)}</td>
      <td className="p-4 text-sm text-slate-600 border-b border-slate-100">{formatDateBR(invoice.pgto)}</td>
      <td className="p-4 border-b border-slate-100">
        <span 
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
            invoice.situacao === Situacao.PAGO 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
            : 'bg-rose-50 text-rose-700 border-rose-100'
          }`}
          aria-label={`Situação: ${invoice.situacao}${isPendencia ? ' com pendência' : ''}`}
        >
          {invoice.situacao}
          {isPendencia && <span className="ml-1 text-[10px] uppercase font-black text-rose-500" aria-hidden="true">(Pendência)</span>}
        </span>
      </td>
      <td className="p-4 border-b border-slate-100" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center gap-2">
          <button 
            onClick={() => onToggleStatus(invoice.id)}
            aria-label={`Marcar nota ${invoice.nf} como ${invoice.situacao === Situacao.PAGO ? 'Não Paga' : 'Paga'}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </button>
          <button 
            onClick={() => onDelete(invoice.id)}
            aria-label={`Excluir nota fiscal ${invoice.nf} permanentemente`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 focus:ring-2 focus:ring-rose-500 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      </td>
    </tr>
  );
});

const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices, onDelete, onToggleStatus, onSelectInvoice, onEditInvoice }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [invoices.length]);

  const totalPages = Math.ceil(invoices.length / itemsPerPage);
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return invoices.slice(start, start + itemsPerPage);
  }, [invoices, currentPage, itemsPerPage]);

  const startRange = invoices.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endRange = Math.min(currentPage * itemsPerPage, invoices.length);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table 
          className="w-full text-left border-collapse"
          role="table"
          aria-label="Tabela de Notas Fiscais"
        >
          <thead className="bg-slate-50/80 sticky top-0 z-10">
            <tr>
              <th scope="col" className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Secretaria</th>
              <th scope="col" className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Fornecedor</th>
              <th scope="col" className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">NE / NF</th>
              <th scope="col" className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right border-b border-slate-100">Valor</th>
              <th scope="col" className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Vencimento</th>
              <th scope="col" className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Pagamento</th>
              <th scope="col" className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Situação</th>
              <th scope="col" className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center border-b border-slate-100">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-400 font-medium">
                  Nenhuma nota fiscal encontrada para os filtros aplicados.
                </td>
              </tr>
            ) : (
              paginatedInvoices.map((invoice) => (
                <InvoiceRow 
                  key={invoice.id} 
                  invoice={invoice} 
                  onDelete={onDelete} 
                  onToggleStatus={onToggleStatus} 
                  onSelectInvoice={onSelectInvoice}
                  onEditInvoice={onEditInvoice}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <div className="flex items-center gap-4">
          <p className="text-xs text-slate-500 font-medium">
            Mostrando <span className="font-bold text-slate-900">{startRange}</span> a <span className="font-bold text-slate-900">{endRange}</span> de <span className="font-bold text-slate-900">{invoices.length}</span> registros
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Exibir</span>
            <select 
              value={itemsPerPage} 
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => setCurrentPage(1)} 
            disabled={currentPage === 1}
            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            aria-label="Primeira página"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
          </button>
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
            disabled={currentPage === 1}
            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            aria-label="Página anterior"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <div className="flex items-center px-4 gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Página</span>
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{currentPage}</span>
            <span className="text-xs font-bold text-slate-400 uppercase">de {totalPages || 1}</span>
          </div>

          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            aria-label="Próxima página"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
          <button 
            onClick={() => setCurrentPage(totalPages)} 
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            aria-label="Última página"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTable;
