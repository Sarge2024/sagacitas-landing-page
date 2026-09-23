# Como funciona a construção das aulas e slides

Este documento explica, em detalhe, o caminho completo de uma aula de treinamento: de onde ela vem, como vira slides, como as imagens entram, onde ela é editada, e como o aluno finalmente a vê no Player. É a referência de arquitetura desta parte do sistema — para o histórico de decisões e correções, ver `.ai/history/` e `WORKS_MANAGER_HANDOFF.md`.

---

## 1. Visão geral do pipeline

```
┌──────────────────┐      escreve       ┌─────────────────────┐
│   Works Manager    │ ─────────────────▶ │  public.lessons      │  (Supabase, projeto
│  (repo irmão,       │  scripts/          │  (markdown_content   │   sagacitas-training)
│  gestor-de-obras)   │  syncLessons.ts    │   ainda em texto     │
└──────────────────┘                     │   corrido, sem       │
                                          │   separadores)       │
                                          └─────────┬────────────┘
                                                     │
                              ┌──────────────────────┼───────────────────────┐
                              │                       │                       │
                              ▼                       ▼                       ▼
                     ┌─────────────────┐   ┌───────────────────┐   ┌─────────────────────┐
                     │  Class Studio     │   │ CourseManifest-     │   │  (edição manual)     │
                     │  /class-studio     │   │ Service.build-      │   │  AdminSlideEditor    │
                     │  (lista + editor)  │   │ ManifestFromLessons │   │  (Markdown puro)     │
                     └────────┬──────────┘   └──────────┬─────────┘   └─────────┬───────────┘
                              │                          │                       │
                    "Auto-Formatar (IA)"                 │                       │
                     api/format-lesson.ts                │                       │
                     (Hugging Face)                      │                       │
                              │                          │                       │
                              ▼                          ▼                       ▼
                     lessons.markdown_content   CourseManifest (nodes)   lessons.markdown_content
                     agora com slides "---"     entregue a usePlayerStore     atualizado direto
                              │                          │
                              └──────────────┬───────────┘
                                             ▼
                                  ┌────────────────────┐
                                  │  OAPlayerView.tsx    │
                                  │  → SlideRenderer.tsx │  (o aluno vê os slides)
                                  └────────────────────┘
```

Duas coisas acontecem em paralelo, a partir da mesma tabela `lessons`:

1. **Conteúdo → formato de slide**: o texto corrido vira Markdown separado em slides (`---`), com ou sem ajuda de IA. Isso é sobre a *coluna* `markdown_content` de uma linha.
2. **Aulas → trilha do curso**: um conjunto de linhas de `lessons` (todas com o mesmo `gc_id`) vira um `CourseManifest` — a estrutura que o Player usa para desenhar a trilha do aluno. Isso é sobre *quais linhas existem* e como elas se agrupam.

As seções abaixo detalham cada parte.

---

## 2. A tabela `lessons` — a fonte de tudo

`lessons` vive no projeto Supabase `sagacitas-training` (`pnbxnuhzzwbciohjvhab`) e é compartilhada com o repo irmão `gestor-de-obras` (Works Manager), que é quem escreve nela. Colunas relevantes:

| Coluna | Uso |
|---|---|
| `id` (uuid, PK) | Identificador único da linha — é o que aparece na URL do editor (`/class-studio/<id>`). |
| `tenant_id` (uuid, nullable) | `NULL` = acervo global (aulas do Works Manager, sem tenant específico). |
| `gc_id` (varchar) | Identifica o **curso** (Grupo Curricular). Desde 2026-09-23, 4 cursos por plano comercial: `works-manager-essencial`, `works-manager-professional`, `works-manager-enterprise`, `works-manager-budgetpro` (o antigo `works-manager-basic` não recebe mais linhas novas). |
| `module_id` (varchar) | **Tópico** dentro do curso — desde 2026-09-23, um de `cadastro`, `orcamento`, `planejamento`, `controle-medicao`, `gestao-execucao`, `adm-financeiro` (não mais `modulo-{N}`). |
| `uc_id` (varchar) | Identifica a **aula** dentro do curso, formato `wm-m{módulo}-a{ordem}` (ex. `wm-m1-a4`). Corresponde ao conceito de "Unidade Curricular / Objeto de Aprendizagem" (OA) do resto do sistema. |
| `title` | Título da aula, exibido no Class Studio e na trilha. |
| `type` | Sempre `'slide'` hoje — é um dos valores de `OAType` (`src/player/types.ts`), que também inclui `video`, `quiz`, `lab`, `simulator`, `project`. |
| `order` | Ordem da aula dentro do módulo. |
| `markdown_content` | **O conteúdo em si** — Markdown puro, com slides separados por uma linha contendo só `---`. |
| `updated_at` | Atualizado a cada `UPDATE`. |

**Regra importante**: `lessons` tem um **gatilho de imutabilidade** — `DELETE` é bloqueado por design ("aulas são conhecimento universal, não podem ser apagadas"). Qualquer correção de conteúdo é feita via `UPDATE` em `markdown_content` (nunca recriando a linha).

Hoje existem **33 aulas reais** publicadas pelo Works Manager, distribuídas nos 4 cursos acima (Essencial: 20, Professional: 8, Enterprise: 2, Budget Pro: 2 — mais 1 linha legada em `works-manager-basic`, o curso Suprimentos, fora da reorganização por enquanto), cobrindo o produto "Gestor de Obras". Ver `WORKS_MANAGER_HANDOFF.md` pra detalhe completo da reestruturação.

---

## 3. O formato de um slide em Markdown

Uma aula formatada é um único bloco de Markdown onde cada slide é separado por uma linha que contém **estritamente três hífens**:

```markdown
## Título do primeiro slide
Conteúdo em bullet points, no máximo 4-5 por slide.

---

## Título do segundo slide
Mais conteúdo...

![[PRINT: Tela de Cadastro de Fornecedores]](../imagens/tela_fornecedores.png)

---

## Terceiro slide
> [!NOTE] Uma observação importante fica destacada assim.
```

Regras de formatação (aplicadas tanto na formatação manual quanto pela IA — ver seção 5):

- Cada slide começa com um título de nível 2 (`##`).
- Texto longo vira bullet points curtos.
- Citações importantes usam a sintaxe de callout `> [!NOTE]` ou `> [!TIP]`.
- Frontmatter YAML (se houver) não é alterado.

A quebra em slides é feita no lado do Player por `splitSlides()`, dentro de `src/player/components/renderers/SlideRenderer.tsx`:

```ts
function splitSlides(markdown: string): string[] {
  return markdown
    .split(/\r?\n[ \t]*---[ \t]*\r?\n/)
    .map(slide => slide.trim())
    .filter(Boolean);
}
```

Cada pedaço resultante é convertido de Markdown para HTML com a biblioteca `marked`, e sanitizado com `DOMPurify` antes de ir para a tela (proteção contra conteúdo malicioso, já que o texto pode vir de fontes externas/IA).

**Como saber se uma aula já foi formatada ou ainda está "crua"?** Não existe uma coluna dedicada para isso (decisão deliberada, para não mexer mais no schema compartilhado). O sinal é a **contagem** de separadores `---` isolados: uma aula crua tipicamente tem no máximo 1 (um `---` decorativo antes de "Fim da Aula", por exemplo) — uma aula de verdade formatada em slides tem vários. O Class Studio (seção 6) usa essa heurística para mostrar o selo "Formatado"/"Pendente".

---

## 4. De onde vem o conteúdo bruto (Works Manager)

O repositório irmão `gestor-de-obras` roda `scripts/syncLessons.ts`, que escreve direto em `public.lessons` deste mesmo projeto Supabase. Cada aula chega com `id, tenant_id (NULL), gc_id, module_id, uc_id, title, type='slide', order, markdown_content`.

O Works Manager **não faz mais** nenhum pré-processamento de formatação — essa responsabilidade passou inteiramente para este repositório (`sagacitas-landing-page`). Ele só garante que o conteúdo bruto e correto chega até `lessons.markdown_content` (às vezes já formatado, às vezes como texto corrido).

---

## 5. Formatação automática via IA (Hugging Face)

### 5.1 Por quê

Transformar texto corrido em slides bem cortados manualmente é trabalhoso. O botão **"✨ Auto-Formatar (IA)"** (no editor do Class Studio, e também linha a linha na lista `/class-studio`) delega essa tarefa a um modelo de linguagem.

### 5.2 Como funciona, ponta a ponta

```
Botão "Auto-Formatar (IA)"
        │
        ▼
src/services/hfService.ts → formatLessonWithHF(markdown)
        │  fetch('/api/format-lesson', { markdown })
        ▼
api/format-lesson.ts  (Vercel Function — roda só no servidor)
        │  lê HUGGINGFACE_API_KEY do process.env (nunca no navegador)
        │  POST https://router.huggingface.co/v1/chat/completions
        │  modelo: Qwen/Qwen2.5-72B-Instruct
        ▼
Hugging Face Inference Providers → devolve o Markdown reformatado
        │
        ▼
api/format-lesson.ts remove qualquer cerca de código residual (stripCodeFence)
        │
        ▼
draft do editor é atualizado → usuário revisa → clica "Salvar"
        │
        ▼
LessonEditorService.saveLessonMarkdown(lessonId, markdown) → UPDATE lessons
```

A chave da Hugging Face **nunca** é lida no navegador — é um erro de segurança que já aconteceu de verdade neste projeto (duas vezes, com Gemini e com Hugging Face) e foi corrigido movendo a chamada para uma Vercel Function server-side. Regra permanente deste repositório: qualquer chave secreta é lida via `process.env` dentro de `api/*.ts`, nunca via `import.meta.env.VITE_*` no frontend.

### 5.3 O prompt e suas regras

O `SYSTEM_PROMPT` em `api/format-lesson.ts` instrui o modelo a:

1. Separar cada slide com uma linha `---`.
2. Começar cada slide com um título de nível 2.
3. Resumir texto longo em bullet points (até 4–5 por slide).
4. **Preservar exatamente** qualquer imagem que já exista no texto original (formato `![alt](url)`, incluindo o padrão `![[PRINT: Título]](caminho)`) — nunca reescrever o título ou o caminho.
5. Só sugerir uma imagem nova quando não existir nenhuma no trecho, usando `![<descrição curta>](pendente)` — a palavra `pendente` é usada literalmente como "url", nunca uma frase com espaços.
6. Preservar citações importantes como `> [!NOTE]`/`> [!TIP]`.
7. Não alterar frontmatter YAML.
8. Responder **apenas** com o Markdown puro, nunca envolto em um bloco de código.

As regras 4, 5 e 8 existem por causa de bugs reais encontrados testando a API de produção (não hipotéticos): a versão original do prompt fazia o modelo **destruir** imagens já existentes (reescrevia para `![Placeholder](descrição com espaços)`, uma sintaxe de Markdown inválida que nem renderiza como imagem) e **envolvia a resposta inteira em uma cerca de código**, o que virava um slide vazio quebrado logo no início. Por isso o handler também tem uma defesa extra (`stripCodeFence`) que remove essa cerca mesmo se o modelo ignorar a regra 8 — confirmado que isso acontece com frequência suficiente para não confiar só na instrução do prompt. Ver `.ai/history/2026-09-22_fix_auto_formatar_ia_imagens.md` para o relato completo dessa investigação.

### 5.4 Limitações conhecidas

- `/api/format-lesson` só responde rodando via `vercel dev` (ou em produção); sob `npm run dev` puro (Vite sem Vercel Functions), a chamada falha com 404 e o `hfService.ts` propaga um erro claro em vez de travar silenciosamente.
- Cada chamada é uma requisição real e paga à Hugging Face — não é simulada em nenhum ambiente.
- O modelo pode ocasionalmente ter timeout (o limite é 60s no cliente); nesse caso o usuário só precisa tentar de novo.

---

## 6. Class Studio — o ambiente de edição

Duas rotas, sem usar nenhuma biblioteca de roteamento (o projeto não tinha nenhuma antes; a decisão foi não adicionar uma só para isso) — o match é feito manualmente em `src/main.tsx` por `window.location.pathname`:

### `/class-studio` — índice (`ClassStudioIndex.tsx`)

Lista todas as aulas (`LessonEditorService.listLessons()`), agrupadas por `gc_id`, cada uma com:
- Título e `module_id` / `uc_id`.
- Selo **Formatado** ou **Pendente** (heurística da seção 3).
- Selo **Nova** / **Alterada** (seção 7.4) quando o Works Manager publicou ou mudou o conteúdo desde a última revisão de um instrutor — junto com um botão **"Marcar como revisada"**.
- Um botão **"Formatar com IA"** direto na linha, para aulas pendentes — não precisa abrir o editor completo para isso.
- Link para o editor completo (`/class-studio/<id>`).

### `/class-studio/:lessonId` — editor (`AdminSlideEditor.tsx`)

Tela dividida:
- **Esquerda**: um `<textarea>` com o Markdown puro da aula.
- **Direita**: pré-visualização ao vivo, reaproveitando o próprio `SlideRenderer.tsx` que o aluno usa — o que o editor vê é exatamente o que o aluno vai ver.

Botões da barra de ferramentas:
- **Auto-Formatar (IA)** — descrito na seção 5.
- **Inserir imagem** — upload simples, insere `![nome-do-arquivo](url)` no cursor.
- **Importar Imagens (N)** — abre o popup de importação (seção 7), N = quantas imagens da aula ainda não foram importadas de verdade.
- **Salvar** — grava `markdown_content` de volta em `lessons` via `LessonEditorService.saveLessonMarkdown`.

---

## 7. Como as imagens entram: o popup de importação

### 7.1 O problema que ele resolve

O texto das aulas frequentemente já contém uma referência de imagem com o **título certo**, mas um caminho que não existe de verdade no sistema (herdado do processo de escrita do Works Manager):

```markdown
![[PRINT: Tela de Catálogo de Mão de Obra]](../imagens/m1_tela_catalogo_maodeobra.png)
```

Quem vai anexar o print de tela real tem um arquivo no computador com um nome qualquer, sem relação com esse caminho. O popup existe para que a pessoa só precise **escolher o arquivo certo** — o título já vem pronto do Markdown, não precisa ser digitado de novo.

### 7.2 Como funciona (`ImageImportModal.tsx`)

1. `extractImageSlots(markdown)` varre o texto com uma regex que reconhece tanto `![texto simples](url)` quanto o padrão de colchete duplo `![[PRINT: Título]](url)` (a regex trata `[PRINT: Título]` como parte do texto alternativo, incluindo os colchetes internos).
2. Cada ocorrência vira uma linha na lista: título, caminho atual, e um botão de ação.
3. `isRealUrl(url)` decide se aquela imagem já foi importada de verdade: `true` se a URL começa com `http(s)://` **ou** com `/api/blob-serve` (o proxy do Vercel Blob — ver seção 7.3). Qualquer outra coisa (caminho relativo tipo `../imagens/x.png`, ou a descrição-como-url que a IA às vezes ainda sugere para imagens novas) conta como pendente.
4. Ao clicar em "Selecionar imagem" (ou "Substituir", se já importada), a pessoa escolhe um arquivo do computador — o upload acontece (seção 7.3) e a linha original é substituída no Markdown por `![<mesmo título>](<nova URL>)`, usando uma troca de string literal (não por posição/índice), o que evita qualquer problema de deslocamento ao importar várias imagens em sequência.

### 7.3 Onde as imagens ficam armazenadas: Vercel Blob

As imagens **não** ficam no Supabase Storage (havia um bucket `course-assets` lá, hoje superado — script mantido só como histórico em `src/player/db/supabase_lessons_slides.sql`). A decisão foi migrar para o **Vercel Blob**, por performance, já que o acesso a quem pode ver/editar o treinamento já é resolvido em outra camada (autenticação do Player) — não era necessário reimplementar controle de acesso por tenant também no armazenamento de imagem.

Fluxo real (upload passa pelo servidor, não é client-token direto — decisão para simplificar a autorização):

```
Navegador                          api/blob-upload.ts              api/blob-serve.ts
   │  seleciona arquivo                │                                 │
   │  (comprime se > 3MB via Canvas    │                                 │
   │   → JPEG 85%, limite 4.4MB)       │                                 │
   │                                   │                                 │
   │──POST bytes brutos───────────────▶│                                 │
   │  ?pathname=course-assets/...      │  put(pathname, bytes,           │
   │                                   │      { access: 'private' })     │
   │◀──{ pathname, url: "/api/blob-    │                                 │
   │     serve?pathname=..." }─────────│                                 │
   │                                                                     │
   │  <img src="/api/blob-serve?pathname=...">                          │
   │────────────────────────────────────────────────────GET────────────▶│
   │                                                       get(pathname, │
   │                                                        {access:     │
   │                                                         'private'}) │
   │◀──stream da imagem, Content-Type correto───────────────────────────│
```

Pontos importantes:
- O blob é **privado** (`access: 'private'`) — não existe URL pública direta; toda leitura passa pelo proxy `/api/blob-serve`, que busca no Blob Store com o token do servidor e faz streaming da resposta (nunca grava em disco).
- `BLOB_READ_WRITE_TOKEN` é lido só no servidor, no mesmo padrão de segurança das outras chaves.
- O limite de 4.4MB existe porque o upload passa pelo corpo de uma Vercel Function (limite de ~4.5MB do runtime Node serverless) — por isso a compressão automática via `<canvas>` antes de enviar arquivos grandes.
- `LessonEditorService.uploadImage()` tem um fallback: se o upload falhar (rede, `/api/blob-upload` indisponível em `npm run dev` puro, etc.), a imagem vira uma Data URL embutida no próprio Markdown — funciona para visualização imediata, mas não é uma solução definitiva de armazenamento.

### 7.4 Anotação de imagem (`ImageAnnotatorModal.tsx`)

Ferramenta separada, aberta a partir do botão **"Anotar"** em qualquer imagem já importada (dentro do próprio popup de importação) — não é um passo obrigatório do upload, pode ser reaberta a qualquer momento.

- Quatro ferramentas sobre um `<canvas>`: **grifo** (retângulo semitransparente), **retângulo de cantos arredondados**, **seta**, **texto/legenda** — mais uma paleta de 5 cores, desfazer e limpar.
- É uma ferramenta manual, para o instrutor evidenciar pontos específicos numa captura de tela (ex.: circular um botão, apontar uma seta para um campo). O agente de IA **não** gera nem sugere anotações — isso é deliberadamente humano.
- Ao salvar, o canvas inteiro (imagem + anotações) é exportado como um novo PNG e enviado pelo mesmo pipeline de upload (`LessonEditorService.uploadImage`, seção 7.3) — gera uma **nova** imagem, não sobrescreve a original.

### 7.5 Detectando o que mudou entre publicações do Works Manager (`LessonSyncService.ts`)

**Problema real que isso resolve:** o Works Manager escreve direto em `lessons.markdown_content`. Sem alguma forma de saber "essa aula já foi revisada/formatada e não mudou desde então", é fácil reprocessar por engano uma aula que já estava pronta — isso já aconteceu de verdade (a aula `wm-m1-a6` foi passada pelo Auto-Formatar sem necessidade e perdeu conteúdo; ver seção 5.3 e `.ai/history/2026-09-22_fix_auto_formatar_ia_imagens.md`).

A solução é uma tabela própria deste repositório, `public.lessons_sync_state` (`src/player/db/lessons_sync_state.sql`) — **não** faz parte do schema que o Works Manager escreve, guarda só `lesson_id`, um hash SHA-256 do `markdown_content` e quando foi revisado:

```
Aula sem linha em lessons_sync_state           → NOVA (nunca revisada aqui)
Hash atual de markdown_content ≠ hash salvo    → ALTERADA (Works Manager mudou desde a última revisão)
Hash atual de markdown_content == hash salvo   → SINCRONIZADA (nada a fazer)
```

O hash é calculado com `crypto.subtle.digest('SHA-256', ...)` (Web Crypto, roda no navegador — mesmo algoritmo usado por `TelemetryService` para HMAC). `/class-studio` mostra o selo **Nova**/**Alterada** e um botão **"Marcar como revisada"** para aceitar uma aula como está, sem precisar editá-la. Salvar uma edição no editor (`AdminSlideEditor.tsx`) ou rodar o Auto-Formatar também marca a aula como revisada automaticamente — grava o hash do resultado.

**Somente aulas Alteradas ou Novas exigem atenção** — o resto pode ser ignorado com segurança em qualquer nova leva de dados do Works Manager, mesmo que a listagem inteira tenha 30, 100 ou mais aulas.

### 7.6 Granularidade por slide: protocolo `slide-id` (`SlideSyncService.ts`)

**Problema que isso resolve, além do que a seção 7.5 já cobre:** hash de `markdown_content` inteiro não diz **qual** slide mudou. Se o Works Manager insere um slide novo no meio de uma aula, todos os slides seguintes deslocam de posição — sem uma identidade estável por slide, isso pode ser mal interpretado (a aula inteira "parece" reescrita, ou pior, alguém tenta comparar por índice e acha que um slide "sumiu" quando na verdade só moveu). Contrato técnico completo: `.ai/specs/slide_identification_protocol.md` no repo `gestor-de-obras`.

**Formato emitido pelo Works Manager** — todo slide carrega um comentário HTML logo após o `---`, invisível na renderização (confirmado: `marked`/`DOMPurify` passam por cima sem efeito visual):

```markdown
---
<!-- slide-id: onde-encontrar -->
### Onde encontrar
```

- `slide-id` é estável através de reposicionamentos e reescritas — só um `slide-id` nunca visto antes na aula é conteúdo genuinamente novo. Escopo de identidade: `(uc_id, slide_id)`, não precisa ser único entre aulas diferentes.

**Consumo aqui (`src/lib/slideId.ts` + `SlideSyncService.ts` + `public.lessons_slide_sync_state`):**

- `src/lib/slideId.ts` é um módulo **puro** (sem `import.meta.env`, sem Supabase) — importável tanto pelo frontend quanto por uma Vercel Function em Node puro. Contém `parseSlides()` (quebra em slides + extrai `slide-id` de cada um) e `ensureSlideIds()` (atribui um slug determinístico, derivado do título do slide, a todo slide que não tenha um — sem IA).
- `SlideSyncService.ts` (frontend) usa essas funções puras e adiciona a parte com Supabase: `classifyAll(lessonId, markdown)` compara cada slide contra `public.lessons_slide_sync_state` (chave composta `lesson_id + slide_id`) e classifica: **Novo** (slide_id nunca visto), **Movido** (slide_id conhecido, conteúdo idêntico, índice diferente), **Alterado** (conteúdo diferente), **Inalterado**, ou **Sem ID** (slide legado, ainda não identificado).
- `api/format-lesson.ts` (Auto-Formatar) foi atualizado: o prompt pede pra preservar um `slide-id` existente verbatim (regra 9 — mesma lição da regra 4 pra imagens), e **depois da resposta da IA**, `ensureSlideIds()` roda sempre, de forma determinística, garantindo que todo slide saia com um ID mesmo que o modelo esqueça de atribuir um novo. Testado contra a API real: IDs existentes preservados através de reformatação, IDs novos atribuídos a 100% dos slides que não tinham.
- `AdminSlideEditor.tsx` mostra uma faixa de selos por slide (Novo/Movido/Alterado/Sincronizado/Sem ID) acima do editor, recalculada a cada mudança no rascunho, e um botão **"Atribuir IDs faltantes"** que roda `ensureSlideIds()` manualmente. Salvar a aula marca todos os slides identificados como revisados (`SlideSyncService.markAllReviewed`).
- `ClassStudioIndex.tsx` mostra, ao lado do selo "Alterada" de uma aula, quantos slides especificamente precisam de atenção (ex. "Alterada · 2 slides") — sem precisar abrir o editor pra saber se é 1 slide novo ou a aula inteira reescrita.

**Retrofit e verificação (2026-09-23):** as 18 aulas já formatadas antes do protocolo existir ganharam `slide-id` retroativamente do lado Works Manager — exceto o "slide 0" (o trecho antes do primeiro `---`, geralmente um comentário de preâmbulo tipo `(resumo para apresentação)`), que a rotina de retrofit deles não cobria por não ter um `---` anterior para ancorar a inserção. Corrigido aqui com o mesmo `ensureSlideIds()` (determinístico, preservando os IDs já existentes). As 15 aulas que ainda estavam em texto corrido ganharam `slide-id` em todos os slides ao passar pelo Auto-Formatar. **224 slides, 0 sem identificação, todos com snapshot de linha de base.** Testado simulando uma inserção real de slide no meio de uma aula: o slide novo foi classificado como "new" e os 4 slides deslocados como "moved" — nenhum interpretado como "changed" ou perdido.

---

## 8. Como a aula chega até a trilha do curso

Ter o `markdown_content` formatado não é suficiente sozinho — o Player precisa saber **quais aulas existem** e **em que ordem**, para desenhar a trilha (`CourseTrailView.tsx`) e navegar entre elas (`OAPlayerView.tsx`).

Isso é responsabilidade de `CourseManifestService.fetchManifest(gcId)`, que tenta, em ordem:

1. **`course_manifests`** (tabela JSONB legada, pensada para cursos com manifesto pré-montado) — **não existe** no banco real de produção. Sempre falha e cai no próximo passo.
2. **`buildManifestFromLessons(gcId, tenantId)`** — consulta `lessons` filtrando por `gc_id`, ordena por `module_id`/`order`, e monta um `LearningObject[]` (um por linha), todos com `prerequisites: []` (é um acervo tipo biblioteca, sem trava sequencial entre aulas — qualquer uma pode ser aberta a qualquer momento). Isso é o que efetivamente entrega as 33 aulas reais do Works Manager para o Player hoje, um manifesto por `gc_id` (4 cursos por plano comercial desde 2026-09-23, ver seção 2).
3. **Catálogo mock hardcoded** (`getMockManifest`) — usado só quando nenhuma aula real existe para aquele `gc_id` (ex. os cursos de demonstração "Fundamentos de Lógica", "Arquitetura de Sistemas", "UX Design").

No Dashboard (`DashboardView.tsx`), o card do curso real é populado por `CourseManifestService.fetchAvailableCourseSummaries()`, que faz uma consulta simples e agrupa `lessons` por `gc_id` para mostrar quantas aulas cada curso tem.

---

## 9. Como o aluno finalmente vê a aula

1. `usePlayerStore.loadCourse(gcId)` chama `CourseEngineService.fetchManifest()`, que delega para `CourseManifestService.fetchManifest()` (seção 8).
2. O manifesto vira a trilha visual em `CourseTrailView.tsx` — cada aula é um nó.
3. Ao clicar numa aula, `OAPlayerView.tsx` decide qual renderizador usar via um mapa dinâmico (`RENDERER_MAP`), baseado no `type` do nó. Para `type: 'slide'`, é `SlideRenderer.tsx`.
4. `SlideRenderer` recebe `node.markdownContent` (que veio de `lessons.markdown_content`), quebra em slides (seção 3), e renderiza slide a slide com navegação por botão ou teclado (setas ← →). Só libera "Concluir" depois que o aluno passou por todos os slides pelo menos uma vez.

---

## 10. Resumo dos arquivos envolvidos

| Camada | Arquivo |
|---|---|
| Dado | `public.lessons` (Supabase, projeto `sagacitas-training`) |
| Tipo de domínio | `src/player/types.ts` (`OAType`, `LearningObject`, `CourseManifest`, `CourseSummary`) |
| Trilha ao vivo a partir de `lessons` | `src/player/services/CourseManifestService.ts` |
| CRUD de uma aula | `src/player/services/LessonEditorService.ts` |
| Upload/leitura de imagem | `api/blob-upload.ts`, `api/blob-serve.ts` |
| Chamada à IA (server) | `api/format-lesson.ts` |
| Chamada à IA (cliente) | `src/services/hfService.ts` |
| Índice de aulas | `src/player/components/ClassStudioIndex.tsx` |
| Editor de aula | `src/player/components/AdminSlideEditor.tsx` |
| Popup de imagens | `src/player/components/ImageImportModal.tsx` |
| Anotação de imagem (grifo/retângulo/seta/texto) | `src/player/components/ImageAnnotatorModal.tsx` |
| Detecção de mudanças por aula (Nova/Alterada/Sincronizada) | `src/player/services/LessonSyncService.ts`, `public.lessons_sync_state` |
| Utilitários puros de slide-id (parsing, slugify) | `src/lib/slideId.ts` (sem dependência de browser/Supabase — usado também por `api/format-lesson.ts`) |
| Detecção de mudanças por slide (Novo/Movido/Alterado/Inalterado) | `src/player/services/SlideSyncService.ts`, `public.lessons_slide_sync_state` |
| Render do slide (aluno e preview do editor) | `src/player/components/renderers/SlideRenderer.tsx` |
| Tela de reprodução do OA | `src/player/components/OAPlayerView.tsx` |
| Roteamento manual (`/class-studio`) | `src/main.tsx` |

---

## 11. O que ainda não existe / pendências conhecidas

- O projeto Vercel de produção (`sagacitas-landing-page`) ainda não tem nenhuma variável de ambiente configurada — sem isso, um deploy real não teria acesso a Supabase, Hugging Face ou Vercel Blob.
- Não existe hoje nenhuma trava de pré-requisito entre aulas (`prerequisites: []` em todas) — é deliberado (modelo de acervo/biblioteca), mas significa que não há progressão sequencial obrigatória para nenhum dos cursos.
- O motor DNT (Diagnóstico e Aceleração) e o registro de progresso (`student_uc_progress`) descritos em `specs/SPECS.md` foram desenhados para o modelo de curso mockado original — ainda não há uma ponte equivalente ligando o progresso real do aluno nas 33 aulas do Works Manager a esse motor.
- **Acesso a um curso não é restrito pelo plano comercial contratado** — desde a reestruturação em 4 cursos (2026-09-23), qualquer usuário autenticado vê e acessa todos eles, independente do plano do tenant. É uma decisão deliberada de escopo (ver as 4 aulas `wm-acesso-*` no `gestor-de-obras`, que já avisam isso ao aluno) — implementar controle de acesso real exigiria uma ponte de identidade entre o Supabase do `gestor-de-obras` (onde vive o contrato/plano real do tenant) e a autenticação Firebase deste repositório, ainda não desenhada.
