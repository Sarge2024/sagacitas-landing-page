# 🤝 Handoff: Works Manager → sagacitas-landing-page (pipeline de aulas)

**Data:** 2026-09-22
**De:** sessão de trabalho no repositório `gestor-de-obras` (Works Manager)
**Para:** quem trabalhar neste repositório (`sagacitas-landing-page`) daqui pra frente

---

## O que o Works Manager entrega

O repositório `gestor-de-obras` roda `scripts/syncLessons.ts` e publica aulas de treinamento direto em `public.lessons` (mesmo projeto Supabase deste repo, `pnbxnuhzzwbciohjvhab`), preenchendo `id, tenant_id (NULL), gc_id, module_id, uc_id, title, type='slide', "order", markdown_content, updated_at`.

Todas as **28 aulas do Works Manager já estão publicadas** (`uc_id` no formato `wm-m{módulo}-a{ordem}`, ex. `wm-m1-a4`, `wm-m8-a6`).

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
- Não verificado nesta sessão: se `LessonPlayerView.tsx` (a tela que o aluno vê) já busca de `lessons.markdown_content` via `SlideRenderer.tsx`, ou se essa ponte ainda precisa ser conectada — hoje ele lê `course.presentation.slides` (não populado) com fallback pra conteúdo mockado.

## Referências no repo `gestor-de-obras`

- `.ai/history/2026-09-22_pivo_schema_mosaico_conhecimento_sagacitas.md`, `2026-09-22b_*.md`, `2026-09-22c_*.md` — histórico completo da investigação
- `INSTRUCOES_AGENTE_WORKS_MANAGER.md` — guia de referência do lado Works Manager
- `scripts/syncLessons.ts` — o script que publica aqui
