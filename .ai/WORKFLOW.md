# Método de trabalho entre agentes

Dois papéis, uma tarefa por arquivo, testes antes do código.

| Papel | Agente | Faz | Não faz |
|---|---|---|---|
| **Planejador e revisor** | Claude | Avalia o pedido, escreve o plano da tarefa com critérios de aceite e testes previstos, revisa a entrega e aprova ou reprova | Implementar a tarefa que ele mesmo vai revisar |
| **Executor** | Gemini | Escreve os testes (Red), implementa (Green), registra as evidências e entrega para revisão | Aprovar o próprio trabalho, mudar o plano em silêncio |

Tarefas pequenas (uma correção de texto, um ajuste de uma linha) podem ser feitas direto por qualquer agente, sem arquivo de tarefa, registradas só com `ai-sync write`. Na dúvida, abra uma tarefa.

## O ciclo de uma tarefa

```
planejada ──► em_execucao ──► aguardando_revisao ──► aprovada
 (Claude)      (Gemini)          (Gemini)              (Claude)
                   ▲                   │
                   └──── reprovada ◄───┘
                          (Claude)
```

Cada tarefa é um arquivo `.ai/tasks/<id>.md` criado a partir de `.ai/tasks/_modelo.md`. O cabeçalho do arquivo guarda o status. **Ninguém edita o status à mão**: toda mudança passa por

```bash
node scripts/ai-sync.mjs task --agent <seu-id> --id <id> --to <novo-status> [--summary "..."]
```

O comando confere se a transição é válida e se o agente tem o papel certo, registra a linha em `.ai/sync/LOG.jsonl` e, nos pontos de entrega, roda os gates automáticos.

### 1. Planejamento (Claude)

1. `node scripts/ai-sync.mjs status --agent claude` — o que mudou e o que aguarda revisão (`pending_tasks`).
2. Avaliar o pedido: ler o código afetado, o ledger (`.ai/history/`) e, se tocar `lessons`, o `WORKS_MANAGER_HANDOFF.md`.
3. Copiar `.ai/tasks/_modelo.md` para `.ai/tasks/AAAA-MM-DD_slug.md` e preencher: objetivo, premissas, fora de escopo, escopo de arquivos, critérios de aceite (`CA-n`), o teste previsto para cada critério e o passo a passo com verificação. Cada instrução diz **o quê e como**.
4. Status inicial `planejada`, `executor: gemini`, `revisor: claude`, `base` vazio.
5. `node scripts/ai-sync.mjs write --agent claude --summary "Plano: ..." --scope .ai/tasks/<id>.md --ref .ai/tasks/<id>.md`.

### 2. Execução (Gemini)

1. `node scripts/ai-sync.mjs status --agent gemini` — a tarefa aparece em `pending_tasks`.
2. `node scripts/ai-sync.mjs task --agent gemini --id <id> --to em_execucao` — grava em `base` o commit atual, que é o "antes" da prova Red→Green.
3. **Red:** escrever os testes dos critérios de aceite em `tests/` e rodar `npm test`. Eles precisam falhar. Commit `test(<escopo>): ... (red)`.
4. **Green:** implementar o mínimo para os testes passarem, só nos arquivos do escopo. Commit `feat|fix(<escopo>): ...`.
5. Preencher a seção **Execução** da tarefa: commits, arquivos alterados, saída resumida dos testes e qualquer desvio do plano com o motivo.
6. `node scripts/ai-sync.mjs task --agent gemini --id <id> --to aguardando_revisao` — só passa se `npm run lint`, `npm test` e `verify-red-green` estiverem verdes.

Se o plano estiver errado ou incompleto, o executor **não improvisa**: registra a dúvida na seção Execução, faz `ai-sync write` com o problema e para.

### 3. Revisão final (Claude)

1. A tarefa aparece em `pending_tasks` do Claude.
2. Revisar o diff contra a `base`: os testes cobrem os critérios de aceite? A mudança ficou no escopo? Há regressão, segredo em `VITE_*` ou violação das regras do `CLAUDE.md`?
3. Testar contra os serviços reais quando a tarefa tocar `api/*.ts` ou o Supabase (`vercel dev` + curl, consultas diretas).
4. Preencher a seção **Revisão** com o veredito e os achados.
5. Aprovar: `--to aprovada` (roda os gates de novo). Reprovar: `--to reprovada` com os achados na seção Revisão; a tarefa volta ao executor.
6. Tarefa significativa aprovada → walkthrough em `.ai/history/` e linha no `README.md` do ledger, com `ai-sync write --ref`.

## TDD: regras

- Nenhum código de produção sem um teste que falhou antes. Testes vivem em `tests/**/*.test.ts` e rodam com `npm test` (Vitest).
- `node scripts/verify-red-green.mjs --base <base>` prova isso: roda os testes novos contra o código da `base` (devem falhar) e contra o código atual (devem passar). Veredito esperado: `RED_GREEN_OK`.
- Refatoração (`tipo: refatoracao`) usa `--expect green`: os testes passam antes e depois, ou seja, o comportamento foi preservado.
- Teste vale pelo que verifica, não pela quantidade: cada critério de aceite tem ao menos um teste que falharia se o critério fosse violado.
- O que não dá para testar automaticamente (visual, serviço externo) fica marcado `[manual]` no critério, com o passo de verificação descrito, e é conferido pelo revisor.

## Manutenção do histórico

- `.ai/sync/LOG.jsonl` registra cada mudança de status (`task`, `kind`) e cada entrega avulsa (`write`), com o agente que fez.
- O arquivo da tarefa guarda o plano, a execução e a revisão juntos: é o registro do que cada agente fez e por quê.
- Tarefas aprovadas ficam em `.ai/tasks/` como histórico; não apagar.
