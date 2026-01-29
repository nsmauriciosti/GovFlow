
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
}

type SortField = 'secretaria' | 'fornecedor' | 'valor' | 'vcto';
type SortOrder = 'asc' | 'desc';

const InvoiceRow = React.memo(({ 
  invoice, 
  onDelete, 
  onToggleStatus, 
  onSelectInvoice,
  onEditInvoice,
  canWrite
}: { 
  invoice: Invoice; 
  onDelete: (id: string) => void; 
  onToggleStatus: (id: string) => void; 
  onSelectInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  canWrite: boolean;
}) => {
  const isPendencia = invoice.situacao === Situacao.NAO_PAGO && !invoice.pgto;
  const isCancelado = invoice.situacao === Situacao.CANCELADO;
  const daysUntil = getDaysUntil(invoice.vcto);
  
  const isOverdue = isPendencia && daysUntil < 0;
  const isNearDue = isPendencia && daysUntil >= 0 && daysUntil <= 7;

  let rowBackgroundClass = "";
  if (isCancelado) {
    rowBackgroundClass = "bg-slate-50 opacity-50 grayscale-[0.5] hover:opacity-80";
  } else if (isOverdue) {
    rowBackgroundClass = "bg-rose-50/60 border-l-4 border-l-rose-500 hover:bg-rose-100/50";
  } else if (isNearDue) {
    rowBackgroundClass = "bg-gradient-to-r from-amber-50/40 to-transparent border-l-4 border-l-amber-400 hover:from-amber-100/40 transition-all";
  } else if (isPendencia) {
    rowBackgroundClass = "bg-indigo-50/20 border-l-4 border-l-indigo-300 hover:bg-indigo-100/30";
  } else {
    rowBackgroundClass = "hover:bg-slate-50 border-l-4 border-l-transparent";
  }

  const getStatusBadgeClass = (situacao: Situacao) => {
    switch (situacao) {
      case Situacao.PAGO:
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case Situacao.NAO_PAGO:
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case Situacao.CANCELADO:
        return 'bg-slate-100 text-slate-500 border-slate-200 line-through';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
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
      <td className={`p-4 text-sm font-medium border-b border-slate-100 ${isCancelado ? 'text-slate-400' : 'text-slate-700'}`}>{invoice.secretaria}</td>
      <td className={`p-4 text-sm border-b border-slate-100 ${isCancelado ? 'text-slate-400' : 'text-slate-600'}`}>{invoice.fornecedor}</td>
      <td className="p-4 text-sm text-slate-500 border-b border-slate-100">
        <div className={`font-mono text-xs ${isCancelado ? 'line-through' : ''}`}>NE: {invoice.ne}</div>
        <div className={`font-mono text-xs ${isCancelado ? 'line-through' : ''}`}>NF: {invoice.nf}</div>
      </td>
      <td className={`p-4 text-sm font-bold text-right border-b border-slate-100 ${isCancelado ? 'text-slate-400' : 'text-slate-900'}`}>{formatCurrency(invoice.valor)}</td>
      <td className={`p-4 text-sm border-b border-slate-100 ${isCancelado ? 'text-slate-400' : 'text-slate-600'}`}>
        <div className="flex items-center gap-2">
          <span className={isNearDue ? 'font-bold text-amber-700' : ''}>{formatDateBR(invoice.vcto)}</span>
          {isOverdue && (
            <div className="text-rose-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          )}
          {isNearDue && (
            <div className="text-amber-500 animate-pulse">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            </div>
          )}
        </div>
      </td>
      <td className={`p-4 text-sm border-b border-slate-100 ${isCancelado ? 'text-slate-300' : 'text-slate-600'}`}>{formatDateBR(invoice.pgto)}</td>
      <td className="p-4 border-b border-slate-100">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors ${getStatusBadgeClass(invoice.situacao)}`}>
          {invoice.situacao}
          {isPendencia && <span className="ml-1 text-[10px] uppercase font-black text-rose-500">(Pendência)</span>}
        </span>
      </td>
      <td className="p-4 border-b border-slate-100" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center gap-2">
          {canWrite ? (
            <>
              <button 
                onClick={() => onToggleStatus(invoice.id)} 
                disabled={isCancelado} 
                title="Liquidar/Pendente"
                className={`p-1.5 rounded-lg transition-all ${isCancelado ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 focus:ring-2 focus:ring-indigo-500'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </button>
              <button 
                onClick={() => onDelete(invoice.id)} 
                title="Excluir Registro"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </>
          ) : (
            <div className="text-[10px] text-slate-300 font-bold uppercase py-1">Somente Leitura</div>
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
         prev.canWrite === next.canWrite;
});

const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices, onDelete, onToggleStatus, onSelectInvoice, onEditInvoice, currentUser }) => {
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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <svg className="w-3 h-3 text-slate-300 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20"><path d="M5 10l5-5 5 5H5zM5 10l5 5 5-5H5z" /></svg>;
    }
    return sortOrder === 'asc' 
      ? <svg className="w-3 h-3 text-indigo-600 ml-1.5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 15l5-5 5 5H5z" /></svg>
      : <svg className="w-3 h-3 text-indigo-600 ml-1.5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 5l5 5 5-5H5z" /></svg>;
  };

  const renderSortableHeader = (label: string, field: SortField, align: 'left' | 'right' | 'center' = 'left') => (
    <th 
      scope="col" 
      onClick={() => handleSort(field)}
      className={`p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 cursor-pointer group hover:bg-slate-100 transition-colors select-none text-${align}`}
    >
      <div className={`flex items-center ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        {label}
        <SortIcon field={field} />
      </div>
    </th>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col relative">
      {isPending && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-20 flex items-center justify-center animate-pulse">
           <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-white px-3 py-1 rounded-full shadow-sm border border-indigo-100">Processando...</div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" role="table">
          <thead className="bg-slate-50/80 sticky top-0 z-10">
            <tr>
              {renderSortableHeader('Secretaria', 'secretaria')}
              {renderSortableHeader('Fornecedor', 'fornecedor')}
              <th scope="col" className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">NE / NF</th>
              {renderSortableHeader('Valor', 'valor', 'right')}
              {renderSortableHeader('Vencimento', 'vcto')}
              <th scope="col" className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Pagamento</th>
              <th scope="col" className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Situação</th>
              <th scope="col" className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center border-b border-slate-100">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-400 font-medium italic">
                  Nenhuma nota fiscal encontrada para o filtro atual.
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
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-6">
          <p className="text-xs text-slate-500 font-medium">
            Mostrando <span className="font-bold text-slate-900">{startRange}</span> a <span className="font-bold text-slate-900">{endRange}</span> de <span className="font-bold text-slate-900">{invoices.length}</span> registros
          </p>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase">Itens por página:</label>
            <select 
              className="bg-white border border-slate-200 rounded-lg text-xs font-bold p-1 outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => handlePageChange(1)} 
            disabled={currentPage === 1}
            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all hover:bg-white"
            title="Primeira Página"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
          </button>
          <button 
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage === 1}
            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all hover:bg-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <div className="flex items-center px-4 gap-2">
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{currentPage}</span>
            <span className="text-xs font-bold text-slate-400 uppercase">de {totalPages || 1}</span>
          </div>

          <button 
            onClick={() => handlePageChange(currentPage + 1)} 
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all hover:bg-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
          <button 
            onClick={() => handlePageChange(totalPages)} 
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all hover:bg-white"
            title="Última Página"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M6 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTable;
