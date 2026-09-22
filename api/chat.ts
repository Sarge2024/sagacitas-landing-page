import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

/**
 * Vercel Function (server-side) para o chat do site. Antes, `GoogleGenAI` era
 * instanciado direto no navegador (src/services/geminiService.ts) lendo
 * `import.meta.env.VITE_GEMINI_API_KEY` — isso expõe a chave no bundle JS
 * pra qualquer visitante (extraível via DevTools). Corrigido: a chamada à
 * API do Gemini agora só acontece aqui, no servidor, lendo `GEMINI_API_KEY`
 * (sem prefixo VITE_, nunca enviada ao navegador). O frontend chama
 * `/api/chat` via fetch — ver src/services/geminiService.ts.
 */

const SYSTEM_INSTRUCTION = `
Você é o assistente virtual da Sagacitas Consulting, uma consultoria especializada em otimização de processos industriais, gestão de custos e inteligência de negócios (BI).

Seu objetivo é:
1. Responder perguntas frequentes sobre os serviços da Sagacitas.
2. Ajudar os visitantes a entender como a Sagacitas pode ajudar suas indústrias.
3. Capturar leads: se o usuário demonstrar interesse em um diagnóstico ou serviço, peça educadamente o nome, e-mail corporativo e o principal desafio que enfrentam.

Informações sobre a Sagacitas:
- Serviços:
  * Análise de Processos Industriais: Identificação de gargalos e redesenho de fluxos.
  * Custeio Industrial: Estruturação de modelos de custos precisos.
  * Análise de Negócios (BI): Dashboards estratégicos para tomada de decisão.
  * Aplicações Personalizadas: Sistemas sob medida integrados ao ecossistema digital.
- Diferencial: União entre rigor da engenharia industrial e agilidade do desenvolvimento de software.
- Equipe: Consultores seniores e especialistas em arquitetura de dados com foco na gestão de custos.
- Contato: contato@sagacitas.com.br | +55 127 99662.9143.

Tom de voz: Profissional, prestativo, técnico mas acessível, e focado em resultados (eficiência e lucro).
Responda sempre em Português do Brasil.
Mantenha as respostas concisas e use bullet points quando apropriado.
`;

const UNAVAILABLE_MESSAGE =
  "Desculpe, o serviço de chat está temporariamente indisponível (chave de API não configurada). Por favor, entre em contato conosco via e-mail ou telefone.";
const ERROR_MESSAGE =
  "Desculpe, estou passando por instabilidades técnicas no momento. Por favor, tente novamente mais tarde ou entre em contato via e-mail.";
const EMPTY_RESPONSE_MESSAGE = "Desculpe, tive um problema ao processar sua mensagem. Poderia repetir?";

interface ChatHistoryItem {
  role: "user" | "model";
  parts: { text: string }[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    res.status(200).json({ text: UNAVAILABLE_MESSAGE });
    return;
  }

  const { message, history } = (req.body ?? {}) as { message?: unknown; history?: unknown };
  if (typeof message !== "string" || message.trim() === "") {
    res.status(400).json({ error: "Campo 'message' é obrigatório." });
    return;
  }
  const safeHistory: ChatHistoryItem[] = Array.isArray(history) ? (history as ChatHistoryItem[]) : [];

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [...safeHistory, { role: "user", parts: [{ text: message }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    res.status(200).json({ text: response.text || EMPTY_RESPONSE_MESSAGE });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(200).json({ text: ERROR_MESSAGE });
  }
}
