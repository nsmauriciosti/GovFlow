
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

  /**
   * Processa arquivos um a um para evitar estouro de tokens e erros de parsing de JSON longo.
   */
  const processFiles = async (files: FileList) => {
    if (!isAiEnabled) return;
    setLoading(true);
    setProgress(0);
    
    const currentSuccessFiles: string[] = [];
    const currentErrorFiles: { name: string; details: string }[] = [];
    const allInvoices: Invoice[] = [];
    const allSuppliers: (Partial<Supplier> & { forName: string })[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const extension = file.name.split('.').pop()?.toLowerCase();
        
        setStatusMessage(`Processando arquivo ${i + 1} de ${files.length}: ${file.name}`);
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

          // Chama a IA para este arquivo específico
          const parsed = await parseBulkData(text);

          if (parsed && parsed.length > 0) {
            parsed.forEach(p => {
              const forName = p.fornecedor || 'NÃO INFORMADO';
              
              if (p.supplierData && p.supplierData.cnpj) {
                if (!allSuppliers.find(m => m.cnpj?.replace(/\D/g, '') === p.supplierData?.cnpj?.replace(/\D/g, ''))) {
                  allSuppliers.push({ ...p.supplierData, forName });
                }
              }

              allInvoices.push({
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
            throw new Error("IA não retornou dados estruturados para este arquivo.");
          }
        } catch (fileErr: any) {
          const errMsg = fileErr.message || "Erro desconhecido.";
          currentErrorFiles.push({ name: file.name, details: errMsg });
          await logError(file.name, 'SISTEMA', errMsg);
        }
      }

      setSummary({
        successFiles: currentSuccessFiles,
        errorFiles: currentErrorFiles,
        totalInvoices: allInvoices.length,
        invoices: allInvoices,
        supplierMetadata: allSuppliers
      });
      
    } catch (err: any) {
      onToast("Erro durante o processamento em lote.", "error");
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
    setStatusMessage("Analisando texto colado...");

    try {
      const parsed = await parseBulkData(pastedText);
      const allInvoices: Invoice[] = [];
      const allSuppliers: (Partial<Supplier> & { forName: string })[] = [];

      parsed.forEach(p => {
        const forName = p.fornecedor || 'NÃO INFORMADO';
        if (p.supplierData && p.supplierData.cnpj) {
          allSuppliers.push({ ...p.supplierData, forName });
        }
        allInvoices.push({
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
        successFiles: ["Texto colado manualmente"],
        errorFiles: parsed.length === 0 ? [{ name: "Texto Manual", details: "IA não identificou notas." }] : [],
        totalInvoices: allInvoices.length,
        invoices: allInvoices,
        supplierMetadata: allSuppliers
      });
    } catch (e) {
      onToast("Falha na análise do texto.", "error");
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

  if (summary) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Resultado da Importação</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Revisão final dos dados extraídos.</p>
            </div>
            <div className="bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase">
              {summary.totalInvoices} Notas
            </div>
          </div>

          <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {summary.supplierMetadata.length > 0 && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 leading-tight">
                  Foram detectados <strong>{summary.supplierMetadata.length} fornecedores</strong> para atualização de cadastro.
                </p>
              </div>
            )}

            {summary.successFiles.length > 0 && (
              <section>
                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Processados com Sucesso</h4>
                <ul className="space-y-1">
                  {summary.successFiles.map((f, i) => <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">✓ {f}</li>)}
                </ul>
              </section>
            )}

            {summary.errorFiles.length > 0 && (
              <section>
                <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-3">Erros (Arquivo não suportado ou ilegível)</h4>
                <ul className="space-y-2">
                  {summary.errorFiles.map((f, i) => (
                    <li key={i} className="text-[11px] text-rose-600 bg-rose-50 dark:bg-rose-900/20 p-2 rounded-lg">
                      <strong>{f.name}:</strong> {f.details}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
            <button onClick={onClose} className="px-8 py-3 rounded-2xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 transition-all">Cancelar</button>
            <button onClick={confirmImport} className="px-10 py-3 rounded-2xl bg-indigo-600 text-white font-black shadow-xl hover:bg-indigo-700 transition-all">
              {summary.totalInvoices > 0 ? 'Salvar no Sistema' : 'Fechar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Importação em Lotes</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Extração segmentada para grandes volumes de dados.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        </div>

        {!isAiEnabled ? (
          <div className="p-16 text-center space-y-6">
            <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div className="max-w-md mx-auto">
              <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">IA Temporariamente Suspensa</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">O administrador desativou o motor de Inteligência Artificial nas configurações globais. Por favor, utilize a entrada manual ou reative a IA para prosseguir com importações inteligentes.</p>
            </div>
            <button onClick={onClose} className="px-10 py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white font-black text-xs uppercase tracking-widest shadow-xl">Entendido</button>
          </div>
        ) : (
          <>
            <div className="p-8 space-y-8">
              <div 
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                className={`border-2 border-dashed rounded-[2rem] p-12 text-center transition-all ${dragActive ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-200 dark:border-slate-700'}`}
              >
                <input type="file" ref={fileInputRef} multiple accept=".xlsx,.xls,.xml,.csv,.txt" className="hidden" onChange={(e) => e.target.files && processFiles(e.target.files)} />
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg></div>
                  <p className="text-lg font-bold">Arraste múltiplos arquivos aqui</p>
                  <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:shadow-md transition-all">Selecionar Arquivos</button>
                </div>

                {loading && (
                  <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center rounded-[2rem] z-20 p-8">
                    <p className="text-indigo-600 font-black text-xs uppercase tracking-widest mb-4">{statusMessage}</p>
                    <div className="w-full max-w-xs h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                )}
              </div>

              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                disabled={loading}
                className="w-full h-32 p-4 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-medium bg-slate-50/50 dark:bg-slate-800/50 resize-none disabled:opacity-50 transition-colors"
                placeholder="Ou cole o conteúdo de uma planilha aqui..."
              />
            </div>

            <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4 bg-slate-50/50 dark:bg-slate-800/50 transition-colors">
              <button onClick={onClose} disabled={loading} className="px-8 py-3 rounded-2xl text-slate-600 font-bold">Cancelar</button>
              <button onClick={handlePastedText} disabled={loading || !pastedText.trim()} className="px-10 py-3 rounded-2xl bg-indigo-600 text-white font-black shadow-xl hover:bg-indigo-700 transition-all">
                {loading ? 'Processando...' : 'Analisar Texto'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImportModal;
