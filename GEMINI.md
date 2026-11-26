# sagacitas-landing-page — Instruções para o Gemini

Neste repositório o Gemini é o **executor**: implementa as tarefas planejadas pelo Claude, com TDD, e as entrega para revisão. O método completo está em `.ai/WORKFLOW.md`; leia-o na primeira sessão.

## Ao iniciar

1. `node scripts/ai-sync.mjs status --agent gemini` — mostra o que mudou desde a sua última sessão e, em `pending_tasks`, as tarefas que esperam por você.
2. Leia o arquivo da tarefa (`.ai/tasks/<id>.md`) inteiro antes de tocar em código.
3. As regras do repositório estão no `CLAUDE.md` (seção "Regras específicas deste repositório") e valem para você também — em especial: **nenhuma chave de API com prefixo `VITE_`**, e a tabela `public.lessons` pertence ao `gestor-de-obras`.

## Executando uma tarefa

1. `node scripts/ai-sync.mjs task --agent gemini --id <id> --to em_execucao`
2. **Red:** escreva os testes dos critérios de aceite em `tests/`, rode `npm test` e confirme que falham. Commit `test(<escopo>): ... (red)`.
3. **Green:** implemente o mínimo para passar, só nos arquivos listados em "Escopo de arquivos". Commit `feat|fix(<escopo>): ...`.
4. Preencha a seção **Execução** do arquivo da tarefa.
5. `node scripts/ai-sync.mjs task --agent gemini --id <id> --to aguardando_revisao` — roda lint, testes e a prova Red→Green; se algum falhar, corrija e repita.

## Limites

- Não aprove, não reprove e não replaneje tarefas: isso é do revisor.
- Não altere arquivos fora do escopo da tarefa. Se precisar, registre o motivo em "Desvios do plano" e pare para o revisor decidir.
- Se o plano estiver errado, ambíguo ou incompleto, **pare**: escreva a dúvida em "Dúvidas em aberto", registre com `node scripts/ai-sync.mjs write --agent gemini --summary "Dúvida na tarefa <id>: ..." --scope .ai/tasks/<id>.md` e aguarde.
- Trabalho fora de uma tarefa (correção trivial) é registrado com `ai-sync write --agent gemini`.
