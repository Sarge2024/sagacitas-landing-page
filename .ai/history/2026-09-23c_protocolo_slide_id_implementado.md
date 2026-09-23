# 2026-09-23 (madrugada) — Protocolo `slide-id`: consumo implementado do lado landing-page

## Contexto

Usuário identificou um risco real: ao receber um novo pacote de aulas do Works Manager, uma **inserção de slide intermediário** (que só desloca o número de sequência dos slides seguintes, sem alterá-los) poderia ser mal interpretada pelo sistema de detecção de mudanças — no nível de aula inteira, tudo aparece como "Alterada" sem indicar se é um slide novo, um slide movido, ou uma reescrita real. Pediu verificação de prontidão e, em seguida, a implementação.

O Works Manager já tinha implementado a emissão de um identificador estável por slide (`<!-- slide-id: <slug> -->`) e documentado o contrato técnico completo em `gestor-de-obras/.ai/specs/slide_identification_protocol.md`, acessível localmente no mesmo disco (`/mnt/46F84CA3F84C935B/Atividades_2026/Obras/Sistema/gestor-de-obras`).

## O que foi implementado

### 1. Módulo puro (`src/lib/slideId.ts`)
Sem dependência de `import.meta.env` nem Supabase — importável tanto pelo frontend quanto por uma Vercel Function em Node puro. `parseSlides()` (quebra em slides + extrai `slide-id`), `ensureSlideIds()` (atribui slug determinístico ao que falta, sem IA), `slugify()`.

### 2. Nova tabela `public.lessons_slide_sync_state`
Chave composta `(lesson_id, slide_id)`, guarda `content_hash` + `slide_index` + `reviewed_at`. Extensão de `lessons_sync_state` (nível-aula) para granularidade de slide, exatamente como a spec sugeria. Criada via conexão Postgres direta (`pg`, `--no-save`).

### 3. `SlideSyncService.ts`
Camada com Supabase sobre o módulo puro: `classifyAll(lessonId, markdown)` classifica cada slide como **Novo** / **Movido** / **Alterado** / **Inalterado** / **Sem ID**, comparando contra os snapshots salvos.

### 4. `api/format-lesson.ts` atualizado
- Regra 9 no prompt: preservar `slide-id` existente verbatim (mesma lição da regra 4, preservação de imagens).
- **Pós-processamento determinístico**: `ensureSlideIds()` roda sempre sobre a resposta da IA, garantindo 100% de cobertura mesmo que o modelo não siga a regra 9 corretamente — mesma lição já aprendida com imagens: não confiar só no prompt para algo que o código pode garantir.

### 5. UI (`AdminSlideEditor.tsx`, `ClassStudioIndex.tsx`)
- Editor: faixa de selos por slide (recalculada a cada mudança no rascunho, com debounce), botão "Atribuir IDs faltantes", `handleSave` agora também marca todos os slides como revisados.
- Índice: ao lado do selo "Alterada" de uma aula, mostra quantos slides especificamente precisam de atenção (só calculado pras aulas já alteradas, evita custo desnecessário).

## Verificação (real, não só leitura de código)

- Testado contra a API real da Hugging Face: conteúdo cru formatado ganhou 6 slide-ids únicos; conteúdo já identificado, reformatado de novo, preservou os IDs originais exatamente.
- **Achado durante o backfill**: as 18 aulas retrofitadas pelo Works Manager tinham TODAS o mesmo padrão de lacuna — o "slide 0" (texto antes do primeiro `---`, geralmente um preâmbulo tipo `(resumo para apresentação)`) nunca recebeu `slide-id`, porque a rotina de retrofit deles ancorava a inserção em cada `---`, que esse trecho não tem antes. Corrigido com o mesmo `ensureSlideIds()` — preservou os IDs já existentes, atribuiu o que faltava.
- As 15 aulas que eu tinha formatado horas antes (via Auto-Formatar, antes desta implementação existir) ganharam `slide-id` retroativamente, também via `ensureSlideIds()` — sem chamada de IA, puramente determinístico, preservando o conteúdo exato.
- **224 slides no total, 0 sem identificação**, todos com snapshot de linha de base gravado em `lessons_slide_sync_state`.
- **Simulação real do cenário que motivou o pedido**: inseri um slide novo na posição 2 de uma aula real (deslocando os 4 slides seguintes, sem alterar o conteúdo deles) e rodei a classificação — resultado: o slide novo → "new", os 4 deslocados → "moved", **nenhum** interpretado como "changed" ou perdido. Exatamente o comportamento correto.
- `tsc --noEmit` e `npm run build` limpos em cada etapa.

## Referências

- `gestor-de-obras/.ai/specs/slide_identification_protocol.md` — contrato técnico origem.
- `AULAS_E_SLIDES.md`, seção 7.6 — documentação de referência atualizada (substituiu a nota anterior de "pendente").
