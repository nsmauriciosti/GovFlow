
import React, { useState, useMemo, useEffect, useTransition } from 'react';
import { Invoice, Situacao, User, UserRole } from '../types';
import { formatCurrency, formatDateBR, getDaysUntil } from '../utils';

interface InvoiceTableProps {
  invoices: Invoice[];
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onSelectInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  currentUser: User | null;
  theme: 'light' | 'dark';
}

type SortField = 'secretaria' | 'fornecedor' | 'valor' | 'vcto';
type SortOrder = 'asc' | 'desc';

const InvoiceRow = React.memo(({ 
  invoice, 
  onDelete, 
  onToggleStatus, 
  onSelectInvoice,
  onEditInvoice,
  canWrite,
  theme
}: { 
  invoice: Invoice; 
  onDelete: (id: string) => void; 
  onToggleStatus: (id: string) => void; 
  onSelectInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  canWrite: boolean;
  theme: 'light' | 'dark';
}) => {
  const isPendencia = invoice.situacao === Situacao.NAO_PAGO && !invoice.pgto;
  const isCancelado = invoice.situacao === Situacao.CANCELADO;
  const daysUntil = getDaysUntil(invoice.vcto);
  
  const isOverdue = isPendencia && daysUntil < 0;
  const isNearDue = isPendencia && daysUntil >= 0 && daysUntil <= 7;

  let rowBackgroundClass = "";
  if (isCancelado) {
    rowBackgroundClass = "bg-slate-50 dark:bg-slate-800/30 opacity-50 grayscale-[0.5] hover:opacity-80";
  } else if (isOverdue) {
    rowBackgroundClass = "bg-rose-50/60 dark:bg-rose-950/20 border-l-4 border-l-rose-500 hover:bg-rose-100/50 dark:hover:bg-rose-900/30";
  } else if (isNearDue) {
    rowBackgroundClass = "bg-gradient-to-r from-amber-50/40 to-transparent dark:from-amber-900/10 dark:to-transparent border-l-4 border-l-amber-400 hover:from-amber-100/40 transition-all";
  } else if (isPendencia) {
    rowBackgroundClass = "bg-indigo-50/20 dark:bg-indigo-900/10 border-l-4 border-l-indigo-300 dark:border-l-indigo-700 hover:bg-indigo-100/30";
  } else {
    rowBackgroundClass = "hover:bg-slate-50 dark:hover:bg-slate-800/40 border-l-4 border-l-transparent";
  }

  const getStatusBadgeClass = (situacao: Situacao) => {
    switch (situacao) {
      case Situacao.PAGO:
        return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800';
      case Situacao.NAO_PAGO:
        return 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800';
      case Situacao.CANCELADO:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 line-through';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700';
    }
  };

  return (
    <tr 
      tabIndex={0}
      role="button"
      className={`transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 ${rowBackgroundClass}`}
      onClick={() => onSelectInvoice(invoice)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (canWrite) onEditInvoice(invoice);
      }}
    >
      <td className={`p-3 lg:p-4 text-xs sm:text-sm font-medium border-b border-slate-100 dark:border-slate-800 whitespace-nowrap ${isCancelado ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>{invoice.secretaria}</td>
      <td className={`p-3 lg:p-4 text-xs sm:text-sm border-b border-slate-100 dark:border-slate-800 min-w-[150px] ${isCancelado ? 'text-slate-400' : 'text-slate-600 dark:text-slate-400'}`}>{invoice.fornecedor}</td>
      <td className="p-3 lg:p-4 text-xs border-b border-slate-100 dark:border-slate-800">
        <div className={`font-mono text-[10px] sm:text-xs ${isCancelado ? 'text-slate-300' : 'text-slate-500 dark:text-slate-500'}`}>NE: {invoice.ne}</div>
        <div className={`font-mono text-[10px] sm:text-xs ${isCancelado ? 'text-slate-300' : 'text-slate-500 dark:text-slate-500'}`}>NF: {invoice.nf}</div>
      </td>
      <td className={`p-3 lg:p-4 text-xs sm:text-sm font-bold text-right border-b border-slate-100 dark:border-slate-800 whitespace-nowrap ${isCancelado ? 'text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>{formatCurrency(invoice.valor)}</td>
      <td className={`p-3 lg:p-4 text-xs sm:text-sm border-b border-slate-100 dark:border-slate-800 whitespace-nowrap ${isCancelado ? 'text-slate-400' : 'text-slate-600 dark:text-slate-400'}`}>
        <div className="flex items-center gap-2">
          <span className={isNearDue ? 'font-bold text-amber-700 dark:text-amber-400' : ''}>{formatDateBR(invoice.vcto)}</span>
          {isOverdue && <div className="text-rose-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>}
        </div>
      </td>
      <td className={`p-3 lg:p-4 text-xs sm:text-sm border-b border-slate-100 dark:border-slate-800 whitespace-nowrap ${isCancelado ? 'text-slate-300 dark:text-slate-700' : 'text-slate-600 dark:text-slate-400'}`}>{formatDateBR(invoice.pgto)}</td>
      <td className="p-3 lg:p-4 border-b border-slate-100 dark:border-slate-800">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${getStatusBadgeClass(invoice.situacao)}`}>
          {invoice.situacao}
        </span>
      </td>
      <td className="p-3 lg:p-4 border-b border-slate-100 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center gap-1 sm:gap-2">
          {canWrite ? (
            <>
              <button onClick={() => onToggleStatus(invoice.id)} disabled={isCancelado} title="Liquidar" className={`p-1.5 rounded-lg transition-all ${isCancelado ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950'}`}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </button>
              <button onClick={() => onDelete(invoice.id)} title="Excluir" className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-all">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </>
          ) : (
            <div className="text-[8px] text-slate-300 uppercase font-black">Read Only</div>
          )}
        </div>
      </td>
    </tr>
  );
}, (prev, next) => {
  return prev.invoice.id === next.invoice.id && 
         prev.invoice.situacao === next.invoice.situacao &&
         prev.invoice.pgto === next.invoice.pgto &&
         prev.invoice.valor === next.invoice.valor &&
         prev.canWrite === next.canWrite &&
         prev.theme === next.theme;
});

const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices, onDelete, onToggleStatus, onSelectInvoice, onEditInvoice, currentUser, theme }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [isPending, startTransition] = useTransition();

  const canWrite = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.FINANCEIRO || currentUser?.role === UserRole.GESTOR;

  useEffect(() => {
    setCurrentPage(1);
  }, [invoices.length, itemsPerPage]);

  const handleSort = (field: SortField) => {
    startTransition(() => {
      if (sortField === field) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setSortField(field);
        setSortOrder('asc');
      }
    });
  };

  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      setCurrentPage(newPage);
    });
  };

  const sortedInvoices = useMemo(() => {
    let data = [...invoices];
    if (sortField) {
      data.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        if (aValue === bValue) return 0;
        const comparison = aValue > bValue ? 1 : -1;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }
    return data;
  }, [invoices, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedInvoices.length / itemsPerPage);
  
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedInvoices.slice(start, start + itemsPerPage);
  }, [sortedInvoices, currentPage, itemsPerPage]);

  const startRange = invoices.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endRange = Math.min(currentPage * itemsPerPage, invoices.length);

  const renderSortableHeader = (label: string, field: SortField, align: 'left' | 'right' | 'center' = 'left') => (
    <th 
      scope="col" 
      onClick={() => handleSort(field)}
      className={`p-3 lg:p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors select-none text-${align}`}
    >
      <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        {label}
        {sortField === field && (
          <span className="text-indigo-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </th>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col relative transition-colors">
      {isPending && (
        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[1px] z-20 flex items-center justify-center animate-pulse">
           <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow-sm border border-indigo-100">Processando...</div>
        </div>
      )}

      <div className="overflow-x-auto scrollbar-hide sm:scrollbar-default">
        <table className="w-full text-left border-collapse" role="table">
          <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 transition-colors">
            <tr>
              {renderSortableHeader('Secretaria', 'secretaria')}
              {renderSortableHeader('Fornecedor', 'fornecedor')}
              <th scope="col" className="p-3 lg:p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Identificação</th>
              {renderSortableHeader('Valor', 'valor', 'right')}
              {renderSortableHeader('Vcto', 'vcto')}
              <th scope="col" className="p-3 lg:p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Pagamento</th>
              <th scope="col" className="p-3 lg:p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Status</th>
              <th scope="col" className="p-3 lg:p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center border-b border-slate-100 dark:border-slate-800">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-400 font-medium italic text-sm">
                  Nenhum registro encontrado.
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
                  canWrite={canWrite}
                  theme={theme}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-4 lg:px-6 lg:py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 lg:gap-6 no-print transition-colors">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 lg:gap-6">
          <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
            Exibindo <span className="font-bold text-slate-900 dark:text-slate-100">{startRange}</span>-
            <span className="font-bold text-slate-900 dark:text-slate-100">{endRange}</span> de 
            <span className="font-bold text-slate-900 dark:text-slate-100"> {invoices.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase">Itens:</label>
            <select 
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold p-1 outline-none text-slate-900 dark:text-slate-100"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              {[10, 25, 50].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={() => handlePageChange(1)} disabled={currentPage === 1} className="p-1.5 lg:p-2 rounded-lg text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
          </button>
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 lg:p-2 rounded-lg text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <div className="flex items-center px-3 lg:px-4 gap-2">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800">{currentPage}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">/ {totalPages || 1}</span>
          </div>

          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0} className="p-1.5 lg:p-2 rounded-lg text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
          <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages || totalPages === 0} className="p-1.5 lg:p-2 rounded-lg text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M6 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTable;
