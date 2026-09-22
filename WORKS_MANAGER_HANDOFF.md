# 🤝 Handoff: Works Manager → sagacitas-landing-page (pipeline de aulas)

**Data:** 2026-09-22
**De:** sessão de trabalho no repositório `gestor-de-obras` (Works Manager)
**Para:** quem trabalhar neste repositório (`sagacitas-landing-page`) daqui pra frente

---

## O que o Works Manager entrega

O repositório `gestor-de-obras` roda `scripts/syncLessons.ts` e publica aulas de treinamento direto em `public.lessons` (mesmo projeto Supabase deste repo, `pnbxnuhzzwbciohjvhab`), preenchendo `id, tenant_id (NULL), gc_id, module_id, uc_id, title, type='slide', "order", markdown_content, updated_at`.

Todas as **28 aulas do Works Manager já estão publicadas** (`uc_id` no formato `wm-m{módulo}-a{ordem}`, ex. `wm-m1-a4`, `wm-m8-a6`).

## ✅ GAP CRÍTICO — RESOLVIDO (2026-09-22): compilador de manifesto construído

`CourseManifestService.fetchManifest(gcId)` ganhou um novo método `buildManifestFromLessons(gcId, tenantId)`, chamado como fallback entre a tentativa de `course_manifests` (que não existe) e o `getMockManifest()`. Ele consulta `lessons` direto (`gc_id`, `uc_id IS NOT NULL`, ordenado por `module_id`/`order`) e monta um `CourseManifest` real (`execution_graph.nodes` com `markdownContent` populado, `prerequisites: []` para todos — acervo tipo biblioteca, sem trava sequencial). `CourseEngineService.fetchManifest()` já delegava corretamente pra cá (linha 56), então nenhuma mudança foi necessária lá.

**Verificado com dados reais**: `npm run lint` e `npm run build` limpos; e a query exata do novo método rodada com a mesma anon key do browser (`VITE_SUPABASE_ANON_KEY`) contra o Supabase real retornou as **28 aulas** de `gc_id='works-manager-basic'` com `markdown_content` presente em todas. `fetchAvailableCourseSummaries()` (usado no dashboard) já lia `lessons` corretamente antes disso — só o carregamento do conteúdo de um curso individual estava quebrado.

## ✅ Hugging Face — RESOLVIDO (2026-09-22)

`api/format-lesson.ts` usava `https://api-inference.huggingface.co/...` — esse domínio não resolve DNS em lugar nenhum (endpoint legado descontinuado pela HF). Corrigido pro router atual: `https://router.huggingface.co/v1/chat/completions` (modelo no corpo, não na URL). O token também não tinha a permissão "Inference Providers" — usuário habilitou em huggingface.co/settings/tokens. **Testado via HTTP real contra a API de produção depois da correção: `200 OK`, resposta real do modelo `Qwen/Qwen2.5-72B-Instruct`.** Auto-Formatar (IA) no `AdminSlideEditor.tsx` está funcional ponta a ponta.

## ⚠️ Gemini — chave inválida (ainda pendente, ação do usuário)

`400 "API key not valid"` direto do Google. Provavelmente a chave tem restrição de HTTP referrer (criada pra uso no navegador) e agora, chamada do servidor (sem essa origem), é rejeitada. **Ação necessária**: gerar uma chave sem restrição de referrer no Google AI Studio / Cloud Console, específica pra uso server-side.

## ✅ Projeto Vercel — RESOLVIDO (2026-09-22)

`.vercel/project.json` apontava pro projeto errado (`rdo-wm`). Corrigido: `vercel link --scope sagacitas --project sagacitas-landing-page` → agora aponta pro projeto real (`prj_hOyEi7TYI3C3hwtHSUHrcoAZaFgA`, time `sagacitas`). **Achado durante a correção**: esse projeto Vercel está **zerado** — nenhuma variável de ambiente configurada lá (`vercel env ls` retornou vazio). Um `vercel deploy` a partir daqui funcionaria localmente mas falharia em produção (todas as Vercel Functions cairiam nos `503`/fallback por falta de `SUPABASE_*`, `HUGGINGFACE_API_KEY`, `GEMINI_API_KEY`, `BLOB_READ_WRITE_TOKEN`, etc.) até essas variáveis serem enviadas via `vercel env add` (ou pelo dashboard). Pendente: subir essas variáveis antes do primeiro deploy real (aguardando a chave do Gemini ser corrigida primeiro, pra subir tudo de uma vez já funcional).

## ⚠️ Responsabilidade que passou pra cá: formatação em slides via Hugging Face

**Decisão (2026-09-22):** o Works Manager **não faz mais** pré-processamento via Hugging Face. O script `hfPreprocess.ts` que existia lá foi removido. A partir de agora:

- **13 aulas** já chegam com `markdown_content` **pronto**, formatado em slides (separadores `\n---\n`, compatível 1:1 com `SlideRenderer.tsx`). Essas não precisam de nada.
- **15 aulas** chegam com `markdown_content` = **corpo bruto da aula** (texto corrido, sem separadores de slide) — precisam ser formatadas em slides **deste lado**, via o botão "✨ Auto-Formatar (IA)" do `AdminSlideEditor.tsx` (já implementado, ver abaixo) ou por edição manual.

### 🔒 Segurança — chaves de API neste repositório: **corrigido pros dois casos** (2026-09-22)

Este repositório era 100% frontend (sem `server.ts`, `api/`, nem `vercel.json`) — qualquer chave lida via `import.meta.env.VITE_*` vai pro bundle JS, extraível por qualquer visitante via DevTools. Isso aconteceu de verdade **duas vezes** neste repo, e as duas foram corrigidas com o mesmo padrão:

| Serviço | Antes (inseguro) | Depois (corrigido) |
|---|---|---|
| Chat (Gemini) | `geminiService.ts` lia `VITE_GEMINI_API_KEY` direto no navegador | `api/chat.ts` (Vercel Function) lê `GEMINI_API_KEY` no servidor; `geminiService.ts` vira `fetch('/api/chat')` |
| Auto-Formatar aula (Hugging Face) | `hfService.ts` lia `VITE_HUGGINGFACE_API_KEY` direto no navegador | `api/format-lesson.ts` (Vercel Function) lê `HUGGINGFACE_API_KEY` no servidor; `hfService.ts` vira `fetch('/api/format-lesson')` |

Em ambos os casos: `.env`/`.env.example` atualizados (removido o prefixo `VITE_`), `@vercel/node` adicionado como devDependency, assinatura das funções de serviço (`getChatResponse`/`formatLessonWithHF`) mantida idêntica — nenhum componente que os chama (`Chatbot.tsx`, `AdminSlideEditor.tsx`) precisou mudar. **Confirmado por `npm run build` + busca no `dist/` gerado: nenhuma das duas chaves aparece mais no bundle.**

**Nota de dev local**: `/api/chat` e `/api/format-lesson` só respondem rodando via `vercel dev` (proxeia Vite + Vercel Functions juntos); com `npm run dev` puro (Vite só), as chamadas caem nos fallbacks tratados no próprio código — comportamento esperado, não é bug.

**Se for adicionar uma chave de API nova aqui no futuro**: siga o mesmo padrão — nunca prefixo `VITE_`, sempre uma Vercel Function em `api/*.ts` lendo do `process.env` do servidor.

### Como identificar quais das 28 ainda precisam de formatação

Não existe uma coluna dedicada pra isso (não foi adicionada pra não mexer mais no schema compartilhado sem necessidade). O sinal prático: **conteúdo sem múltiplos blocos separados por uma linha `---` isolada** provavelmente é bruto. Lista exata das 15 pendentes nesta publicação (2026-09-22), por `uc_id`:

```
wm-m1-a1, wm-m1-a2, wm-m1-a3,
wm-m2-a1, wm-m2-a2, wm-m2-a3,
wm-m3-a1, wm-m3-a2, wm-m3-a3,
wm-m4-a1, wm-m4-a2, wm-m4-a3,
wm-m5-a1,
wm-m6-a1,
wm-m7-a1
```

(As outras 13 — `wm-m1-a4` a `wm-m1-a10`, `wm-m8-a1` a `wm-m8-a6` — já estão formatadas.)

### Como salvar de volta

`LessonEditorService.saveLessonMarkdown(lessonId, markdownContent)` já grava em `lessons.markdown_content` — é só usar o `id` (uuid) da linha, buscável por `uc_id` se precisar (`SELECT id FROM lessons WHERE uc_id = 'wm-m1-a1'`).

## Por que essa divisão

O usuário decidiu que este repositório (`sagacitas-landing-page`) terá ferramentas de edição avançada de aulas — o que pode tornar a formatação automática via Hugging Face desnecessária em alguns casos (edição manual resolve), ou continuar sendo útil como um primeiro rascunho automático antes da revisão humana. Essa decisão de **como** formatar (HF, manual, ou os dois) fica a critério de quem trabalhar aqui — o Works Manager só garante que o conteúdo bruto e correto chega até `lessons.markdown_content`.

## Outras notas importantes herdadas desta sessão

- `public.lessons` tem um **gatilho de imutabilidade** — `DELETE` é bloqueado por design ("aulas são conhecimento universal e não podem ser apagadas"). Qualquer correção é via `UPDATE`.
- Existe **1 linha duplicada inofensiva** pra "Matriz de Acessos" (sem `uc_id`, órfã de um bug já corrigido do lado do Works Manager) — pode ser ignorada, nenhuma busca por `uc_id` a encontra.
- Existe outro repositório no mesmo projeto Supabase, `Sagacitas-E-Learning` (Mosaico de Conhecimento: `knowledge_units`/`learning_objects` faceteados PMEST) — é um produto **diferente e futuro**, sem relação com as aulas do Works Manager. Não confundir os dois ao mexer no banco.
- Verificado (2026-09-22): a tela do aluno é `OAPlayerView.tsx` (substituiu o antigo `LessonPlayerView.tsx`, já removido) e já roteia nós `type === 'slide'` pro `SlideRenderer.tsx`, que lê `markdownContent` direto — a ponte estava correta, só faltava o `CourseManifest` chegar populado até ela (ver seção "GAP CRÍTICO" acima, agora resolvido).

## Referências no repo `gestor-de-obras`

- `.ai/history/2026-09-22_pivo_schema_mosaico_conhecimento_sagacitas.md`, `2026-09-22b_*.md`, `2026-09-22c_*.md` — histórico completo da investigação
- `INSTRUCOES_AGENTE_WORKS_MANAGER.md` — guia de referência do lado Works Manager
- `scripts/syncLessons.ts` — o script que publica aqui
