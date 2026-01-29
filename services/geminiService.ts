import { GoogleGenAI, Type } from "@google/genai";
import { Invoice } from "../types";

/**
 * Analisa dados em lote (texto ou XML) e os converte em objetos Invoice estruturados.
 * Utiliza o modelo gemini-3-flash-preview para tarefas de extração de dados.
 */
export const parseBulkData = async (rawText: string): Promise<Partial<Invoice>[]> => {
  // Inicializa o cliente GenAI diretamente com a chave do ambiente no momento da execução
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
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
              pgto: { type: Type.STRING },
              situacao: { type: Type.STRING }
            },
            required: ["secretaria", "fornecedor", "valor"]
          }
        }
      }
    });

    // Extrai o texto da propriedade .text do objeto GenerateContentResponse
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
  // Inicializa o cliente GenAI logo antes da chamada para garantir uso da chave mais recente
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
      contents: `Atue como um Especialista em Gestão de Finanças Públicas. Analise estes dados de notas fiscais e forneça um breve resumo executivo (máximo 3 parágrafos) com pontos de atenção sobre fluxo de caixa, secretarias mais onerosas e sugestões de governança.
      
      Dados: ${JSON.stringify(summary)}`,
    });

    // Acesso direto à propriedade .text da resposta
    return response.text || "Não foi possível gerar insights.";
  } catch (e) {
    console.error("Erro ao gerar insights", e);
    return "Erro ao conectar com o serviço de Inteligência Artificial.";
  }
};
