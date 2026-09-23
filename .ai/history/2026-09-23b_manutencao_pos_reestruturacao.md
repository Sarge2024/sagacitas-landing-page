# 2026-09-23 (noite) — Manutenção pós-reestruturação de cursos + divisão de responsabilidade formalizada

## Contexto

Usuário definiu explicitamente a divisão de responsabilidade: "Works Manager fornece as aulas e atualizações; o Landing Page mantém os treinamentos atualizados e comunica o status de volta pra aplicação de origem." Isso significa: manutenção (formatação, imagens, correção de sintaxe) é nossa; decisões de categorização de conteúdo (qual curso uma aula pertence) são do Works Manager — nós comunicamos, não decidimos.

## Verificação (antes de agir)

Reconferido tudo contra o banco real (não confiei no handoff sem checar):
- 34 linhas em `lessons` (33 reais + 1 órfã "Matriz de Acessos").
- 5 gc_id: `works-manager-essencial` (20), `works-manager-professional` (8), `works-manager-enterprise` (2), `works-manager-budgetpro` (2), e **`works-manager-basic` ainda com 1 linha** (`wm-m5-a1`) — o handoff dizia que esse gc_id "deixou de existir", não é verdade.
- Sistema de detecção de mudanças (`LessonSyncService`) encontrou **17 aulas alteradas**, não as 15 que o handoff listava — 2 a mais (`wm-m1-a6`, `wm-m1-a10`) que não voltaram a texto cru, mas ganharam imagens novas inseridas pelo Works Manager.
- `tsc`/`build` limpos antes de começar.

## Manutenção executada

1. **15 aulas reformatadas** via `/api/format-lesson` real (rodando `vercel dev`, não uma cópia da lógica): `wm-m1-a1/a2/a3`, `wm-m2-a1/a2/a3`, `wm-m3-a1/a2/a3`, `wm-m4-a1/a2/a3`, `wm-m5-a1`, `wm-m6-a1`, `wm-m7-a1`. Todas verificadas (imagens preservadas, sem cerca de código, `--- ` >= 2) antes de salvar, e marcadas como revisadas em `lessons_sync_state`.
2. **Achado durante a revisão de `wm-m1-a6`/`wm-m1-a10`**: o Works Manager inseriu imagens novas em quase todo slide dessas duas aulas — mas **2 delas vieram com sintaxe inválida**, `![[PRINT: Título]]` **sem** o `(caminho)` (Markdown de imagem exige a URL). Isso não renderiza como imagem (vira texto cru na tela) e não é reconhecido pelo `extractImageSlots()` do `ImageImportModal.tsx` como um slot preenchível.
3. **Busca sistemática pelo mesmo defeito em todas as 33 aulas** (regex `/!\[\[[^\]]*\]\](?!\()/`, cuidado extra pra não confundir com o padrão válido `![[PRINT: Título]](url)` — minha primeira tentativa de checagem tinha esse bug e deu falso positivo em massa; corrigida antes de agir) — encontradas **mais 4 aulas antigas** com o mesmo problema, nunca detectadas antes porque o conteúdo delas não tinha mudado desde o bootstrap de ontem (então nunca apareceram como "Alterada"): `wm-m1-a4`, `wm-m1-a5`, `wm-m1-a9`, `wm-m8-a2`.
4. **Total: 6 aulas corrigidas** (10 ocorrências), adicionando `(pendente)` como placeholder de URL — preserva o título original, torna a sintaxe válida, e faz `extractImageSlots()` reconhecer como slot pendente de importação.
5. **5 aulas novas revisadas** (`wm-acesso-essencial/professional/enterprise/budgetpro`, `wm-ent-a1`) — sem defeito, marcadas como sincronizadas.

## Resultado final (verificado)

- **33/33 aulas sincronizadas** (`lessons_sync_state`), zero pendentes, zero alteradas não revisadas.
- **Zero placeholders de imagem malformados** restantes (reconferido com a regex corrigida).
- `tsc`/`build` limpos.

## Comunicado de volta pro Works Manager (`WORKS_MANAGER_HANDOFF.md`)

- Pedido: sempre incluir `(caminho)` ao gerar `![[PRINT: Título]](caminho)`, mesmo que fictício, pra evitar essa classe de erro de sintaxe.
- **Decisão pendente que é deles, não nossa**: `wm-m5-a1` precisa de um `gc_id`/`module_id` correto (um dos 4 cursos novos) — não adivinhamos, só sinalizamos.

## Referências

- `WORKS_MANAGER_HANDOFF.md` — comunicação formal de status de volta.
- `.ai/history/2026-09-23_anotacao_imagem_e_deteccao_de_mudancas.md` — o sistema de detecção usado aqui.
