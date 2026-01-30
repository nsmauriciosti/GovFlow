
import { GoogleGenAI, Type } from "@google/genai";
import { Invoice, Supplier } from "../types";

/**
 * Analisa dados (texto ou XML) e os converte em objetos Invoice estruturados.
 * Otimizado para processar chunks individuais para evitar estouro de tokens.
 */
export const parseBulkData = async (rawText: string): Promise<(Partial<Invoice> & { supplierData?: Partial<Supplier> })[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é um Analista de Dados Governamentais especializado em Notas Fiscais (NFe).
      Analise o conteúdo abaixo e extraia os dados para um array JSON.
      
      IMPORTANTE:
      - Extraia o CNPJ apenas com números ou no formato padrão.
      - Se for XML, use as tags <emit>, <enderEmit>, <vPrest>, <infNFe>.
      - Se o valor contiver vírgula, converta para número (ponto decimal).
      - Retorne APENAS o JSON estruturado, sem explicações.

      CONTEÚDO:
      ${rawText.substring(0, 500000)}`, // Salvaguarda adicional de caracteres
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
            required: ["secretaria", "fornecedor", "valor"]
          }
        }
      }
    });

    const text = response.text || "[]";
    // Limpeza de possíveis blocos de código markdown que a IA possa retornar por engano
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Erro ao processar resposta do Gemini", e);
    // Se o erro for de parsing (JSON incompleto), tenta retornar o que foi possível ou array vazio
    return [];
  }
};

/**
 * Fornece insights financeiros resumidos a partir de uma lista de faturas.
 */
export const getFinancialInsights = async (invoices: Invoice[]): Promise<string> => {
  if (invoices.length === 0) return "Aguardando dados para análise.";
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Limita a quantidade de notas enviadas para insight para não estourar contexto
  const summary = invoices.slice(0, 50).map(i => ({
    sec: i.secretaria,
    val: i.valor,
    sit: i.situacao,
    vcto: i.vcto
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Atue como um Especialista em Gestão de Finanças Públicas. Analise estes dados de notas fiscais e forneça um breve resumo executivo (máximo 3 parágrafos).
      
      Dados: ${JSON.stringify(summary)}`,
    });

    return response.text || "Não foi possível gerar insights.";
  } catch (e) {
    console.error("Erro ao gerar insights", e);
    return "Erro ao conectar com o serviço de IA.";
  }
};
