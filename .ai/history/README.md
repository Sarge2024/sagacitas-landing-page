# 🧠 AI Ledger - sagacitas-landing-page

Sumário cronológico contínuo de funcionalidades e correções construídas neste repositório por agentes de IA (Claude, Gemini, outros).

**Obrigatório**: todo agente de IA deve checar `.ai/sync/` (ver `.ai/sync/README.md`) ao iniciar uma sessão, antes de implementar qualquer coisa.

> [!TIP]
> Este repositório recebe conteúdo de treinamento publicado pelo repo irmão `gestor-de-obras` (Works Manager), direto na tabela `lessons` do Supabase compartilhado. `WORKS_MANAGER_HANDOFF.md` (raiz deste repo) é o ponto de entrada pra esse contexto cross-repo; o ledger completo do lado de lá vive em `.ai/history/` do `gestor-de-obras`.

---

## 📅 2026-09-22 — Criação retroativa do ledger: segurança, chat migrado pra Hugging Face, projeto Vercel corrigido, compilador de manifesto
- **Contexto**: este protocolo não existia até aqui — criado depois que Claude Code e Gemini editaram este repo em paralelo, no mesmo dia, sem coordenação (chegaram a criar `src/services/hfService.ts` em dois lugares por engano).
- **Resumo**: chaves de API (Gemini, Hugging Face) tiradas do bundle do navegador pra Vercel Functions; endpoint morto da Hugging Face corrigido e permissão do token habilitada (testado, `200 OK`); chat do site migrado de Gemini (chave inválida) pra Hugging Face; projeto Vercel relinkado (estava em `rdo-wm`, achado: zero env vars em produção); compilador de manifesto construído (`lessons` → `CourseManifest`) resolvendo o gap de as 28 aulas do Works Manager nunca chegarem no aluno.
- **Detalhe completo**: `.ai/history/2026-09-22_criacao_retroativa_ledger.md`.
