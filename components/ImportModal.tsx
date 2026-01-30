
import React, { useState, useRef } from 'react';
import { parseBulkData } from '../services/geminiService';
import { Invoice, Situacao, ImportErrorLog, Supplier } from '../types';
import { generateId } from '../utils';
import { dataService } from '../services/dataService';
import { ToastType } from './Toast';
import * as XLSX from 'xlsx';

interface ImportModalProps {
  onClose: () => void;
  onImport: (data: { invoices: Invoice[], supplierMetadata: (Partial<Supplier> & { forName: string })[] }) => void;
  onToast: (msg: string, type: ToastType) => void;
  userEmail: string;
  theme: 'light' | 'dark';
  isAiEnabled: boolean;
}

interface ImportSummary {
  successFiles: string[];
  errorFiles: { name: string; details: string }[];
  totalInvoices: number;
  invoices: Invoice[];
  supplierMetadata: (Partial<Supplier> & { forName: string })[];
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport, onToast, userEmail, theme, isAiEnabled }) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (!isAiEnabled) {
      onToast("A Inteligência Artificial está desativada nas configurações.", "warning");
      return;
    }
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const logError = async (fileName: string, type: ImportErrorLog['errorType'], details: string) => {
    const log: ImportErrorLog = {
      id: generateId(),
      date: new Date().toISOString(),
      fileName,
      errorType: type,
      details,
      userEmail
    };
    await dataService.saveImportError(log);
  };

  const processFiles = async (files: FileList) => {
    if (!isAiEnabled) return;
    setLoading(true);
    setProgress(0);
    
    const currentSuccessFiles: string[] = [];
    const currentErrorFiles: { name: string; details: string }[] = [];
    const collectedInvoices: Invoice[] = [];
    const collectedSuppliers: (Partial<Supplier> & { forName: string })[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const extension = file.name.split('.').pop()?.toLowerCase();
        
        setStatusMessage(`Analisando: ${file.name} (${i + 1}/${files.length})`);
        setProgress(Math.round((i / files.length) * 100));

        try {
          let text = "";
          if (extension === 'xlsx' || extension === 'xls') {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            text = XLSX.utils.sheet_to_csv(firstSheet);
          } else {
            text = await file.text();
          }

          const parsed = await parseBulkData(text);

          if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            parsed.forEach(p => {
              const forName = p.fornecedor || 'NÃO INFORMADO';
              
              if (p.supplierData && p.supplierData.cnpj) {
                if (!collectedSuppliers.find(m => m.cnpj?.replace(/\D/g, '') === p.supplierData?.cnpj?.replace(/\D/g, ''))) {
                  collectedSuppliers.push({ ...p.supplierData, forName });
                }
              }

              collectedInvoices.push({
                id: generateId(),
                secretaria: p.secretaria || 'NÃO INFORMADA',
                fornecedor: forName,
                ne: p.ne || '---',
                nf: p.nf || '---',
                valor: p.valor || 0,
                vcto: p.vcto || new Date().toISOString().split('T')[0],
                pgto: p.pgto || null,
                situacao: (p.situacao as Situacao) || Situacao.NAO_PAGO
              });
            });
            currentSuccessFiles.push(file.name);
          } else {
            throw new Error("Nenhum dado válido extraído deste arquivo.");
          }
        } catch (fileErr: any) {
          const errMsg = fileErr.message || "Falha na leitura da IA.";
          currentErrorFiles.push({ name: file.name, details: errMsg });
          await logError(file.name, 'FALHA_IA', errMsg);
        }
      }

      setSummary({
        successFiles: currentSuccessFiles,
        errorFiles: currentErrorFiles,
        totalInvoices: collectedInvoices.length,
        invoices: collectedInvoices,
        supplierMetadata: collectedSuppliers
      });
      
    } catch (err: any) {
      onToast("Erro crítico no processador de arquivos.", "error");
    } finally {
      setLoading(false);
      setProgress(100);
    }
  };

  const handlePastedText = async () => {
    if (!isAiEnabled) {
      onToast("A Inteligência Artificial está desativada.", "warning");
      return;
    }
    if (!pastedText.trim()) return;
    setLoading(true);
    setProgress(50);
    setStatusMessage("Processando texto...");

    try {
      const parsed = await parseBulkData(pastedText);
      const collectedInvoices: Invoice[] = [];
      const collectedSuppliers: (Partial<Supplier> & { forName: string })[] = [];

      if (parsed && Array.isArray(parsed)) {
        parsed.forEach(p => {
          const forName = p.fornecedor || 'NÃO INFORMADO';
          if (p.supplierData && p.supplierData.cnpj) {
            collectedSuppliers.push({ ...p.supplierData, forName });
          }
          collectedInvoices.push({
            id: generateId(),
            secretaria: p.secretaria || 'NÃO INFORMADA',
            fornecedor: forName,
            ne: p.ne || '---',
            nf: p.nf || '---',
            valor: p.valor || 0,
            vcto: p.vcto || new Date().toISOString().split('T')[0],
            pgto: p.pgto || null,
            situacao: (p.situacao as Situacao) || Situacao.NAO_PAGO
          });
        });

        setSummary({
          successFiles: ["Entrada Manual (Texto)"],
          errorFiles: parsed.length === 0 ? [{ name: "Texto Manual", details: "IA não reconheceu faturas no texto." }] : [],
          totalInvoices: collectedInvoices.length,
          invoices: collectedInvoices,
          supplierMetadata: collectedSuppliers
        });
      }
    } catch (e) {
      onToast("Erro na análise do texto colado.", "error");
    } finally {
      setLoading(false);
      setProgress(100);
    }
  };

  const confirmImport = () => {
    if (summary && summary.invoices.length > 0) {
      onImport({ invoices: summary.invoices, supplierMetadata: summary.supplierMetadata });
      onClose();
    } else onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 lg:p-6 transition-colors">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
        
        {/* Header Fixo */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {summary ? 'Resumo da Análise' : 'Importação Inteligente'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              {summary ? `${summary.totalInvoices} notas identificadas` : 'Motor IA Gemini 2.5'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all p-2 hover:bg-slate-200/50 dark:hover:bg-slate-700 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Conteúdo com Scroll Interno */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
          {!isAiEnabled ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                A Inteligência Artificial está desativada. Ative nas configurações para usar esta ferramenta.
              </p>
            </div>
          ) : summary ? (
            <div className="space-y-6">
              {summary.invoices.length > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-4 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-emerald-800 dark:text-emerald-400">Pronto para importar</h4>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-wider">Identificamos {summary.totalInvoices} faturas válidas nos arquivos.</p>
                  </div>
                </div>
              )}

              {summary.successFiles.length > 0 && (
                <section>
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Arquivos Processados</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {summary.successFiles.map((f, i) => (
                      <div key={i} className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 truncate">
                        <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        {f}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {summary.errorFiles.length > 0 && (
                <section>
                  <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3">Erros Encontrados</h4>
                  <div className="space-y-2">
                    {summary.errorFiles.map((f, i) => (
                      <div key={i} className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl flex items-start gap-3">
                        <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-rose-800 dark:text-rose-400 truncate">{f.name}</p>
                          <p className="text-[10px] text-rose-600 dark:text-rose-500 font-medium">{f.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div 
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                className={`border-2 border-dashed rounded-[2rem] p-10 text-center transition-all relative ${dragActive ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-200 dark:border-slate-800'}`}
              >
                <input type="file" ref={fileInputRef} multiple accept=".xlsx,.xls,.xml,.csv,.txt" className="hidden" onChange={(e) => e.target.files && processFiles(e.target.files)} />
                
                {loading ? (
                  <div className="py-6 flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">{statusMessage}</p>
                    <div className="w-full max-w-[200px] h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-800 dark:text-slate-100">Arraste seus arquivos</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">XML, PDF, CSV, XLSX suportados</p>
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-indigo-600 text-white font-black text-xs uppercase rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">Procurar no PC</button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Ou cole o texto aqui</label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  disabled={loading}
                  className="w-full h-32 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-medium bg-slate-50/30 dark:bg-slate-800/30 resize-none disabled:opacity-50 transition-all"
                  placeholder="Copie os dados da planilha e cole aqui..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Fixo */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end gap-3 transition-colors">
          <button onClick={onClose} disabled={loading} className="px-6 py-2.5 text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all">
            {summary ? 'Descartar' : 'Cancelar'}
          </button>
          
          {summary ? (
            <button 
              onClick={confirmImport} 
              disabled={summary.totalInvoices === 0}
              className="px-8 py-2.5 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50"
            >
              Confirmar Importação
            </button>
          ) : (
            <button 
              onClick={handlePastedText} 
              disabled={loading || !pastedText.trim() || !isAiEnabled} 
              className="px-8 py-2.5 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50"
            >
              {loading ? 'Analisando...' : 'Analisar Texto'}
            </button>
          )}
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </div>
  );
};

export default ImportModal;
