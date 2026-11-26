# 2026-11-26 — Método de trabalho entre agentes (Claude planeja e revisa, Gemini executa) com TDD

**Agente:** Claude · **Pedido do usuário:** "o Claude realiza avaliação, planejamento e revisão final, a execução pode ser repassada ao Gemini por arquivo de sincronismo entre agentes e a manutenção das alterações realizadas por cada agente, testes devem ser automatizados por TDD".

## Situação anterior

- `ai-sync` só registrava o que já tinha sido feito (`status`/`write`); não havia como um agente entregar uma tarefa a outro nem acompanhar em que pé ela estava.
- O repositório não tinha framework de testes: a única verificação era `tsc --noEmit` e `vite build`.

## O que foi feito

- **`.ai/WORKFLOW.md`** — o método: papéis, ciclo `planejada → em_execucao → aguardando_revisao → aprovada | reprovada`, regras de TDD e de histórico.
- **`.ai/tasks/_modelo.md`** — modelo de tarefa: cabeçalho com status/executor/revisor/tipo/base; plano com objetivo, premissas, fora de escopo, escopo de arquivos, critérios de aceite com teste previsto e passo a passo (o quê, como, verificação); seções de Execução e Revisão.
- **`scripts/ai-tasks.mjs`** — leitura e escrita do cabeçalho da tarefa, regras de transição por papel (`checkTransition`) e tarefas pendentes por agente (`pendingFor`). Escrito com TDD: `tests/ai-tasks.test.ts` (11 testes) falhou antes do módulo existir e passou depois.
- **`scripts/ai-sync.mjs`**:
  - `status` agora devolve `pending_tasks` do agente;
  - novo comando `task --agent --id --to` muda o status, grava `base` (commit atual) ao iniciar a execução e registra no log com os campos `task` e `kind`;
  - na entrega (`aguardando_revisao`) e na aprovação, roda `npm run lint`, `vitest run` e `verify-red-green --base <base>` e recusa a transição se algum falhar.
- **`scripts/verify-red-green.mjs`** — copiado do gestor-de-obras. Ajuste: remove o `node_modules` da cópia da `base` antes de criar o link, para não quebrar se ele vier versionado (achado no teste de ponta a ponta).
- **Vitest 3.2.4** (`npm test`, `npm run test:watch`, `vitest.config.ts`). O 4.1.10 do gestor-de-obras não instala aqui: o npm 10.8.2 quebra ao resolver as dependências peer (`Cannot read properties of null (reading 'edgesOut')`).
- **`GEMINI.md`** (novo) com as instruções do executor; **`CLAUDE.md`** com a seção "Método de trabalho"; **`.ai/sync/README.md`** com o comando `task`.

## Verificação

Ciclo completo rodado numa cópia descartável do repositório:

- Claude tentando executar e Gemini tentando aprovar: recusados.
- Entrega só com o teste (lint falha) e com implementação errada (teste falha): recusadas.
- Entrega correta: `RED_GREEN_OK`.
- Reprovação → retomada → reentrega → aprovação: `base` preservada, seis linhas no log com agente e `kind`.

No repositório real, `npm run lint`, `npm test` (11/11) e `npm run build` passam.
