import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Vercel Function (server-side) para o chat do site.
 *
 * Histórico: rodava com Gemini (`@google/genai`), primeiro exposto no
 * navegador via `VITE_GEMINI_API_KEY` (corrigido em 2026-09-22 movendo pra
 * cá), depois substituído pela Hugging Face nesta versão (2026-09-22) porque
 * a chave do Gemini ficou presa em "API key not valid" (restrição de
 * referrer) e o usuário pediu um provedor de LLM gratuito no lugar — reusa o
 * mesmo endpoint/token já validado em api/format-lesson.ts
 * (router.huggingface.co, HUGGINGFACE_API_KEY).
 */

const DEFAULT_MODEL = "Qwen/Qwen2.5-72B-Instruct";
const HF_CHAT_URL = "https://router.huggingface.co/v1/chat/completions";

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

// Formato herdado do front-end (era o formato de `contents` do SDK do Gemini;
// mantido pra não precisar mudar o contrato de src/services/chatService.ts).
interface ChatHistoryItem {
  role: "user" | "model";
  parts: { text: string }[];
}

interface HfChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.HUGGINGFACE_API_KEY;
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

  const messages = [
    { role: "system" as const, content: SYSTEM_INSTRUCTION },
    ...safeHistory.map(item => ({
      role: item.role === "model" ? ("assistant" as const) : ("user" as const),
      content: item.parts.map(p => p.text).join("\n"),
    })),
    { role: "user" as const, content: message },
  ];

  try {
    const hfResponse = await fetch(HF_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!hfResponse.ok) {
      const bodyText = await hfResponse.text().catch(() => "");
      console.error(`Hugging Face API Error (${hfResponse.status}):`, bodyText.slice(0, 500));
      res.status(200).json({ text: ERROR_MESSAGE });
      return;
    }

    const data = (await hfResponse.json()) as HfChatCompletionResponse;
    const text = data.choices?.[0]?.message?.content;

    res.status(200).json({ text: text || EMPTY_RESPONSE_MESSAGE });
  } catch (error) {
    console.error("Hugging Face API Error:", error);
    res.status(200).json({ text: ERROR_MESSAGE });
  }
}
