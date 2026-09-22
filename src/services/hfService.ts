/**
 * Corrigido (2026-09-22): antes, este arquivo chamava a API do Hugging Face
 * DIRETO NO NAVEGADOR, lendo `import.meta.env.VITE_HUGGINGFACE_API_KEY` —
 * isso expõe a chave no bundle JS pra qualquer visitante do site (mesmo bug
 * já corrigido em api/chat.ts / chatService.ts, que também usa Hugging Face
 * desde 2026-09-22). A chamada real agora acontece em `api/format-lesson.ts`
 * (Vercel Function, servidor, lê
 * `HUGGINGFACE_API_KEY` sem prefixo VITE_). Este serviço só faz
 * `fetch('/api/format-lesson', ...)` — a chave nunca chega ao navegador.
 *
 * Nota de dev local: `/api/format-lesson` só responde rodando via
 * `vercel dev` (proxeia Vite + Vercel Functions juntos). Com `npm run dev`
 * puro, a chamada recebe 404 — comportamento esperado, tratado abaixo.
 */

export interface EnrichOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export async function formatLessonWithHF(
  rawMarkdown: string,
  options: EnrichOptions = {},
): Promise<string> {
  let response: Response;
  try {
    response = await fetch("/api/format-lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        markdown: rawMarkdown,
        model: options.model,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (err) {
    throw new Error(`Falha de rede ao chamar /api/format-lesson: ${(err as Error).message}`);
  }

  if (response.status === 404) {
    throw new Error(
      "/api/format-lesson não está disponível neste ambiente (rode via `vercel dev` para testar a formatação por IA localmente).",
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || `/api/format-lesson respondeu ${response.status}`);
  }

  const data = (await response.json()) as { markdown?: string };
  if (typeof data.markdown !== "string" || data.markdown.length === 0) {
    throw new Error("Resposta inválida de /api/format-lesson (sem conteúdo).");
  }

  return normalizeSlideSeparators(data.markdown);
}

function normalizeSlideSeparators(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => (line.trim() === "---" ? "---" : line))
    .join("\n")
    .trim();
}
