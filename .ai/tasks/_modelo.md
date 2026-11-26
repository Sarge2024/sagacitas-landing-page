---
id: AAAA-MM-DD_slug
status: planejada
executor: gemini
revisor: claude
tipo: funcionalidade
base:
---

<!-- tipo: funcionalidade | correcao | refatoracao. `base` é preenchido pelo ai-sync ao iniciar a execução. Não edite `status` à mão. -->

# Título curto da tarefa

## Objetivo

O que precisa estar verdadeiro quando a tarefa terminar, em 2–4 frases.

## Contexto

O que o executor precisa saber e onde está: arquivos, entradas do ledger, decisões já tomadas.

## Premissas

- Premissa assumida no planejamento.

## Fora de escopo

- O que não deve ser tocado nesta tarefa.

## Escopo de arquivos

- `caminho/arquivo.ts` — o que muda nele.
- `tests/arquivo.test.ts` — testes novos.

## Critérios de aceite

| CA | Critério | Teste previsto |
|---|---|---|
| CA-1 | Comportamento verificável | `tests/x.test.ts` › "descrição do teste" |
| CA-2 | Critério sem teste automático | `[manual]` passo de verificação |

## Passo a passo

1. **O quê:** … **Como:** … **Verificação:** …
2. …

---

## Execução

<!-- Preenchido pelo executor. -->

- Commits (red / green):
- Arquivos alterados:
- Resultado dos testes / verify-red-green:
- Desvios do plano e motivo:
- Dúvidas em aberto:

## Revisão

<!-- Preenchido pelo revisor. -->

- Veredito: aprovada | reprovada
- Achados:
