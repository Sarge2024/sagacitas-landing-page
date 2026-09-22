import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put } from "@vercel/blob";

/**
 * Vercel Function — Server-side upload para o Vercel Blob (store privado).
 *
 * Recebe a imagem como raw body (application/octet-stream) com o pathname
 * passado via query string. Faz o upload server-to-server para o Vercel Blob
 * com access: 'private' (compatível com o store sagacitas-landing-page-blob).
 *
 * Retorna { pathname } — o caminho interno do blob. O cliente usa este pathname
 * para construir a URL de exibição: /api/blob-serve?pathname=<pathname>
 * (ver api/blob-serve.ts que faz o proxy autenticado da imagem).
 *
 * BLOB_READ_WRITE_TOKEN lido apenas no servidor (nunca prefixado com VITE_).
 */
export const config = { api: { bodyParser: false } };

/** Lê o IncomingMessage (req) inteiro como Buffer. */
async function readBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res.status(503).json({ error: "BLOB_READ_WRITE_TOKEN não configurado no servidor." });
    return;
  }

  try {
    const pathname = (req.query.pathname as string) || `uploads/file-${Date.now()}`;
    const contentType = (req.headers["content-type"] ?? "application/octet-stream").split(";")[0].trim();

    const bodyBuffer = await readBody(req);

    if (!bodyBuffer.length) {
      res.status(400).json({ error: "Body vazio — nenhum arquivo recebido." });
      return;
    }

    const blob = await put(pathname, bodyBuffer, {
      access: "private",
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log("[blob-upload] Upload privado concluído:", blob.pathname);

    // Retorna o pathname interno — o cliente constrói /api/blob-serve?pathname=...
    res.status(200).json({
      pathname: blob.pathname,
      url: `/api/blob-serve?pathname=${encodeURIComponent(blob.pathname)}`,
    });
  } catch (error) {
    console.error("[blob-upload] Erro:", error);
    res.status(400).json({ error: (error as Error).message });
  }
}
