/**
 * Corrigido (2026-09-22): antes, este arquivo instanciava `GoogleGenAI` e
 * chamava a API do Gemini DIRETO NO NAVEGADOR, lendo
 * `import.meta.env.VITE_GEMINI_API_KEY` — isso expõe a chave no bundle JS
 * pra qualquer visitante do site (extraível via DevTools), permitindo abuso
 * da cota/fatura da conta. A chamada real passou pra `api/chat.ts` (Vercel
 * Function, roda no servidor).
 *
 * Renomeado de `geminiService.ts` pra `chatService.ts` (2026-09-22): a chave
 * do Gemini ficou presa em "API key not valid" e o usuário pediu um provedor
 * de LLM gratuito no lugar — `api/chat.ts` agora usa Hugging Face (mesmo
 * token/endpoint do Auto-Formatar em api/format-lesson.ts). Este arquivo só
 * faz `fetch('/api/chat', ...)` — a chave nunca chega ao navegador de
 * qualquer forma. Assinatura de `getChatResponse` inalterada, então
 * `src/components/Chatbot.tsx` não precisou mudar (só o import).
 *
 * Nota de dev local: `/api/chat` só responde rodando via `vercel dev`
 * (proxeia Vite + Vercel Functions juntos). Com `npm run dev` (Vite puro),
 * a chamada cai no catch abaixo e mostra a mensagem de indisponibilidade —
 * comportamento esperado, não é bug.
 */

const UNAVAILABLE_MESSAGE =
  "Desculpe, o serviço de chat está temporariamente indisponível (chave de API não configurada). Por favor, entre em contato conosco via e-mail ou telefone.";
const ERROR_MESSAGE =
  "Desculpe, estou passando por instabilidades técnicas no momento. Por favor, tente novamente mais tarde ou entre em contato via e-mail.";

export async function getChatResponse(
  message: string,
  history: { role: "user" | "model"; parts: { text: string }[] }[],
) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
    });

    if (response.status === 404) {
      // /api/chat não existe neste ambiente (ex.: `npm run dev` sem `vercel dev`).
      return UNAVAILABLE_MESSAGE;
    }
    if (!response.ok) {
      throw new Error(`/api/chat respondeu ${response.status}`);
    }

    const data = (await response.json()) as { text?: string };
    return data.text || ERROR_MESSAGE;
  } catch (error) {
    console.error("Erro ao chamar /api/chat:", error);
    return ERROR_MESSAGE;
  }
}
