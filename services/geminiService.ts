
import { GoogleGenAI, Type } from "@google/genai";
import { Invoice, Supplier } from "../types";

/**
 * Analisa dados em lote (texto ou XML) e os converte em objetos Invoice estruturados,
 * incluindo metadados de fornecedores para sincronização automática.
 */
export const parseBulkData = async (rawText: string): Promise<(Partial<Invoice> & { supplierData?: Partial<Supplier> })[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Você é um Analista de Dados Governamentais especializado em Notas Fiscais (NFe) e Cadastros de Fornecedores. 
      Analise o conteúdo abaixo (que pode ser texto, CSV ou XML bruto).
      
      INSTRUÇÕES DE EXTRAÇÃO:
      1. Extraia cada nota fiscal encontrada para o array JSON.
      2. Para cada nota, identifique os dados do EMITENTE (Fornecedor).
      3. Importante: Extraia o CNPJ sem formatação (apenas números) ou no formato 00.000.000/0000-00.
      4. No caso de XML NFe:
         - Localize a tag <emit> para extrair CNPJ, xNome (razaoSocial), xFant (nomeFantasia).
         - Localize <enderEmit> para endereco, xLgr, nro, xBairro, xMun (cidade), UF (estado).
         - Localize <email> e <fone> (telefone).
      5. Formatos: VALOR (number), VCTO (YYYY-MM-DD), PGTO (YYYY-MM-DD ou null).
      
      CONTEÚDO:
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

    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Erro ao processar resposta do Gemini", e);
    return [];
  }
};

/**
 * Fornece insights financeiros resumidos a partir de uma lista de faturas.
 */
export const getFinancialInsights = async (invoices: Invoice[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const summary = invoices.map(i => ({
    sec: i.secretaria,
    val: i.valor,
    sit: i.situacao,
    vcto: i.vcto
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Atue como um Especialista em Gestão de Finanças Públicas. Analise estes dados de notas fiscais e forneça um breve resumo executivo (máximo 3 parágrafos) com pontos de atenção sobre fluxo de caixa e governança.
      
      Dados: ${JSON.stringify(summary)}`,
    });

    return response.text || "Não foi possível gerar insights.";
  } catch (e) {
    console.error("Erro ao gerar insights", e);
    return "Erro ao conectar com o serviço de IA.";
  }
};
