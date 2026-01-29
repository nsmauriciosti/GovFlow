
import { GoogleGenAI, Type } from "@google/genai";
import { Invoice, Situacao } from "../types";

// A chave é injetada via Vite 'define'
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const parseBulkData = async (rawText: string): Promise<Partial<Invoice>[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Você é um Analista de Dados Governamentais especializado em Notas Fiscais. 
    Abaixo está um conteúdo que pode ser um texto colado, um CSV de planilha ou o conteúdo bruto de um XML de NFe (Nota Fiscal Eletrônica).
    
    INSTRUÇÕES:
    1. Extraia os dados para um array JSON estruturado.
    2. No caso de XML NFe:
       - <xNome> do <emit> é o FORNECEDOR.
       - <xNome> do <dest> é a SECRETARIA (ou destinatário).
       - <nNF> é a NF.
       - <vNF> é o VALOR.
       - <dhEmi> é a data base (VCTO).
    3. Formatos: VALOR deve ser numérico, VCTO e PGTO em YYYY-MM-DD.
    4. SITUAÇÃO deve ser PAGO ou NÃO PAGO.
    
    CONTEÚDO PARA ANÁLISE:
    ${rawText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            secretaria: { type: Type.STRING },
            fornecedor: { type: Type.STRING },
            ne: { type: Type.STRING },
            nf: { type: Type.STRING },
            valor: { type: Type.NUMBER },
            vcto: { type: Type.STRING },
            pgto: { type: Type.STRING, nullable: true },
            situacao: { type: Type.STRING }
          },
          required: ["secretaria", "fornecedor", "valor"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Erro ao processar resposta do Gemini", e);
    return [];
  }
};

export const getFinancialInsights = async (invoices: Invoice[]): Promise<string> => {
  const summary = invoices.map(i => ({
    sec: i.secretaria,
    val: i.valor,
    sit: i.situacao,
    vcto: i.vcto
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Atue como um Especialista em Gestão de Finanças Públicas. Analise estes dados de notas fiscais e forneça um breve resumo executivo (máximo 3 parágrafos) com pontos de atenção sobre fluxo de caixa, secretarias mais onerosas e sugestões de governança.
    
    Dados: ${JSON.stringify(summary)}`,
  });

  return response.text;
};
