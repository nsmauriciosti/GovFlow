
import { GoogleGenAI, Type } from "@google/genai";
import { Invoice, Supplier } from "../types";

/**
 * Analisa dados (texto ou XML) e os converte em objetos Invoice estruturados.
 * Otimizado para processar chunks individuais para evitar estouro de tokens.
 */
export const parseBulkData = async (rawText: string): Promise<(Partial<Invoice> & { supplierData?: Partial<Supplier> })[]> => {
  if (!rawText || rawText.trim().length === 0) return [];

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é um Analista de Dados Governamentais especializado em Notas Fiscais (NFe).
      Analise o conteúdo abaixo e extraia os dados para um array JSON estruturado.
      
      Regras:
      - Extraia CNPJ (numérico), Razão Social, Número da NF, Valor e Vencimento.
      - Se for XML, procure por <emit>, <vNF>, <dVenc>.
      - Se for CSV/Planilha, identifique as colunas de Fornecedor e Valor.
      - Retorne APENAS o JSON no formato de array, sem textos explicativos.

      CONTEÚDO PARA ANÁLISE:
      ${rawText.substring(0, 300000)}`, // Limite conservador para evitar estouro de token no input
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
              pgto: { type: Type.STRING },
              situacao: { type: Type.STRING },
              supplierData: {
                type: Type.OBJECT,
                properties: {
                  razaoSocial: { type: Type.STRING },
                  nomeFantasia: { type: Type.STRING },
                  cnpj: { type: Type.STRING },
                  email: { type: Type.STRING },
                  telefone: { type: Type.STRING },
                  endereco: { type: Type.STRING },
                  cidade: { type: Type.STRING },
                  estado: { type: Type.STRING }
                }
              }
            },
            required: ["fornecedor", "valor"]
          }
        }
      }
    });

    const responseText = response.text || "[]";
    // Tenta extrair apenas a parte do JSON caso a IA retorne markdown ```json ... ```
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    const cleanJson = jsonMatch ? jsonMatch[0] : responseText;
    
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Erro na extração IA Gemini:", e);
    return [];
  }
};

/**
 * Fornece insights financeiros resumidos a partir de uma lista de faturas.
 */
export const getFinancialInsights = async (invoices: Invoice[]): Promise<string> => {
  if (invoices.length === 0) return "Aguardando dados para análise.";
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Amostra de dados para contexto (limita para não estourar tokens)
  const summary = invoices.slice(0, 50).map(i => ({
    sec: i.secretaria,
    val: i.valor,
    sit: i.situacao,
    vcto: i.vcto
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Atue como Especialista em Finanças Públicas. Resuma estes dados de faturas (máximo 3 parágrafos curtos). Foque em volume por secretaria e riscos de vencimento.
      
      DADOS: ${JSON.stringify(summary)}`,
    });

    return response.text || "Resumo não disponível.";
  } catch (e) {
    console.error("Erro ao gerar insights:", e);
    return "O motor de IA encontrou um erro ao processar o dashboard.";
  }
};
