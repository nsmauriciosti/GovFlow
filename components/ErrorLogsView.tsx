
import React, { useState, useEffect } from 'react';
import { ImportErrorLog } from '../types';
import { dataService } from '../services/dataService';
import { formatDateBR } from '../utils';

const ErrorLogsView: React.FC = () => {
  const [logs, setLogs] = useState<ImportErrorLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    const fetched = await dataService.getErrorLogs();
    setLogs(fetched);
    setLoading(false);
  };

  const clearLogs = async () => {
    if (confirm("Deseja limpar todos os registros de erro permanentemente?")) {
      await dataService.clearErrorLogs();
      setLogs([]);
    }
  };

  const getBadgeStyle = (type: ImportErrorLog['errorType']) => {
    switch (type) {
      case 'FORMATO_INVALIDO': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'FALHA_IA': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'SISTEMA': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Logs de Erros de Importação</h2>
          <p className="text-slate-500 text-sm mt-1">Auditabilidade técnica dos arquivos processados pela IA.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={loadLogs}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Atualizar
          </button>
          <button 
            onClick={clearLogs}
            disabled={logs.length === 0}
            className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Limpar Logs
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent mx-auto"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-20 text-center">
             <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <p className="text-slate-400 font-bold">Nenhum erro registrado até o momento!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data / Usuário</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Arquivo</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detalhes do Erro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-900">{formatDateBR(log.date.split('T')[0])} <span className="text-slate-400 font-medium ml-1">{log.date.split('T')[1].slice(0, 5)}</span></p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{log.userEmail}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{log.fileName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded border uppercase tracking-tight ${getBadgeStyle(log.errorType)}`}>
                        {log.errorType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-600 font-medium leading-relaxed italic max-w-sm line-clamp-2" title={log.details}>
                        {log.details}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorLogsView;
