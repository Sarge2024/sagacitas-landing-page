# sagacitas-landing-page — Instruções para agentes de IA

Este repositório é trabalhado por mais de um agente de IA (pelo menos Claude Code e Gemini já editaram arquivos aqui em paralelo, no mesmo dia, sem coordenação — chegou a gerar um arquivo duplicado por engano). Siga esta ordem ao iniciar qualquer trabalho:

1. **`node scripts/ai-sync.mjs status --agent claude`** — checagem de custo mínimo: mostra só o que mudou desde a última vez que este agente trabalhou aqui (feito por qualquer ferramenta, inclusive Gemini). Ver `.ai/sync/README.md`.
2. Se alguma entrada tiver `ref` para algo que afete a sua tarefa, leia esse arquivo (`.ai/history/*.md`) para o contexto completo.
3. `.ai/history/README.md` é o ledger completo (leitura obrigatória na primeira vez ou quando precisar de contexto histórico mais amplo).
4. `WORKS_MANAGER_HANDOFF.md` — contexto cross-repo: este projeto recebe aulas de treinamento publicadas direto na tabela `lessons` pelo repo irmão `gestor-de-obras` (Works Manager). Leia antes de mexer em qualquer coisa relacionada a `lessons`, `CourseManifestService`, ou ao player de aulas.

## Método de trabalho (ver `.ai/WORKFLOW.md`)

- **Claude avalia, planeja e faz a revisão final; o Gemini executa.** Uma tarefa não-trivial vira um plano em `.ai/tasks/<id>.md` (modelo: `.ai/tasks/_modelo.md`) com critérios de aceite e o teste previsto para cada um; o Gemini implementa com TDD e devolve para revisão. As instruções do executor estão em `GEMINI.md`.
- O `status` do comando acima lista em `pending_tasks` as tarefas aguardando revisão do Claude.
- Mudança de status só pelo `node scripts/ai-sync.mjs task --agent claude --id <id> --to aprovada|reprovada`. Aprovar roda lint, `npm test` e `verify-red-green` de novo.
- Claude não implementa tarefa que ele mesmo vai revisar. Ajustes triviais podem ser feitos direto, registrados com `ai-sync write`.
- **TDD obrigatório**: nenhum código de produção sem teste que falhou antes (`tests/**/*.test.ts`, `npm test`, prova com `node scripts/verify-red-green.mjs --base <commit>`).

Ao concluir uma implementação não-trivial (ou ao aprovar uma tarefa):
- Rode `npm run lint` (`tsc --noEmit`), `npm test` e `npm run build` — devem estar limpos antes de registrar qualquer coisa.
- Prefira testar contra os serviços reais quando possível (`vercel dev` + curl para as Vercel Functions em `api/*.ts`; consultas diretas ao Supabase real para mudanças de dados) em vez de só ler o código — este repo tem histórico de bugs que só apareceram em teste real (endpoint morto da Hugging Face, tabelas inexistentes assumidas pelo carregamento de curso).
- Registre com **`node scripts/ai-sync.mjs write --agent claude --summary "..." --scope "..." [--ref ...]`**.
- Se for uma funcionalidade/correção significativa, adicione também um walkthrough em `.ai/history/` (formato: ver arquivos existentes na pasta) e atualize `.ai/history/README.md`. Toda entrada em `.ai/history/` deve ter uma linha correspondente em `.ai/sync/LOG.jsonl` com `ref` apontando para ela.

## Regras específicas deste repositório

- **Chaves de API nunca com prefixo `VITE_`**: qualquer variável lida via `import.meta.env.VITE_*` vai pro bundle JS, extraível por qualquer visitante via DevTools. Isso já foi um bug real aqui duas vezes (Gemini e Hugging Face). Toda chamada a um serviço externo que exija uma chave secreta deve passar por uma Vercel Function em `api/*.ts`, lendo a chave via `process.env` no servidor — nunca no frontend.
- **`vercel dev` para testar localmente as Vercel Functions**: `npm run dev` (Vite puro) não sobe `/api/*` — chamadas caem em fallbacks tratados no código (comportamento esperado, não é bug). Use `vercel dev` quando precisar validar `api/chat.ts`, `api/format-lesson.ts`, `api/blob-upload.ts`, `api/blob-serve.ts` de verdade.
- **`public.lessons` é gerenciada pelo `gestor-de-obras`, não por este repo**: tem um gatilho de imutabilidade (`DELETE` bloqueado). Qualquer correção de dados é via `UPDATE`. Não recriar nem alterar a estrutura da tabela sem checar `WORKS_MANAGER_HANDOFF.md` primeiro — outro repositório depende do schema atual.
- **Existe um segundo repositório no mesmo projeto Supabase**, `Sagacitas-E-Learning` (Mosaico de Conhecimento: `knowledge_units`/`learning_objects` faceteados PMEST) — é um produto diferente e futuro, sem relação com as aulas do Works Manager. Não confundir ao mexer no banco.

Detalhes do protocolo vivem em `.ai/` — não duplicar aqui.
