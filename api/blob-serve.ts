import type { VercelRequest, VercelResponse } from "@vercel/node";
import { get } from "@vercel/blob";
import { Readable } from "stream";

/**
 * Vercel Function — Proxy autenticado para servir blobs privados do Vercel Blob.
 *
 * Adaptado do snippet oficial da Vercel para Node.js (VercelRequest/VercelResponse
 * em vez de Next.js NextRequest/NextResponse).
 *
 * Fluxo:
 *   browser → GET /api/blob-serve?pathname=course-assets/tenant.../img.png
 *           → get(pathname, { access: 'private' }) → stream do blob
 *           → pipe do stream para o response (nunca toca disco)
 *
 * As imagens no Markdown das aulas usam:
 *   ![alt](/api/blob-serve?pathname=course-assets/tenant.../img.png)
 *
 * BLOB_READ_WRITE_TOKEN lido apenas no servidor (nunca prefixado com VITE_).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const pathname = req.query.pathname as string;
  if (!pathname) {
    res.status(400).json({ error: "Parâmetro 'pathname' é obrigatório." });
    return;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res.status(503).json({ error: "BLOB_READ_WRITE_TOKEN não configurado no servidor." });
    return;
  }

  try {
    const result = await get(pathname, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // result é null quando o blob não existe
    if (!result || (result as unknown as { statusCode?: number }).statusCode === 404) {
      res.status(404).send("Arquivo não encontrado no Blob Store.");
      return;
    }

    const blobResult = result as unknown as {
      statusCode: number;
      stream: ReadableStream;
      blob: { contentType: string };
    };

    res.setHeader("Content-Type", blobResult.blob?.contentType ?? "application/octet-stream");
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Converte Web ReadableStream → Node.js Readable e faz pipe para o response
    // (Node.js 18+, disponível no runtime da Vercel)
    const nodeStream = Readable.fromWeb(blobResult.stream as Parameters<typeof Readable.fromWeb>[0]);
    nodeStream.pipe(res);
    nodeStream.on("error", (err) => {
      console.error("[blob-serve] Erro no stream:", err);
      if (!res.headersSent) res.status(500).json({ error: "Erro ao transmitir arquivo." });
    });
  } catch (error) {
    console.error("[blob-serve] Erro ao buscar blob:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
