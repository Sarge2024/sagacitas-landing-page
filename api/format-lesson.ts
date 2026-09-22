import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Vercel Function (server-side) para formatar aulas em slides via Hugging
 * Face. Segue o mesmo padrão de api/chat.ts: a chamada real à API acontece
 * só aqui, no servidor, lendo `HUGGINGFACE_API_KEY` (sem prefixo VITE_, nunca
 * enviada ao navegador). O frontend chama `/api/format-lesson` via fetch —
 * ver src/services/hfService.ts.
 */

const DEFAULT_MODEL = "Qwen/Qwen2.5-72B-Instruct";

const SYSTEM_PROMPT = `
Você é um designer instrucional especializado no sistema Works Manager.
Sua tarefa é converter o texto Markdown bruto de uma aula em um Markdown formatado para slides HTML responsivos.

Regras estritas:
1. Separe cada slide utilizando a linha contendo estritamente três hífenes: "\\n---\\n".
2. Cada slide DEVE começar com um título de nível 2 (## Nome do Slide).
3. Converta blocos de texto longos em tópicos (bullet points) sucintos (máximo 4 a 5 pontos por slide).
4. Onde for conveniente incluir um recurso visual ou print de tela do Works Manager, insira a sintaxe:
   ![Placeholder](Descrição detalhada da imagem/print do sistema a ser inserido).
5. Preserve citações importantes usando a sintaxe de callout: '> [!NOTE]' ou '> [!TIP]'.
6. Não altere o Frontmatter (cabeçalho YAML) se houver.
`;

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
    res.status(503).json({ error: "HUGGINGFACE_API_KEY não configurada no servidor." });
    return;
  }

  const { markdown, model, temperature, maxTokens } = (req.body ?? {}) as {
    markdown?: unknown;
    model?: unknown;
    temperature?: unknown;
    maxTokens?: unknown;
  };

  if (typeof markdown !== "string" || markdown.trim() === "") {
    res.status(400).json({ error: "Campo 'markdown' é obrigatório." });
    return;
  }

  const selectedModel = typeof model === "string" && model.trim() ? model : DEFAULT_MODEL;
  const url = `https://api-inference.huggingface.co/models/${selectedModel}/v1/chat/completions`;

  let hfResponse: Response;
  try {
    hfResponse = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: markdown },
        ],
        temperature: typeof temperature === "number" ? temperature : 0.3,
        max_tokens: typeof maxTokens === "number" ? maxTokens : 2048,
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (error) {
    res.status(502).json({ error: `Falha de rede ao chamar Hugging Face API: ${(error as Error).message}` });
    return;
  }

  if (!hfResponse.ok) {
    const bodyText = await hfResponse.text().catch(() => "");
    res.status(502).json({
      error: `Erro na API do Hugging Face (${hfResponse.status} ${hfResponse.statusText}): ${bodyText.slice(0, 500)}`,
    });
    return;
  }

  const data = (await hfResponse.json()) as HfChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content;

  if (typeof content !== "string" || content.length === 0) {
    res.status(502).json({ error: "Resposta inválida da Hugging Face API (sem conteúdo)." });
    return;
  }

  res.status(200).json({ markdown: content });
}
