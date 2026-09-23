/**
 * Utilitários puros do protocolo `slide-id` (ver contrato técnico completo em
 * gestor-de-obras/.ai/specs/slide_identification_protocol.md). Sem
 * dependência de browser (import.meta.env) nem de Supabase — importável
 * tanto pelo frontend (src/player/services/SlideSyncService.ts) quanto por
 * uma Vercel Function em Node puro (api/format-lesson.ts).
 */

export const SLIDE_SEPARATOR = /\r?\n[ \t]*---[ \t]*\r?\n/;
const SLIDE_ID_COMMENT = /^<!--\s*slide-id:\s*([a-z0-9-]+)\s*-->[ \t]*\r?\n?/i;

export interface ExtractedSlideId {
  slideId: string | null;
  contentWithoutId: string;
}

export function extractSlideId(slideContent: string): ExtractedSlideId {
  const match = slideContent.match(SLIDE_ID_COMMENT);
  if (match) {
    return { slideId: match[1].toLowerCase(), contentWithoutId: slideContent.slice(match[0].length).trim() };
  }
  return { slideId: null, contentWithoutId: slideContent.trim() };
}

export function deriveSlideTitle(content: string): string {
  const headingMatch = content.match(/^#{1,6}\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();
  const firstLine = content.split(/\r?\n/).find(l => l.trim());
  return firstLine ? firstLine.trim().slice(0, 60) : '(slide sem título)';
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40) || 'slide'
  );
}

export interface ParsedSlideBase {
  index: number;
  slideId: string | null;
  rawContent: string;
  contentWithoutId: string;
  title: string;
}

/** Quebra markdown em slides (mesma regra de SlideRenderer.splitSlides) e extrai slide-id de cada um. */
export function parseSlides(markdown: string): ParsedSlideBase[] {
  const chunks = markdown
    .split(SLIDE_SEPARATOR)
    .map(s => s.trim())
    .filter(Boolean);

  return chunks.map((chunk, index) => {
    const { slideId, contentWithoutId } = extractSlideId(chunk);
    return { index, slideId, rawContent: chunk, contentWithoutId, title: deriveSlideTitle(contentWithoutId) };
  });
}

/**
 * Atribui um `slide-id` determinístico (derivado do título, sem IA) a todo
 * slide que ainda não tenha um — preserva os que já têm, intocados. Único
 * dentro da aula (mesmo escopo de identidade do protocolo).
 */
export function ensureSlideIds(markdown: string): string {
  const parts = markdown.split(new RegExp(`(${SLIDE_SEPARATOR.source})`));
  const usedIds = new Set<string>();

  for (let i = 0; i < parts.length; i += 2) {
    const trimmed = parts[i]?.trim();
    if (!trimmed) continue;
    const { slideId } = extractSlideId(trimmed);
    if (slideId) usedIds.add(slideId);
  }

  for (let i = 0; i < parts.length; i += 2) {
    const trimmed = parts[i]?.trim();
    if (!trimmed) continue;
    const { slideId, contentWithoutId } = extractSlideId(trimmed);
    if (slideId) continue;

    const base = slugify(deriveSlideTitle(contentWithoutId));
    let candidate = base;
    let suffix = 2;
    while (usedIds.has(candidate)) {
      candidate = `${base}-${suffix++}`;
    }
    usedIds.add(candidate);

    parts[i] = `\n<!-- slide-id: ${candidate} -->\n${contentWithoutId}\n`;
  }

  return parts.join('').trim() + '\n';
}
