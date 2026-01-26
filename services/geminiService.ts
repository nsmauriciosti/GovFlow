
import { GoogleGenAI, Type } from "@google/genai";
import { Invoice, Situacao } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseBulkData = async (rawText: string): Promise<Partial<Invoice>[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Transforme o seguinte texto/tabela colada em um array JSON seguindo a estrutura de campos: SECRETARIA, FORNECEDOR, NE, NF, VALOR (numérico), VCTO (formato YYYY-MM-DD), PGTO (formato YYYY-MM-DD ou null), SITUAÇÃO (PAGO ou NÃO PAGO). 
    
    Texto:
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
          }
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
