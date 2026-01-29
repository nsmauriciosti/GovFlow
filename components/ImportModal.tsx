
import React, { useState, useRef } from 'react';
import { parseBulkData } from '../services/geminiService';
import { Invoice, Situacao, ImportErrorLog } from '../types';
import { generateId } from '../utils';
import { dataService } from '../services/dataService';
import { ToastType } from './Toast';
import * as XLSX from 'xlsx';

interface ImportModalProps {
  onClose: () => void;
  onImport: (newInvoices: Invoice[]) => void;
  onToast: (msg: string, type: ToastType) => void;
  userEmail: string;
  // Added theme prop to fix TypeScript error in App.tsx
  theme: 'light' | 'dark';
}

interface ImportSummary {
  successFiles: string[];
  errorFiles: { name: string; details: string }[];
  totalInvoices: number;
  invoices: Invoice[];
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport, onToast, userEmail, theme }) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setLoading(true);
    setProgress(10);
    setStatusMessage("Lendo arquivos selecionados...");
    
    let allExtractedText = "";
    const currentSuccessFiles: string[] = [];
    const currentErrorFiles: { name: string; details: string }[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const extension = file.name.split('.').pop()?.toLowerCase();
        
        const stepProgress = 10 + Math.round(((i + 1) / files.length) * 40);
        setProgress(stepProgress);

        try {
          let text = "";
          if (extension === 'xlsx' || extension === 'xls') {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            text = XLSX.utils.sheet_to_csv(firstSheet);
            allExtractedText += `\n[ARQUIVO EXCEL: ${file.name}]\n` + text;
          } 
          else if (extension === 'xml') {
            text = await file.text();
            allExtractedText += `\n[ARQUIVO XML NFE: ${file.name}]\n` + text;
          } 
          else if (extension === 'csv' || extension === 'txt') {
            text = await file.text();
            allExtractedText += `\n[ARQUIVO TEXTO: ${file.name}]\n` + text;
          } else {
            throw new Error(`Extensão .${extension} não suportada.`);
          }
          currentSuccessFiles.push(file.name);
        } catch (fileErr: any) {
          const errMsg = fileErr.message || "Erro desconhecido ao ler arquivo.";
          currentErrorFiles.push({ name: file.name, details: errMsg });
          await logError(file.name, 'FORMATO_INVALIDO', errMsg);
        }
      }

      if (allExtractedText.trim()) {
        await runAiParsing(allExtractedText, "Lote de arquivos", true, currentSuccessFiles, currentErrorFiles);
      } else {
        if (currentErrorFiles.length > 0) {
          setSummary({
            successFiles: [],
            errorFiles: currentErrorFiles,
            totalInvoices: 0,
            invoices: []
          });
        }
        setLoading(false);
      }
    } catch (err: any) {
      onToast("Erro crítico no processamento de arquivos.", "error");
      setLoading(false);
    }
  };

  const runAiParsing = async (
    content: string, 
    sourceName: string, 
    isFromFiles = false, 
    successFiles: string[] = [], 
    errorFiles: { name: string; details: string }[] = []
  ) => {
    if (!content.trim()) return;
    setLoading(true);
    
    if (!isFromFiles) {
      setProgress(20);
      setStatusMessage("Preparando dados para análise...");
    } else {
      setProgress(60);
      setStatusMessage("Enviando para Inteligência Artificial...");
    }

    try {
      const aiTimer = setTimeout(() => {
        setProgress(80);
        setStatusMessage("IA Gemini estruturando registros financeiros...");
      }, 800);

      const parsed = await parseBulkData(content);
      clearTimeout(aiTimer);

      if (!parsed || parsed.length === 0) {
        const details = "A IA não conseguiu estruturar os dados. O conteúdo pode estar ilegível ou em formato não reconhecido.";
        await logError(sourceName, 'FALHA_IA', details);
        
        setSummary({
          successFiles: isFromFiles ? [] : [],
          errorFiles: isFromFiles ? [...errorFiles, { name: "Análise IA", details }] : [{ name: sourceName, details }],
          totalInvoices: 0,
          invoices: []
        });
        setLoading(false);
        return;
      }
      
      setProgress(95);
      setStatusMessage("Finalizando extração...");

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
      
      setProgress(100);
      setSummary({
        successFiles,
        errorFiles,
        totalInvoices: invoices.length,
        invoices
      });
      setLoading(false);
      
    } catch (err: any) {
      const errMsg = err.message || "Erro no serviço de IA Gemini.";
      await logError(sourceName, 'SISTEMA', errMsg);
      onToast("Erro técnico no processamento da IA.", "error");
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFiles(e.dataTransfer.files);
  };

  const confirmImport = () => {
    if (summary && summary.invoices.length > 0) {
      onImport(summary.invoices);
      onClose();
    } else {
      onClose();
    }
  };

  // Visualização de Resumo
  if (summary) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Resumo do Processamento</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Confira os resultados antes de salvar.</p>
            </div>
            <div className="bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase">
              {summary.totalInvoices} Itens Identificados
            </div>
          </div>

          <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {summary.successFiles.length > 0 && (
              <section>
                <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  Arquivos Processados ({summary.successFiles.length})
                </h4>
                <ul className="space-y-2">
                  {summary.successFiles.map((f, i) => (
                    <li key={i} className="text-sm text-slate-600 dark:text-slate-300 bg-emerald-50/50 dark:bg-emerald-900/20 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900 flex justify-between">
                      <span className="font-medium truncate">{f}</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">OK</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {summary.errorFiles.length > 0 && (
              <section>
                <h4 className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                  Falhas Detectadas ({summary.errorFiles.length})
                </h4>
                <ul className="space-y-2">
                  {summary.errorFiles.map((f, i) => (
                    <li key={i} className="text-sm text-slate-600 dark:text-slate-300 bg-rose-50/50 dark:bg-rose-900/20 p-3 rounded-lg border border-rose-100 dark:border-rose-900">
                      <div className="flex justify-between mb-1">
                        <span className="font-bold text-rose-800 dark:text-rose-400">{f.name}</span>
                        <span className="text-rose-600 dark:text-rose-500 text-[10px] font-black uppercase">Erro</span>
                      </div>
                      <p className="text-xs text-rose-600/80 dark:text-rose-400/80 italic">{f.details}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {summary.totalInvoices === 0 && summary.errorFiles.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum dado foi extraído dos arquivos fornecidos.</p>
              </div>
            )}
          </div>

          <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4 bg-slate-50/50 dark:bg-slate-800/50">
            <button onClick={onClose} className="px-8 py-3 rounded-2xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Cancelar</button>
            <button
              onClick={confirmImport}
              className="px-10 py-3 rounded-2xl bg-indigo-600 text-white font-black shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95"
            >
              {summary.totalInvoices > 0 ? 'Confirmar Importação' : 'Fechar'}
            </button>
          </div>
        </div>
        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'dark' ? '#334155' : '#e2e8f0'}; border-radius: 10px; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Importação Inteligente</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Os erros de processamento são registrados para auditoria.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-8 space-y-8 relative">
          <div 
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-[2rem] p-12 text-center transition-all ${
              dragActive ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <input 
              type="file" ref={fileInputRef} multiple accept=".xlsx,.xls,.xml,.csv,.txt" className="hidden" 
              onChange={(e) => e.target.files && processFiles(e.target.files)}
            />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shadow-inner">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">Arraste seus arquivos aqui</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">XML, XLSX, XLS ou CSV</p>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:shadow-md transition-all active:scale-95"
              >
                Selecionar Arquivos
              </button>
            </div>

            {loading && (
              <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center rounded-[2rem] z-20 p-12">
                <div className="w-full max-w-md space-y-6 text-center">
                  <div className="space-y-2">
                    <div className="flex justify-between items-end mb-1">
                      <p className="text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest text-left">{statusMessage}</p>
                      <p className="text-indigo-600 dark:text-indigo-400 font-black text-xs">{progress}%</p>
                    </div>
                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner p-0.5 border border-slate-200 dark:border-slate-700">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(79,70,229,0.4)]"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent"></div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Processando em tempo real</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100 dark:border-slate-800"></span></div>
            <div className="relative flex justify-center text-xs uppercase font-black text-slate-400 dark:text-slate-500"><span className="bg-white dark:bg-slate-900 px-4">OU COLE DADOS ABAIXO</span></div>
          </div>

          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            disabled={loading}
            className="w-full h-32 p-4 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-400/10 focus:border-indigo-500 outline-none text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50 transition-all resize-none disabled:opacity-50"
            placeholder="Cole aqui uma tabela ou texto descritivo..."
          />
        </div>

        <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4 bg-slate-50/50 dark:bg-slate-800/50">
          <button onClick={onClose} disabled={loading} className="px-8 py-3 rounded-2xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Cancelar</button>
          <button
            onClick={() => runAiParsing(pastedText, "Texto Copiado")}
            disabled={loading || !pastedText.trim()}
            className="px-10 py-3 rounded-2xl bg-indigo-600 text-white font-black shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
          >
            {loading ? 'Analisando...' : 'Processar Texto'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
