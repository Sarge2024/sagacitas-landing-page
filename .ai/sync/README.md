# Sync Log — Protocolo de Handoff entre Agentes de IA

> Formato denso, para consumo de LLM/agente. Isto **não é** o ledger humano — isso é `.ai/history/`. Este diretório é só o ponteiro de menor custo para uma sessão nova saber SE precisa ler algo novo, e o quê.

## Por que existe

Este repositório (`sagacitas-landing-page`) é trabalhado por mais de um agente de IA — pelo menos Claude Code e uma sessão de Gemini já editaram arquivos aqui em paralelo no mesmo dia, sem coordenação, causando um path de import duplicado real (`hfService.ts` criado em dois lugares por sessões diferentes, ver `.ai/history/`). Este diretório é o canal de handoff: cada sessão registra aqui, em 1 linha JSON, o que mudou — e toda sessão nova lê só as linhas que ainda não leu. Protocolo idêntico ao usado no repo irmão `gestor-de-obras` (Works Manager), que publica aulas de treinamento direto na tabela `lessons` deste projeto Supabase — ver `WORKS_MANAGER_HANDOFF.md`.

## Arquivos

- `STATE.json` — ponteiro global: `{ "last_seq": N, "last_ts": "...", "last_agent": "..." }`. O primeiro arquivo a checar (leitura O(1)).
- `LOG.jsonl` — log **append-only**, 1 objeto JSON por linha. `seq` == número da linha. Nunca editar linhas existentes, só apensar.
- `cursors/<agent>.json` — `{ "last_seq_read": N }` por agente. Cada agente mantém o seu próprio.

## Uso (via `scripts/ai-sync.mjs` — não escreva os JSONs à mão)

### Ao iniciar uma sessão, ANTES de implementar qualquer coisa
```bash
node scripts/ai-sync.mjs status --agent claude   # ou --agent gemini
```
- Se `upToDate: true`: nada novo desde a última vez que este agente leu. Siga direto para a tarefa.
- Se `upToDate: false`: o comando já imprime só as linhas novas (`entries`) e já avança o cursor do agente. Cada entrada tem `summary` (1 frase) e, se houver, `ref` (path para o detalhe completo em `.ai/history/` — só leia o `ref` se precisar do detalhe; a linha já é o resumo).

### Ao concluir uma implementação não-trivial
```bash
node scripts/ai-sync.mjs write --agent claude \
  --summary "1 frase estilo subject de commit, em pt-br" \
  --scope "path/a.ts,path/b.ts" \
  --ref ".ai/history/2026-09-22_algo.md"   # opcional
```
Isso apensa a linha, atualiza `STATE.json` e já avança o cursor de quem escreveu (quem escreve já está "em dia"). Antes de registrar, rodar `npm run lint` (`tsc --noEmit`) e `npm run build` — devem estar limpos.

## Regra de integração com o resto do `.ai/`

- Toda entrada nova em `.ai/history/` DEVE gerar uma linha aqui (com `ref` preenchido apontando para ela).
- Nem toda linha aqui precisa de uma entrada em `.ai/history/` — mudanças pequenas geram só a linha, sem `ref`.
- `.ai/history/README.md` continua sendo a fonte de verdade legível por humanos. Este log nunca substitui o walkthrough completo — só evita que uma sessão nova tenha que reler tudo para descobrir se há algo novo.
- Mudanças que se originam do lado do Works Manager (`gestor-de-obras`) e afetam este repo (ex.: novo schema em `lessons`) têm o detalhe completo no ledger de lá (`.ai/history/` do `gestor-de-obras`) — `WORKS_MANAGER_HANDOFF.md` é o ponto de entrada pra esse contexto cross-repo.
