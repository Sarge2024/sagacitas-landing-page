# 🤝 Handoff: Works Manager → sagacitas-landing-page (pipeline de aulas)

**Data:** 2026-09-22, atualizado 2026-09-23 (quatro vezes — ver notas abaixo)
**De:** sessão de trabalho no repositório `gestor-de-obras` (Works Manager); atualizações de 09-23 vêm dos dois lados
**Para:** quem trabalhar neste repositório (`sagacitas-landing-page`) daqui pra frente

> [!NOTE]
> **Divisão de responsabilidade (confirmada pelo usuário, 2026-09-23):** o Works Manager fornece as aulas e atualizações de conteúdo. O `sagacitas-landing-page` é responsável pela **manutenção dos treinamentos** (formatação, imagens, mantê-los atualizados) **e por comunicar de volta o status atual** — não por decidir categorização de conteúdo (ex. a qual curso uma aula pertence). Isso está refletido nas seções abaixo.

> [!IMPORTANT]
> **2026-09-23 (fim de tarde, 2ª rodada) — Novo: hierarquia CUMULATIVA entre os 4 cursos, pendente de implementação aqui.** Bug real reportado pelo usuário: o treinamento do plano Essencial estava aparecendo "dividido em dois" — causa raiz era `FRIENDLY_COURSE_NAMES['works-manager-basic']` dizendo "Treinamento Essencial" enquanto essa `gc_id` legada ainda guarda a aula órfã `wm-m5-a1` (Suprimentos, deliberadamente fora da reestruturação), criando um 2º card visualmente parecido com "Essencial" no Dashboard. **Já corrigido aqui** (renomeado pra "Conteúdo Legado (Suprimentos)", sem a palavra Essencial).
>
> **Pedido maior, pendente de implementação**: os 4 cursos não são independentes — são **cumulativos**: `Essencial ⊂ Budget Pro ⊂ Professional ⊂ Enterprise`. Quem abre o curso Budget Pro deve ver as aulas do Essencial + as próprias; quem abre Professional vê Essencial + Budget Pro + as próprias; Enterprise vê tudo. Contrato técnico completo (incluindo por que isso deve ser resolvido na montagem do `CourseManifest`, não duplicando linhas em `lessons`, e uma sugestão de implementação não-prescritiva) em `.ai/specs/hierarquia_cumulativa_cursos.md` no repo `gestor-de-obras`. Resumo do que muda aqui quando for implementado: `CourseManifestService.buildManifestFromLessons(gcId, ...)` passaria a consultar `lessons.gc_id IN (...)` (o curso pedido + todos os cursos "abaixo" dele na hierarquia) em vez de `gc_id = gcId`; `fetchAvailableCourseSummaries()` (contagem nos cards) provavelmente deve continuar não-cumulativa (decisão de UX de vocês). **O usuário vai solicitar essa implementação separadamente** — mesmo padrão do `slide-id` (documentamos o contrato, vocês decidem a abordagem e o timing).

> [!IMPORTANT]
> **2026-09-23 (madrugada) — Consumo do `slide-id` IMPLEMENTADO aqui.** `src/lib/slideId.ts` (módulo puro, parsing + `ensureSlideIds()` determinístico), tabela `public.lessons_slide_sync_state`, `SlideSyncService.ts` (classifica cada slide como Novo/Movido/Alterado/Inalterado), `api/format-lesson.ts` atualizado (preserva `slide-id` existente e atribui automaticamente o que falta, sem depender só do modelo seguir instrução), e UI em `AdminSlideEditor.tsx`/`ClassStudioIndex.tsx` mostrando isso por slide.
>
> **Achado durante o backfill, sinalizando pra vocês verificarem a rotina de retrofit**: as 18 aulas que vocês retrofitaram tinham **todas** a mesma lacuna sistemática — o "slide 0" (o trecho antes do primeiro `---`, que no formato de vocês normalmente é o comentário `(resumo para apresentação)` / `<!-- Formato compatível com Marp... -->`) nunca ganhou `slide-id`, porque a rotina de vocês ancora a inserção em cada `---`, e esse trecho não tem um `---` antes dele. Como esse trecho é tecnicamente renderizado como o primeiro "slide" pelo player hoje (é conteúdo válido antes do primeiro separador), corrigimos aqui com o mesmo `ensureSlideIds()` — sem mudar nada de conteúdo, só adicionando o comentário de ID faltante. Vale considerar corrigir a rotina de retrofit de vocês pra cobrir esse caso nas próximas aulas, ou tudo bem deixar como está e continuarmos cobrindo aqui — funciona dos dois jeitos.
>
> **Verificação real feita**: 224 slides em todas as 33 aulas, 0 sem identificação, todos com snapshot de linha de base. Simulei o cenário exato que motivou o pedido (inserir um slide no meio de uma aula real, deslocando os seguintes) — resultado correto: slide novo → "Novo", os deslocados → "Movido", nenhum interpretado como "Alterado" ou perdido. Detalhe completo: `.ai/history/2026-09-23c_protocolo_slide_id_implementado.md`.
>
> **Sobre a `wm-m5-a1` (nota da seção "noite" abaixo)**: não é uma aula esquecida — é uma decisão deliberada do usuário (Suprimentos ficou de fora da reestruturação de propósito, aguardando a integração da gestão de materiais ao Enterprise). Não é necessário decidir o `gc_id`/`module_id` dela agora.

> [!IMPORTANT]
> **2026-09-23 (noite) — Status pós-manutenção + 1 decisão pendente do lado Works Manager.** Reprocessamos tudo daqui: as 15 aulas revertidas foram reformatadas de novo, e **6 aulas tinham placeholders de imagem com sintaxe inválida** (`![[PRINT: Título]]` **sem** o `(caminho)` — Markdown de imagem exige a URL; sem ela, renderiza como texto cru na tela do aluno e o Class Studio não reconhece como slot de imagem). Corrigido nas 6 (`wm-m1-a4`, `wm-m1-a5`, `wm-m1-a6`, `wm-m1-a9`, `wm-m1-a10`, `wm-m8-a2`) adicionando `(pendente)` como placeholder de URL — preserva o título, sem inventar conteúdo. **As 33 aulas estão hoje 100% sincronizadas** (`lessons_sync_state`), sem pendência de formatação.
>
> **Pedido pro lado Works Manager**: ao gerar `![[PRINT: Título]](caminho)`, garantir que o `(caminho)` sempre esteja presente, mesmo que seja um valor fictício — evita esse tipo de sintaxe quebrada chegando aqui.
>
> **Decisão pendente, é de vocês, não nossa**: a aula `wm-m5-a1` ("Suprimentos e Compras") continua com `gc_id: works-manager-basic` (curso antigo) e `module_id: modulo-5` (formato antigo) — não foi migrada pra nenhum dos 4 cursos novos. O título sugere Professional ou Enterprise, mas isso é uma decisão de categorização de conteúdo — não vamos adivinhar aqui. Ela continua invisível pros 4 cursos reais até vocês decidirem o `gc_id`/`module_id` corretos (uma linha de `UPDATE` do lado de vocês resolve).

> [!IMPORTANT]
> **2026-09-23 (tarde) — 15 aulas precisaram de Auto-Formatar de novo, ação do instrutor**: o Works Manager reestruturou o treinamento em 4 cursos por plano comercial (ver seção nova "Reestruturação em cursos por plano" abaixo) e, ao republicar, reverteu — sem querer evitar, é esperado dado que o Works Manager só controla o conteúdo base — a formatação em slides que tinha acabado de ser feita aqui nesta mesma tarde em 15 aulas. **Já resolvido** (ver nota "noite" acima).

> [!IMPORTANT]
> **2026-09-23 (manhã) — leia antes de reprocessar qualquer aula**: este repo agora tem um sistema próprio de detecção de mudanças (`public.lessons_sync_state` + `LessonSyncService.ts`, ver seção nova abaixo). O Works Manager não precisa mudar nada no `syncLessons.ts` por causa disso — é só saber que existe, e que o Class Studio agora sinaliza corretamente quais aulas o Works Manager alterou desde a última revisão de um instrutor, sem precisar reprocessar as que não mudaram.

---

## 🆕 Reestruturação em cursos por plano comercial (2026-09-23, tarde)

O curso único `works-manager-basic` deixou de existir. O Works Manager agora publica em **4 cursos** (`gc_id`): `works-manager-essencial`, `works-manager-professional`, `works-manager-enterprise`, `works-manager-budgetpro` — mais 5 aulas novas (4 de boas-vindas/acesso, `order: 0` em cada curso, + 1 aula estrutural do Enterprise, `wm-ent-a1`). `module_id` também mudou de `modulo-{N}` pra tópicos (`cadastro`, `orcamento`, `planejamento`, `controle-medicao`, `gestao-execucao`, `adm-financeiro`).

**Ação necessária aqui**: rodar "Auto-Formatar (IA)" de novo nestas 15 aulas (`lessons_sync_state` vai mostrar "Alterada" pra todas elas):

```
wm-m1-a1, wm-m1-a2, wm-m1-a3,
wm-m2-a1, wm-m2-a2, wm-m2-a3,
wm-m3-a1, wm-m3-a2, wm-m3-a3,
wm-m4-a1, wm-m4-a2, wm-m4-a3,
wm-m5-a1, wm-m6-a1, wm-m7-a1
```

As outras 18 (13 já formatadas antes + as 5 aulas novas, que já chegam com bloco de Slides pronto ou são curtas o bastante pra não precisar) não foram tocadas no corpo — `markdown_content` idêntico, sem selo de "Alterada".

`FRIENDLY_COURSE_NAMES` em `CourseManifestService.ts` já foi atualizado com os 4 cursos novos. Detalhe completo: `.ai/history/2026-09-23_reestruturacao_cursos_por_plano_comercial.md` no repo `gestor-de-obras`.

---

## O que o Works Manager entrega

O repositório `gestor-de-obras` roda `scripts/syncLessons.ts` e publica aulas de treinamento direto em `public.lessons` (mesmo projeto Supabase deste repo, `pnbxnuhzzwbciohjvhab`), preenchendo `id, tenant_id (NULL), gc_id, module_id, uc_id, title, type='slide', "order", markdown_content, updated_at`.

Todas as **33 aulas do Works Manager já estão publicadas** (28 originais + 5 novas desta tarde), distribuídas nos 4 cursos por plano comercial (ver seção acima) — não existe mais um `gc_id` único.

## ✅ GAP CRÍTICO — RESOLVIDO (2026-09-22): compilador de manifesto construído

`CourseManifestService.fetchManifest(gcId)` ganhou um novo método `buildManifestFromLessons(gcId, tenantId)`, chamado como fallback entre a tentativa de `course_manifests` (que não existe) e o `getMockManifest()`. Ele consulta `lessons` direto (`gc_id`, `uc_id IS NOT NULL`, ordenado por `module_id`/`order`) e monta um `CourseManifest` real (`execution_graph.nodes` com `markdownContent` populado, `prerequisites: []` para todos — acervo tipo biblioteca, sem trava sequencial). `CourseEngineService.fetchManifest()` já delegava corretamente pra cá (linha 56), então nenhuma mudança foi necessária lá.

**Verificado com dados reais**: `npm run lint` e `npm run build` limpos; e a query exata do novo método rodada com a mesma anon key do browser (`VITE_SUPABASE_ANON_KEY`) contra o Supabase real retornou as **28 aulas** de `gc_id='works-manager-basic'` com `markdown_content` presente em todas. `fetchAvailableCourseSummaries()` (usado no dashboard) já lia `lessons` corretamente antes disso — só o carregamento do conteúdo de um curso individual estava quebrado.

## ✅ Hugging Face — RESOLVIDO (2026-09-22)

`api/format-lesson.ts` usava `https://api-inference.huggingface.co/...` — esse domínio não resolve DNS em lugar nenhum (endpoint legado descontinuado pela HF). Corrigido pro router atual: `https://router.huggingface.co/v1/chat/completions` (modelo no corpo, não na URL). O token também não tinha a permissão "Inference Providers" — usuário habilitou em huggingface.co/settings/tokens. **Testado via HTTP real contra a API de produção depois da correção: `200 OK`, resposta real do modelo `Qwen/Qwen2.5-72B-Instruct`.** Auto-Formatar (IA) no `AdminSlideEditor.tsx` está funcional ponta a ponta.

## ✅ Gemini — RESOLVIDO por substituição (2026-09-22/23)

A chave ficou presa em `400 "API key not valid"` (restrição de referrer HTTP) e não foi corrigida — em vez disso, o usuário pediu um provedor de LLM gratuito no lugar. `api/chat.ts` foi **reescrito para usar a Hugging Face** (mesmo endpoint/token já validado em `api/format-lesson.ts`), removendo `@google/genai` do `package.json` e `GEMINI_API_KEY` do `.env`/`.env.example`. `src/services/geminiService.ts` foi renomeado para `src/services/chatService.ts` (assinatura de `getChatResponse()` inalterada — `Chatbot.tsx` não precisou mudar). **Gemini não é mais usado neste repositório, em nenhuma função.**

## ✅ Projeto Vercel relinkado / ⚠️ ainda sem variáveis de ambiente (verificado de novo em 2026-09-23)

`.vercel/project.json` apontava pro projeto errado (`rdo-wm`). Corrigido: `vercel link --scope sagacitas --project sagacitas-landing-page` → agora aponta pro projeto real (`prj_hOyEi7TYI3C3hwtHSUHrcoAZaFgA`, time `sagacitas`). **Ainda pendente** (reconferido com `vercel env ls` em 2026-09-23, continua vazio): nenhuma variável de ambiente configurada em produção. Um `vercel deploy` a partir daqui funcionaria localmente mas falharia em produção até `SAGACITAS_SUPABASE_URL`, `SAGACITAS_SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `HUGGINGFACE_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID` serem enviadas (`vercel env add` ou pelo dashboard) — `GEMINI_API_KEY` não é mais necessária (ver seção Gemini acima). Uma tentativa de enviar essas variáveis via CLI foi bloqueada pelo classificador de permissões do Claude Code (categoria "Secret-Store Writes") — precisa ser feito manualmente pelo usuário ou com uma regra de permissão explícita liberada.

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

### ✅ Formatação das 28 aulas — CONCLUÍDA (2026-09-22)

As 15 aulas que chegaram como corpo bruto (`wm-m1-a1/a2/a3`, `wm-m2-a1/a2/a3`, `wm-m3-a1/a2/a3`, `wm-m4-a1/a2/a3`, `wm-m5-a1`, `wm-m6-a1`, `wm-m7-a1`) foram formatadas via `/api/format-lesson` (rodando o endpoint real, não uma cópia da lógica) e salvas de volta em `lessons.markdown_content`. **As 28 aulas de `works-manager-basic` estão hoje com formatação real de slides** — nenhuma pendente. Duas precisaram de retry por timeout da Hugging Face (>60s), sem problema na segunda tentativa.

Durante esse processo, o prompt de formatação (`SYSTEM_PROMPT` em `api/format-lesson.ts`) foi corrigido por dois bugs reais encontrados testando contra a API de produção: (1) o modelo envolvia a resposta numa cerca de código, virando um slide vazio quebrado; (2) imagens já existentes no texto original (`![[PRINT: Título]](caminho)`) eram reescritas como `![Placeholder](descrição com espaço)`, perdendo o título e virando sintaxe de imagem inválida. Ambos corrigidos — o prompt agora preserva imagens existentes verbatim. Detalhe completo: `.ai/history/2026-09-22_fix_auto_formatar_ia_imagens.md` (neste repo). Uma aula real (`wm-m1-a6`) que já tinha sido corrompida pelo bug antigo foi restaurada ao conteúdo original.

### Como salvar de volta

`LessonEditorService.saveLessonMarkdown(lessonId, markdownContent)` já grava em `lessons.markdown_content` — é só usar o `id` (uuid) da linha, buscável por `uc_id` se precisar (`SELECT id FROM lessons WHERE uc_id = 'wm-m1-a1'`).

## Por que essa divisão

O usuário decidiu que este repositório (`sagacitas-landing-page`) terá ferramentas de edição avançada de aulas — o que pode tornar a formatação automática via Hugging Face desnecessária em alguns casos (edição manual resolve), ou continuar sendo útil como um primeiro rascunho automático antes da revisão humana. Essa decisão de **como** formatar (HF, manual, ou os dois) fica a critério de quem trabalhar aqui — o Works Manager só garante que o conteúdo bruto e correto chega até `lessons.markdown_content`.

## 🆕 Detecção de mudanças (2026-09-23) — importante para futuras publicações do Works Manager

Sempre que `syncLessons.ts` roda de novo e atualiza `lessons.markdown_content` de uma aula que já estava pronta, existia o risco de alguém do lado `sagacitas-landing-page` reprocessar/reformatar por engano uma aula que não precisava — foi exatamente o que corrompeu a `wm-m1-a6` (ver seção acima). Resolvido com um sistema próprio, deste lado:

- Nova tabela `public.lessons_sync_state` (`src/player/db/lessons_sync_state.sql`) — **não faz parte do schema do Works Manager, não precisa de nenhuma mudança em `syncLessons.ts`**. Guarda `lesson_id`, um hash SHA-256 do `markdown_content`, e quando foi revisado por um instrutor.
- Toda vez que o Works Manager atualizar `markdown_content` de uma aula (nova ou existente), o Class Studio (`/class-studio`) vai automaticamente sinalizar essa aula como **"Nova"** ou **"Alterada"** (comparando o hash atual com o último revisado) — nenhuma ação necessária do lado do Works Manager, é só uma consequência natural de escrever em `markdown_content` como já é feito.
- As 28 aulas atuais foram marcadas como linha de base ("Sincronizada") em 2026-09-23, com o conteúdo já formatado. Qualquer `UPDATE` futuro do `syncLessons.ts` em qualquer uma delas vai automaticamente aparecer como "Alterada" para quem estiver no Class Studio.
- Isso também vale para conteúdo **totalmente novo** (ex. quando o módulo Enterprise, hoje incompleto, ganhar aulas novas) — qualquer `uc_id` que apareça pela primeira vez em `lessons` aparece como "Nova" automaticamente, sem precisar de nenhuma configuração adicional.

Detalhe completo: `.ai/history/2026-09-23_anotacao_imagem_e_deteccao_de_mudancas.md` e `AULAS_E_SLIDES.md` (seção 7.5), ambos neste repo.

## Outras notas importantes herdadas desta sessão

- `public.lessons` tem um **gatilho de imutabilidade** — `DELETE` é bloqueado por design ("aulas são conhecimento universal e não podem ser apagadas"). Qualquer correção é via `UPDATE`.
- Existe **1 linha duplicada inofensiva** pra "Matriz de Acessos" (sem `uc_id`, órfã de um bug já corrigido do lado do Works Manager) — pode ser ignorada, nenhuma busca por `uc_id` a encontra.
- Existe outro repositório no mesmo projeto Supabase, `Sagacitas-E-Learning` (Mosaico de Conhecimento: `knowledge_units`/`learning_objects` faceteados PMEST) — é um produto **diferente e futuro**, sem relação com as aulas do Works Manager. Não confundir os dois ao mexer no banco.
- Verificado (2026-09-22): a tela do aluno é `OAPlayerView.tsx` (substituiu o antigo `LessonPlayerView.tsx`, já removido) e já roteia nós `type === 'slide'` pro `SlideRenderer.tsx`, que lê `markdownContent` direto — a ponte estava correta, só faltava o `CourseManifest` chegar populado até ela (ver seção "GAP CRÍTICO" acima, agora resolvido).
- (2026-09-23) Corrigido bug real de estilo: `@tailwindcss/typography` nunca tinha sido instalado, então a classe `prose` que `SlideRenderer.tsx` já usava não tinha nenhum efeito visual — instalado e ligado, sem impacto pro Works Manager.
- (2026-09-23) Nova ferramenta manual de anotação de imagem (`ImageAnnotatorModal.tsx`: grifo, retângulo, seta, texto) para instrutores evidenciarem pontos em capturas de tela — não gerada/sugerida pela IA, sem relação com o pipeline de dados do Works Manager.

## Referências no repo `gestor-de-obras`

- `.ai/history/2026-09-22_pivo_schema_mosaico_conhecimento_sagacitas.md`, `2026-09-22b_*.md`, `2026-09-22c_*.md` — histórico completo da investigação
- `INSTRUCOES_AGENTE_WORKS_MANAGER.md` — guia de referência do lado Works Manager
- `scripts/syncLessons.ts` — o script que publica aqui
