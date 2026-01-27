
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
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport, onToast, userEmail }) => {
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [pastedText, setPastedText] = useState('');
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
    let allExtractedText = "";
    let currentFileName = "";

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        currentFileName = file.name;
        const extension = file.name.split('.').pop()?.toLowerCase();

        try {
          if (extension === 'xlsx' || extension === 'xls') {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            allExtractedText += `\n[ARQUIVO EXCEL: ${file.name}]\n` + XLSX.utils.sheet_to_csv(firstSheet);
          } 
          else if (extension === 'xml') {
            const text = await file.text();
            allExtractedText += `\n[ARQUIVO XML NFE: ${file.name}]\n` + text;
          } 
          else if (extension === 'csv' || extension === 'txt') {
            const text = await file.text();
            allExtractedText += `\n[ARQUIVO TEXTO: ${file.name}]\n` + text;
          } else {
            throw new Error(`Extensão .${extension} não suportada.`);
          }
        } catch (fileErr: any) {
          await logError(file.name, 'FORMATO_INVALIDO', fileErr.message || "Erro desconhecido ao ler arquivo.");
          onToast(`Falha no arquivo ${file.name}: ${fileErr.message}`, "error");
        }
      }

      if (allExtractedText.trim()) {
        await runAiParsing(allExtractedText, "Lote de arquivos");
      }
    } catch (err: any) {
      onToast("Erro crítico no processamento de arquivos.", "error");
    } finally {
      setLoading(false);
    }
  };

  const runAiParsing = async (content: string, sourceName: string) => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const parsed = await parseBulkData(content);
      if (!parsed || parsed.length === 0) {
        await logError(sourceName, 'FALHA_IA', "A IA não conseguiu estruturar os dados. O conteúdo pode estar ilegível ou em formato não reconhecido.");
        onToast("A IA não identificou dados financeiros válidos.", "warning");
        return;
      }
      
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
    } catch (err: any) {
      await logError(sourceName, 'SISTEMA', err.message || "Erro no serviço de IA Gemini.");
      onToast("Erro técnico no processamento da IA.", "error");
    } finally {
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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Importação Inteligente</h3>
            <p className="text-sm text-slate-500 font-medium">Os erros de processamento são registrados para auditoria.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-full transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div 
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-[2rem] p-12 text-center transition-all ${
              dragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 bg-slate-50/30 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <input 
              type="file" ref={fileInputRef} multiple accept=".xlsx,.xls,.xml,.csv,.txt" className="hidden" 
              onChange={(e) => e.target.files && processFiles(e.target.files)}
            />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800">Arraste seus arquivos aqui</p>
                <p className="text-sm text-slate-500 mt-1">XML, XLSX, XLS ou CSV</p>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:shadow-md transition-all active:scale-95"
              >
                Selecionar Arquivos
              </button>
            </div>
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-[2rem] z-10">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                  <p className="text-indigo-600 font-black text-sm uppercase tracking-widest">Analisando Documentos...</p>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
            <div className="relative flex justify-center text-xs uppercase font-black text-slate-400"><span className="bg-white px-4">OU COLE DADOS ABAIXO</span></div>
          </div>

          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            className="w-full h-32 p-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm font-medium text-slate-700 bg-slate-50/50 transition-all resize-none"
            placeholder="Cole aqui uma tabela ou texto descritivo..."
          />
        </div>

        <div className="p-8 border-t border-slate-100 flex justify-end gap-4 bg-slate-50/50">
          <button onClick={onClose} className="px-8 py-3 rounded-2xl text-slate-600 font-bold hover:bg-slate-200 transition-all">Cancelar</button>
          <button
            onClick={() => runAiParsing(pastedText, "Texto Copiado")}
            disabled={loading || !pastedText.trim()}
            className="px-10 py-3 rounded-2xl bg-indigo-600 text-white font-black shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
          >
            {loading ? 'Processando...' : 'Processar Texto'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
