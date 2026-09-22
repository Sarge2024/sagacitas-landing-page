# 2026-09-22 — Criação retroativa do ledger: segurança, chat, Vercel, compilador de manifesto

## Contexto

Este protocolo (`.ai/sync/`, `.ai/history/`, `CLAUDE.md`) não existia até este ponto. Uma sessão de Claude Code e uma sessão de Gemini editaram este repositório em paralelo, no mesmo dia, sem nenhuma coordenação — chegaram a criar `src/services/hfService.ts` em dois lugares diferentes por engano, resolvido manualmente na hora. O usuário pediu explicitamente pra montar aqui o mesmo protocolo de handoff que já existe no repo irmão `gestor-de-obras` (Works Manager), pra sessões futuras não colidirem assim de novo.

As entradas abaixo documentam **retroativamente** o que já tinha sido construído neste mesmo dia, antes do protocolo existir, pra não perder o contexto.

## O que já tinha sido construído neste dia (antes do protocolo)

### 1. Segurança — chaves de API expostas no bundle do navegador
`geminiService.ts` e `hfService.ts` liam `import.meta.env.VITE_GEMINI_API_KEY`/`VITE_HUGGINGFACE_API_KEY` direto no frontend — extraível por qualquer visitante via DevTools, permitindo abuso de cota/fatura. Corrigido criando `api/chat.ts` e `api/format-lesson.ts` (Vercel Functions), que leem as chaves só no servidor (`GEMINI_API_KEY`/`HUGGINGFACE_API_KEY`, sem prefixo `VITE_`). Assinatura das funções de serviço mantida idêntica — nenhum componente chamador precisou mudar. Confirmado por `npm run build` + grep no `dist/` gerado: nenhuma chave aparece no bundle.

### 2. Hugging Face — endpoint morto + permissão do token
`api/format-lesson.ts` usava `https://api-inference.huggingface.co/...` — esse domínio não resolve DNS em lugar nenhum (endpoint legado descontinuado pela HF, confirmado via `getent hosts`, não é limitação de sandbox). Corrigido pro router atual: `https://router.huggingface.co/v1/chat/completions` (modelo no corpo da requisição, não na URL). O token também não tinha a permissão "Inference Providers" habilitada — usuário habilitou em huggingface.co/settings/tokens. **Testado via HTTP real contra a API de produção depois da correção completa: `200 OK`, resposta real do modelo `Qwen/Qwen2.5-72B-Instruct`.**

### 3. Chat do site: Gemini substituído por Hugging Face
A chave do Gemini ficou presa em `400 "API key not valid"` (provável restrição de referrer HTTP, criada pra uso no navegador, rejeitada vindo do servidor) e não foi corrigida — usuário pediu explicitamente um provedor de LLM gratuito no lugar, confirmando reaproveitar a Hugging Face já validada. `api/chat.ts` reescrito removendo `@google/genai`/`GoogleGenAI`, chamando o mesmo endpoint HF já validado. Histórico de chat convertido do formato Gemini (`{role:'user'|'model', parts:[{text}]}`) pro formato OpenAI-compatible (`{role:'user'|'assistant', content}`) exigido pelo router da HF. `src/services/geminiService.ts` renomeado pra `src/services/chatService.ts` (nome antigo ficaria enganoso) — só o import em `Chatbot.tsx` mudou. `@google/genai` removido do `package.json`. `GEMINI_API_KEY` removida do `.env`/`.env.example`. **Testado ao vivo via `vercel dev` + curl: `POST /api/chat` retornou resposta real e coerente da Hugging Face.**

### 4. Projeto Vercel linkado errado
`.vercel/project.json` apontava pro projeto `rdo-wm` (outro produto, app de RDO). A conta autenticada só via 2 projetos (`gestor-de-obras`, `rdo-wm`) até o projeto real `sagacitas-landing-page` aparecer (criado ~2 minutos antes da checagem, provavelmente por integração GitHub disparada em paralelo). Relinkado com sucesso: `vercel link --scope sagacitas --project sagacitas-landing-page` → `.vercel/project.json` agora aponta pro projeto certo (`prj_hOyEi7TYI3C3hwtHSUHrcoAZaFgA`). **Achado durante a correção**: o projeto Vercel real está com **zero variáveis de ambiente** configuradas em produção (`vercel env ls` retornou vazio) — pendente subir via `vercel env add` (Supabase, Blob, `HUGGINGFACE_API_KEY`) antes de qualquer deploy real funcionar.

### 5. Compilador de manifesto (`lessons` → `CourseManifest`)
O carregamento de curso do lado do aluno (`useCourseStore.loadCourse()` → `CourseEngineService.fetchManifest()` → `CourseManifestService.fetchManifest()`) nunca lia a tabela `lessons` — tentava `courses.manifest` (coluna inexistente) e `course_manifests` (tabela inexistente), sempre caindo num catálogo mock hardcoded. As 28 aulas publicadas pelo Works Manager nunca chegavam no aluno, apesar de `lessons.markdown_content` estar correto e `SlideRenderer.tsx` saber renderizar. Corrigido com um novo método `CourseManifestService.buildManifestFromLessons(gcId, tenantId)`: consulta `lessons` direto por `gc_id`, monta `LearningObject[]` (`prerequisites: []` em todos — acervo tipo biblioteca, sem trava sequencial), chamado como fallback entre `course_manifests` e o mock. `CourseEngineService.fetchManifest()` já delegava corretamente, sem mudanças. **Testado com a query exata rodada com a mesma `VITE_SUPABASE_ANON_KEY` do navegador contra o Supabase de produção: as 28 aulas de `works-manager-basic` retornam com `markdown_content` presente em todas.**

## Verificação (consolidada)

- `npm run lint` (`tsc --noEmit`) e `npm run build`: limpos em cada uma das mudanças acima.
- Testes reais (não só leitura de código): Vercel Blob (round-trip completo), Hugging Face (endpoint + permissão, `200 OK`), chat via HF (`vercel dev`+curl), compilador de manifesto (query real com anon key), relink do Vercel (`vercel project ls`/`vercel env ls`).

## Pendências

1. Subir variáveis de ambiente pro projeto Vercel correto (`vercel env add` — `SAGACITAS_SUPABASE_URL`, `SAGACITAS_SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `HUGGINGFACE_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID`) antes do primeiro deploy real funcionar em produção.
2. 15 das 28 aulas do Works Manager ainda chegam com corpo bruto (sem separadores de slide `---`) — formatação via botão "Auto-Formatar (IA)" ou edição manual, lista exata de `uc_id` em `WORKS_MANAGER_HANDOFF.md`.

## Referências

- `WORKS_MANAGER_HANDOFF.md` (raiz deste repo) — documento de handoff do lado Works Manager, mais detalhado sobre a divisão de responsabilidade.
- `.ai/history/2026-09-21_pipeline_slides_treinamento_works_manager.md` até `2026-09-22h_chat_gemini_para_huggingface.md` no repo `gestor-de-obras` — ledger original, completo, onde este trabalho foi feito e registrado antes deste protocolo existir aqui.
