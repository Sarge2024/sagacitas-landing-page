# 🧠 AI Ledger - sagacitas-landing-page

Sumário cronológico contínuo de funcionalidades e correções construídas neste repositório por agentes de IA (Claude, Gemini, outros).

**Obrigatório**: todo agente de IA deve checar `.ai/sync/` (ver `.ai/sync/README.md`) ao iniciar uma sessão, antes de implementar qualquer coisa.

> [!TIP]
> Este repositório recebe conteúdo de treinamento publicado pelo repo irmão `gestor-de-obras` (Works Manager), direto na tabela `lessons` do Supabase compartilhado. `WORKS_MANAGER_HANDOFF.md` (raiz deste repo) é o ponto de entrada pra esse contexto cross-repo; o ledger completo do lado de lá vive em `.ai/history/` do `gestor-de-obras`.

---

## 📅 2026-09-22 — Criação retroativa do ledger: segurança, chat migrado pra Hugging Face, projeto Vercel corrigido, compilador de manifesto
- **Contexto**: este protocolo não existia até aqui — criado depois que Claude Code e Gemini editaram este repo em paralelo, no mesmo dia, sem coordenação (chegaram a criar `src/services/hfService.ts` em dois lugares por engano).
- **Resumo**: chaves de API (Gemini, Hugging Face) tiradas do bundle do navegador pra Vercel Functions; endpoint morto da Hugging Face corrigido e permissão do token habilitada (testado, `200 OK`); chat do site migrado de Gemini (chave inválida) pra Hugging Face; projeto Vercel relinkado (estava em `rdo-wm`, achado: zero env vars em produção); compilador de manifesto construído (`lessons` → `CourseManifest`) resolvendo o gap de as 28 aulas do Works Manager nunca chegarem no aluno.
- **Detalhe completo**: `.ai/history/2026-09-22_criacao_retroativa_ledger.md`.

## 📅 2026-09-22 — Correção: Auto-Formatar (IA) destruía imagens existentes e quebrava o layout
- **Contexto**: usuário reportou que a formatação via IA não inseriu imagens nem teve efeito visível — investigado testando `api/format-lesson.ts` de verdade contra a Hugging Face com uma aula real, não só lendo o código.
- **Resumo**: o modelo envolvia a resposta em cerca de código (```` ```markdown ````), virando um slide vazio quebrado logo no início; e a regra de imagens do prompt fazia o modelo reescrever imagens **já existentes** como `![Placeholder](descrição com espaços)` — título original perdido e sintaxe inválida (renderizava como texto cru). Prompt corrigido (preservar imagens existentes verbatim; novas sugestões usam `![<descrição>](pendente)`) + remoção defensiva da cerca de código no handler. Encontrada e restaurada 1 aula real (`wm-m1-a6`) já corrompida pelo bug antigo.
- **Detalhe completo**: `.ai/history/2026-09-22_fix_auto_formatar_ia_imagens.md`.

## 📅 2026-09-23 — Anotação de imagem, correção de tipografia real e detecção de mudanças do Works Manager
- **Contexto**: usuário insatisfeito com qualidade visual, falta de ferramenta de evidenciação em imagens, e risco de reprocessar aulas que já estavam prontas quando o Works Manager publica novidades.
- **Resumo**: corrigido bug real (`@tailwindcss/typography` nunca instalado — a classe `prose` do `SlideRenderer` não fazia nada); criada `ImageAnnotatorModal.tsx` (grifo, retângulo arredondado, seta, texto — ferramenta manual e separada, reabrível a qualquer momento); criado `LessonSyncService.ts` + tabela própria `lessons_sync_state` pra distinguir aulas Novas/Alteradas/Sincronizadas via hash do conteúdo, evitando reformatar por engano o que já está pronto — testado simulando uma alteração real do Works Manager em produção e revertendo em seguida.
- **Detalhe completo**: `.ai/history/2026-09-23_anotacao_imagem_e_deteccao_de_mudancas.md`.

## 📅 2026-09-23 (noite) — Manutenção pós-reestruturação + divisão de responsabilidade formalizada
- **Contexto**: usuário definiu a divisão de responsabilidade — Works Manager fornece conteúdo, `sagacitas-landing-page` mantém os treinamentos e comunica status de volta (não decide categorização de conteúdo).
- **Resumo**: reformatadas as 15 aulas revertidas pela reestruturação em 4 cursos; encontrado e corrigido um defeito real em **6 aulas** (2 achadas na revisão + 4 mais achadas numa varredura completa): placeholders de imagem `![[PRINT: Título]]` sem o `(caminho)` — Markdown inválido, renderiza como texto cru. **33/33 aulas sincronizadas** ao final. Comunicado de volta pro Works Manager via `WORKS_MANAGER_HANDOFF.md`: pedido pra sempre incluir `(caminho)` nos placeholders, e sinalizada (não decidida) a categorização pendente da aula `wm-m5-a1`.
- **Detalhe completo**: `.ai/history/2026-09-23b_manutencao_pos_reestruturacao.md`.

## 📅 2026-09-23 (madrugada) — Protocolo `slide-id`: consumo implementado
- **Contexto**: usuário identificou o risco de inserção de slide intermediário confundir o sistema de detecção de mudanças (aula inteira aparece "Alterada" sem dizer o quê); pediu verificação de prontidão e depois a implementação.
- **Resumo**: lido o contrato técnico direto no repo `gestor-de-obras` (acessível localmente); criado módulo puro `src/lib/slideId.ts`, tabela `lessons_slide_sync_state`, `SlideSyncService.ts` (Novo/Movido/Alterado/Inalterado por slide), `api/format-lesson.ts` atualizado (preserva `slide-id` existente + atribui determinística e automaticamente o que falta, sem depender só do prompt), e UI em `AdminSlideEditor.tsx`/`ClassStudioIndex.tsx`. Achado durante o backfill: as 18 aulas retrofitadas pelo Works Manager tinham todas a mesma lacuna sistemática (slide 0, antes do primeiro `---`, nunca ganhou ID) — corrigido. **224/224 slides identificados.** Simulado o cenário exato do usuário (inserção de slide no meio) — classificação correta confirmada: novo → "new", deslocados → "moved", nenhum perdido ou mal interpretado.
- **Detalhe completo**: `.ai/history/2026-09-23c_protocolo_slide_id_implementado.md`.

## 📅 2026-09-23 (fim de tarde) — Correção: cursos reais do Works Manager sumiam do Dashboard depois do login
- **Contexto**: usuário reportou que o Console de Treinamentos só mostrava os 3 cursos mock, nenhum card real do Works Manager, mesmo rodando localmente.
- **Resumo**: achado em `supabaseClient.ts` — o handshake dual-auth sobrescrevia o cliente Supabase singleton com `Authorization: Bearer <token do Firebase/mock>`, um JWT que o PostgREST não consegue verificar (não assinado com o secret deste projeto). Resultado: **toda** consulta Supabase feita depois do login (inclusive a do Dashboard) passava a falhar com `401` silenciosamente. `ClassStudioIndex`/`AdminSlideEditor` nunca sofriam disso por rodarem numa rota separada que não passa pelo handshake. Corrigido parando de repassar esse token pro cliente Supabase — as tabelas de treinamento já usam RLS permissiva e não dependem dele.
- **Detalhe completo**: `.ai/history/2026-09-23d_fix_cursos_reais_sumindo_do_dashboard.md`.
