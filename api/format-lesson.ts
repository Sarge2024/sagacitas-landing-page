import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureSlideIds } from "../src/lib/slideId";

/**
 * Vercel Function (server-side) para formatar aulas em slides via Hugging
 * Face. Segue o mesmo padrão de api/chat.ts: a chamada real à API acontece
 * só aqui, no servidor, lendo `HUGGINGFACE_API_KEY` (sem prefixo VITE_, nunca
 * enviada ao navegador). O frontend chama `/api/format-lesson` via fetch —
 * ver src/services/hfService.ts.
 */

const DEFAULT_MODEL = "Qwen/Qwen2.5-72B-Instruct";

// CORRIGIDO (2026-09-22): testado contra a API real com uma aula com imagens
// — a versão anterior desta regra 4 fazia o modelo REESCREVER imagens que já
// existiam no texto original (```![[PRINT: Título Real]](../imagens/x.png)```
// virava ```![Placeholder](Descrição sem título)```), destruindo o título
// que o Class Studio/ImageImportModal usa pra saber qual print anexar, e
// ainda gerando uma "URL" com espaços que nem o Markdown reconhece como
// imagem (renderiza como texto cru). Também confirmado por teste real: o
// modelo envolve a resposta inteira em um bloco de código ```markdown, o que
// vira um slide vazio quebrado — instrução 7 abaixo pede pra não fazer isso,
// e o handler também remove essa cerca defensivamente (ver stripCodeFence).
const SYSTEM_PROMPT = `
Você é um designer instrucional especializado no sistema Works Manager.
Sua tarefa é converter o texto Markdown bruto de uma aula em um Markdown formatado para slides HTML responsivos.

Regras estritas:
1. Separe cada slide utilizando a linha contendo estritamente três hífenes: "\\n---\\n".
2. Cada slide DEVE começar com um título de nível 2 (## Nome do Slide).
3. Converta blocos de texto longos em tópicos (bullet points) sucintos (máximo 4 a 5 pontos por slide).
4. Se o texto original já contiver uma imagem no formato "![alt](url)" (incluindo o padrão "![[PRINT: Título]](caminho)"), copie essa linha EXATAMENTE como está, sem alterar o texto alternativo (alt) nem o caminho — nunca substitua por "![Placeholder](...)". Preservar o título original é obrigatório.
5. Só quando NÃO houver imagem no texto original mas fizer sentido sugerir um print novo, insira uma linha no formato "![<descrição curta da imagem sugerida>](pendente)" — a palavra "pendente" deve ser usada literalmente como url, sem espaços, nunca uma frase.
6. Preserve citações importantes usando a sintaxe de callout: '> [!NOTE]' ou '> [!TIP]'.
7. Não altere o Frontmatter (cabeçalho YAML) se houver.
8. Responda APENAS com o Markdown resultante, em texto puro. Nunca envolva a resposta em um bloco de código (não use \`\`\`markdown nem \`\`\` no início ou no fim).
9. Se um slide já começar com um comentário "<!-- slide-id: algum-slug -->" logo após o separador "---", copie esse comentário EXATAMENTE como está, na mesma posição — nunca remova, altere ou invente um novo. Não se preocupe em adicionar esse comentário em slides que não tiverem um: isso é feito automaticamente depois, fora do seu controle.
`;

/**
 * Remove uma cerca de código (```markdown / ```) envolvendo a resposta,
 * caso o modelo ignore a instrução 8 do prompt — confirmado por teste real
 * que isso acontece com frequência suficiente pra não confiar só no prompt.
 */
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```[a-zA-Z]*\r?\n([\s\S]*?)\r?\n```$/);
  return match ? match[1].trim() : trimmed;
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
  // CORRIGIDO (2026-09-22): api-inference.huggingface.co não resolve mais DNS
  // (endpoint legado descontinuado pela Hugging Face — confirmado por teste
  // real, não suposição). O endpoint atual é o router unificado de Inference
  // Providers, com o modelo indicado no corpo da requisição, não na URL.
  const url = "https://router.huggingface.co/v1/chat/completions";

  let hfResponse: Response;
  try {
    hfResponse = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
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

  // Garante slide-id em todo slide que não tenha um (protocolo em
  // gestor-de-obras/.ai/specs/slide_identification_protocol.md), de forma
  // determinística e sem IA — mesma lição da regra 4 (preservação de
  // imagens): pedir pro modelo também *criar* corretamente algo tão
  // específico quanto atribuir IDs é frágil; a regra 9 do prompt só cuida
  // de preservar o que já existe, a atribuição do que falta é garantida aqui.
  const withSlideIds = ensureSlideIds(stripCodeFence(content));
  res.status(200).json({ markdown: withSlideIds });
}
