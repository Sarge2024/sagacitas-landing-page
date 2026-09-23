# 2026-09-23 (fim de tarde) — Correção: cursos reais do Works Manager sumiam do Dashboard depois do login

## Contexto

Usuário reportou: "os cursos ainda não estão sendo apresentados no Console de treinamentos, que deve ter um card do works manager acessando os treinamentos por módulo comercial". Rodando localmente (`npm run dev` / `vercel dev`), só os 3 cursos mock apareciam — nenhum card real do Works Manager.

## Investigação

- `CourseManifestService.fetchAvailableCourseSummaries()` e a query Supabase que ele usa (`lessons.select('gc_id')`) foram testadas isoladamente com a mesma anon key do `.env` — retornaram os 33 registros / 5 `gc_id` corretamente. A lógica de `DashboardView.tsx` também não tinha bug óbvio.
- Faltava reproduzir o fluxo real (login → handshake → Dashboard). O sandbox de browser automation não conseguiu alcançar `localhost` (limitação já confirmada em tentativas anteriores nesta mesma conversa), então a investigação seguiu por código + scripts de verificação direta.
- Raiz encontrada em `src/player/services/supabaseClient.ts`: `setSupabaseAuthToken()` (chamado por `AuthHandshakeService.validateTenantContractAndInjectSupabase` ao fim da Fase 2 do dual-auth) recriava o cliente Supabase **singleton** com `Authorization: Bearer <token>`, onde `<token>` é o ID token do Firebase (ou, no fallback de demo, um JWT fabricado com assinatura literalmente inválida). Nenhum dos dois é assinado com o JWT secret do projeto Supabase.
- Testado diretamente: uma query `lessons.select(...)` com esse `Authorization` sobrescrito devolve `401` do PostgREST — `"JWT cryptographic operation failed"` — em vez de aplicar a RLS normalmente. Como o cliente é um singleton reaproveitado pelo app inteiro, **toda consulta Supabase feita depois do handshake** (inclusive a do Dashboard) passava a falhar silenciosamente (erro só logado via `console.warn`, cai no `catch` e retorna `[]`).
- `ClassStudioIndex`/`AdminSlideEditor` nunca sofreram esse problema porque rodam numa rota separada (`/class-studio`, roteada fora de `App.tsx` em `main.tsx`) que nunca passa pelo handshake — usam o cliente Supabase "limpo", só com a anon key.

## Fix

- `setSupabaseAuthToken()` não mexe mais no cliente Supabase — vira só uma validação fail-fast de token vazio. `getSupabaseClient()` também parou de reconstruir headers a partir de um token externo.
- Justificativa registrada em comentário no próprio arquivo: as tabelas de treinamento (`lessons`, `lessons_sync_state`, `lessons_slide_sync_state`) já usam RLS permissiva (`USING (true)`), então não há necessidade (nem uma forma válida, sem um endpoint que emita um JWT assinado pelo Supabase) de injetar esse token nas consultas.
- Verificado: `tsc --noEmit` e `npm run build` limpos; script de verificação simulando a query pós-fix confirma os 33 registros / 5 `gc_id` reais retornando sem erro.

## Nota

Isso não exige nenhuma mudança do lado Works Manager — bug era 100% client-side neste repo, não relacionado a formato de dados ou ao protocolo `slide-id`.
