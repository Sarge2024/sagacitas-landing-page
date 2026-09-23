# 2026-09-22 — Correção: Auto-Formatar (IA) destruía imagens e quebrava o layout

## Contexto

Usuário reportou: "a formatação dos slides não inseriu as imagens e nem efeito no layout ou design, não sei dizer o que o hugging face produziu". Em vez de investigar só pela leitura do código, testei o `api/format-lesson.ts` de verdade contra a API da Hugging Face (`router.huggingface.co`, modelo `Qwen/Qwen2.5-72B-Instruct`), usando uma aula real (`wm-m1-a1`, com imagens reais no formato `![[PRINT: Título]](../imagens/x.png)`), pra ver exatamente o que o modelo produzia.

## Causa raiz — 2 bugs no `SYSTEM_PROMPT`, confirmados pela resposta real da API

1. **Envolvia a resposta inteira em uma cerca de código** (` ```markdown ... ``` `), apesar de não ter sido instruído a fazer isso. Ao passar pelo `splitSlides()` (que corta em `\n---\n`), a linha `` ```markdown `` isolada virava o **primeiro slide** — uma caixa de código vazia. Era literalmente a primeira coisa que a pessoa via ao abrir a aula formatada, dando a impressão de que a formatação "não teve efeito nenhum".

2. **A Regra 4 do prompt** ("Onde for conveniente incluir um recurso visual... insira a sintaxe: `![Placeholder](Descrição detalhada...)`") era ambígua o bastante pra o modelo aplicá-la também em **imagens que já existiam** no texto original — reescrevendo `![[PRINT: Tela Custos & BDI - aba Custos Indiretos]](../imagens/m1_tela_empresa_config.png)` (título real, usado pelo `ImageImportModal.tsx` do Class Studio) para `![Placeholder](Tela Custos & BDI - aba Custos Indiretos)` (título genérico perdido, e a descrição virou a "URL"). Como essa "URL" tem espaços, nem o `marked` reconhece como sintaxe de imagem válida — renderiza como **texto cru na tela** (`![Placeholder](Tela Custos & BDI - aba Custos Indiretos)` aparecendo literalmente), exatamente o "não sei dizer o que o hugging face produziu" relatado.

## Correção (`api/format-lesson.ts`)

- Regra 4 reescrita: se já existe uma imagem no texto original (inclusive o padrão `![[PRINT: Título]](caminho)`), **copiar a linha exatamente como está**, nunca substituir por `![Placeholder](...)`.
- Regra 5 (nova): só sugerir uma imagem nova quando não existir nenhuma no trecho, usando `![<descrição curta>](pendente)` — `pendente` como url literal, sem espaços, sempre parseável como imagem válida (e já reconhecido como "pendente" pelo `isRealUrl()` do `ImageImportModal.tsx`).
- Regra 8 (nova): instrução explícita pra não envolver a resposta em bloco de código.
- Defesa adicional no handler: `stripCodeFence()` remove uma cerca ` ``` ` envolvendo a resposta mesmo que o modelo ignore a regra 8 (confirmado por teste que isso acontece com frequência suficiente pra não confiar só no prompt).

## Verificação

- Testei a chamada real à API **antes e depois** da correção, com a mesma aula (`wm-m1-a1`):
  - Antes: resposta envolta em cerca de código (2 slides quebrados: um vazio no início, um só com `` ``` `` no fim), as 2 imagens reais viraram `![Placeholder](...)` com título perdido e não renderizável.
  - Depois: sem cerca de código, 6 slides limpos, as 2 imagens preservadas **exatamente** como no original (`marked.parse()` confirmado gerando `<img>` real nos 2 slides certos).
- `tsc --noEmit` limpo.
- **Dado real corrompido e recuperado**: encontrado por busca (`markdown_content ilike '%Placeholder%'`) que a aula `wm-m1-a6` ("Ficha Completa de Funcionário", já formatada e sem imagens originalmente) tinha sido processada pelo prompt com bug antes desta correção — ganhou 6 placeholders genéricos idênticos (o texto literal da regra 4 antiga) e a cerca de código. Restaurada via `UPDATE` (tabela `lessons` bloqueia `DELETE` por design) usando o conteúdo original exato, capturado em uma consulta anterior nesta mesma sessão — conferido byte a byte igual ao original após a restauração.

## Referências

- `api/format-lesson.ts` — prompt e `stripCodeFence()`.
- `src/player/components/ImageImportModal.tsx` — depende do título original ser preservado pra funcionar (`isRealUrl`, extração de slots).
- `WORKS_MANAGER_HANDOFF.md` — lista original das 15 aulas ainda pendentes de formatação (não afetadas por este bug específico, mas vão passar por este prompt corrigido quando formatadas).
