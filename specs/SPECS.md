# SAGACITAS PLAYER — Especificações Técnicas do Sistema

**Versão:** `1.3.0`
**Data de Atualização:** 2026-08-11
**Tipo:** SDK White-Label — Plataforma Headless de E-Learning B2B
**Repositório Raiz:** `Sarge2024/Player-e-learning`

---

## 1. Visão Geral

O **Sagacitas Player** é uma aplicação React embarcável (White-Label SDK) que entrega trilhas de aprendizagem de colaboradores dentro de empresas clientes (Tenants). Opera como módulo instalável na Landing Page da Sagacitas, porém é **100% agnóstico a domínio**, podendo ser clonado e reaproveitado por qualquer empresa parceira.

A plataforma implementa **dois protocolos de segurança distintos e complementares**:
1. **Dual-Auth Handshake** (Autenticação em 2 Fases: Firebase + Supabase RLS) — garante a identidade do aluno e o isolamento B2B por Tenant.
2. **Motor de Telemetria com Assinatura HMAC** — garante a integridade dos resultados de aprendizagem enviados ao banco de dados, prevenindo adulteração de notas.

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework UI | React | `^19.0.0` |
| Linguagem | TypeScript | `~5.8.2` |
| Bundler | Vite | `^6.2.0` |
| Estado Global | Zustand | `^5.0.14` |
| Estilização | Tailwind CSS | `^4.1.14` |
| Animações | Motion (Framer) | `^12.23.24` |
| Ícones | Lucide React | `^0.546.0` |
| Identidade (IdP) | Firebase Auth | `^12.17.1` |
| Banco de Dados | Supabase (PostgreSQL + RLS) | `^2.112.3` |
| Assinatura de Dados | Web Crypto API (nativa do browser) | — |

---

## 3. Variáveis de Ambiente Necessárias (`.env`)

| Variável | Obrigatoriedade | Descrição |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Obrigatória | Chave da API do projeto Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Obrigatória | Domínio de autenticação Firebase |
| `VITE_FIREBASE_PROJECT_ID` | Obrigatória | ID do projeto Firebase |
| `VITE_FIREBASE_APP_ID` | Obrigatória | ID do App Firebase |
| `VITE_SUPABASE_URL` | Obrigatória | URL da instância Supabase |
| `VITE_SUPABASE_ANON_KEY` | Obrigatória | Chave anônima pública do Supabase |
| `VITE_TENANT_ID` | Obrigatória | Identificador único da empresa cliente (Tenant) |
| `VITE_TELEMETRY_SECRET` | **Obrigatória** *(novo v1.3)* | Chave HMAC para assinatura dos resultados de OA |
| `GEMINI_API_KEY` | Opcional | Chave para funcionalidades de IA generativa |
| `APP_URL` | Opcional | URL de hospedagem do serviço |

> ⚠️ **ATENÇÃO:** Sem `VITE_TELEMETRY_SECRET`, o `TelemetryService` entrará em modo **fail-fast** e bloqueará o envio de resultados.

---

## 4. Arquitetura de Módulos

### 4.1 Camada de Serviços (`src/player/services/`)

| Arquivo | Responsabilidade |
|---|---|
| `AuthHandshakeService.ts` | Orquestra o Dual-Auth Handshake (Firebase Fase 1 + Supabase Fase 2) |
| `CourseEngineService.ts` | Busca manifestos de cursos e progresso do aluno; computa trilha de navegação |
| `CourseManifestService.ts` | Leitura e parsing do manifesto JSON do curso (`CourseManifest`) |
| `StudentProgressService.ts` | Fusão do progresso do aluno com o grafo de execução do manifesto |
| `ValidationEngineService.ts` | Motor de regras DNT: calcula aprovação/reprovação e isenções; **não persiste dados** |
| `TelemetryService.ts` *(v1.3)* | Assina o payload com HMAC SHA-256 (Web Crypto API) e persiste no Supabase |
| `InviteService.ts` | Gerenciamento de convites de acesso (`student_invites`) |
| `firebaseClient.ts` | Inicialização e acesso singleton do Firebase Auth SDK |
| `supabaseClient.ts` | Inicialização e acesso singleton do Supabase Client; injeção de token JWT |

### 4.2 Camada de Estado Global (`src/player/store/`)

| Arquivo | Responsabilidade |
|---|---|
| `usePlayerStore.ts` | Store principal: autenticação, navegação, submissão de notas, orquestração geral |
| `useCourseStore.ts` | Store focado no estado do curso: manifesto, progresso, trilha computada, DNT |
| `useTelemetryStore.ts` *(v1.3)* | Fila offline de telemetria: enfileira OAs não enviados, sincroniza ao reconectar |

### 4.3 Camada de Componentes (`src/player/components/`)

| Arquivo | Tela / Propósito |
|---|---|
| `HandshakeView.tsx` | Tela de Login do Player (E-mail/Senha + Google OAuth) |
| `DashboardView.tsx` | Painel principal do aluno após autenticação |
| `CourseTrailView.tsx` | Trilha visual do curso com estado de cada OA (LOCKED, AVAILABLE, etc.) |
| `OAPlayerModal.tsx` | Modal de execução do Objeto de Aprendizagem (vídeo, quiz, simulador, etc.) |
| `ClientWalletView.tsx` | Painel do Gestor de Contrato (Tenant Admin): assentos e convites |
| `HeaderNav.tsx` | Barra de navegação superior |
| `SidebarNav.tsx` | Menu lateral de navegação |
| `MobileNav.tsx` | Menu inferior responsivo para mobile |
| `ServiceInspectorModal.tsx` | Modal de depuração de serviços (logs em tempo real do SDK) |

### 4.4 Domínio de Tipos (`src/player/types.ts`)

| Tipo | Descrição |
|---|---|
| `OAState` | `LOCKED \| AVAILABLE \| IN_PROGRESS \| COMPLETED \| REMEDIATION` |
| `OAType` | `video \| lab \| quiz \| project \| simulator` |
| `LearningObject` | Estrutura de um Objeto de Aprendizagem no grafo de execução |
| `CourseManifest` | Estrutura completa do curso com `gc_id`, título, `tenant_id` e grafo de nós |
| `StudentProgress` | Progresso de um aluno em uma OA específica (`student_uc_progress`) |
| `MergedNodeProgress` | Fusão de `LearningObject` + `StudentProgress` com estado computado |
| `DntRoutingInstruction` | Instrução do motor DNT para roteamento de fases do OA |
| `TenantContract` | Dados de licenciamento do Tenant (status, validade, max assentos) |
| `AuthSession` | Sessão autenticada do aluno com dados do usuário e detalhes do Dual-Auth |
| `DualAuthDetails` | Detalhe interno da autenticação dupla Firebase + Supabase |

---

## 5. Protocolo de Autenticação — Dual-Auth Handshake

```
┌─────────────┐       Fase 1: Firebase Auth        ┌───────────────┐
│  Player UI  │  ──── E-mail/Senha ou Google ────>  │  Firebase Auth │
│ (HandshakeView) │  <───── Firebase JWT Token ──── │  (IdP)        │
└─────────────┘                                     └───────────────┘
       │
       │  Fase 2: Supabase RLS (Tenant Isolation)
       ▼
┌─────────────────────────────────────────────────────────────┐
│  validateTenantContractAndInjectSupabase(token, tenantId)   │
│  • Injeta JWT do Firebase no client Supabase (setSession)   │
│  • Valida tenant_id do contrato (status ACTIVE + validade)  │
│  • Retorna TenantContract com max_seats                     │
└─────────────────────────────────────────────────────────────┘
```

**Modos de autenticação suportados:**
- E-mail / Senha (Firebase `signInWithEmailAndPassword`)
- Google OAuth (Firebase `signInWithPopup`)
- JWT Externo (`explicitToken` via URL params ou `window.postMessage`)
- Fallback de desenvolvimento (credenciais pré-configuradas)

---

## 6. Motor de Telemetria com HMAC — (v1.3.0)

O resultado de cada OA passa por um pipeline de segurança antes de ser persistido:

```
usePlayerStore.submitScore(score)
       │
       ├── ValidationEngineService.submitOAScore(...)
       │       └── Calcula estado (COMPLETED/REMEDIATION), DNT e is_exempt_by_dnt
       │           ⚡ NÃO persiste dados diretamente no banco
       │
       └── useTelemetryStore.queueResult(updatedProgress)
               │
               ├── Se ONLINE: TelemetryService.submitOAResult(progress)
               │       ├── Lê VITE_TELEMETRY_SECRET (fail-fast se ausente)
               │       ├── Gera Payload: { ucId, gcId, score, state, studentId, timestamp }
               │       ├── window.crypto.subtle.sign("HMAC", SHA-256, payload)
               │       └── Supabase upsert({ ...payload, signature })
               │
               └── Se OFFLINE / falha de rede:
                       └── Guarda em queue[] no Zustand
                           window.addEventListener('online') → syncQueue()
```

**Tabela de destino:** `student_uc_progress`
**Campo de segurança:** `signature` (HMAC SHA-256 hex string)

---

## 7. Esquema do Banco de Dados (Supabase)

### `public.tenant_contracts`
| Campo | Tipo | Descrição |
|---|---|---|
| `tenant_id` | `VARCHAR(100) PK` | ID único da empresa cliente |
| `company_name` | `VARCHAR(255)` | Nome da empresa |
| `status` | `VARCHAR(50)` | `ACTIVE`, `EXPIRED` ou `SUSPENDED` |
| `valid_until` | `TIMESTAMPTZ` | Data de expiração do contrato |
| `max_seats` | `INT` | Número máximo de alunos licenciados |

### `public.course_manifests`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `UUID PK` | Identificador |
| `gc_id` | `VARCHAR(100)` | Grupo Curricular (ID do curso) |
| `tenant_id` | `VARCHAR(100) FK` | Referência ao `tenant_contracts` |
| `manifest` | `JSONB` | Manifesto completo do curso (JSON) |

### `public.student_uc_progress`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `UUID PK` | Identificador |
| `student_id` | `VARCHAR(128)` | UID do Firebase Auth |
| `gc_id` | `VARCHAR(100)` | ID do curso |
| `uc_id` | `VARCHAR(100)` | ID do Objeto de Aprendizagem |
| `state` | `VARCHAR(50)` | Estado do OA (`OAState`) |
| `score` | `INT` | Nota do aluno (0–100) |
| `is_exempt_by_dnt` | `BOOLEAN` | Isenção pelo motor DNT |
| `updated_at` | `TIMESTAMPTZ` | Última atualização |
| `signature` | `TEXT` *(v1.3)* | Assinatura HMAC SHA-256 do payload |

### `public.student_invites`
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `UUID PK` | Identificador |
| `tenant_id` | `VARCHAR(255)` | ID do Tenant que gerou o convite |
| `contract_id` | `VARCHAR(255)` | ID do contrato associado |
| `invite_token` | `UUID UNIQUE` | Token único de acesso ao curso |
| `email_destination` | `VARCHAR(255)` | E-mail do colaborador convidado |
| `status` | `VARCHAR(50)` | `PENDING` ou `USED` |

---

## 8. Políticas de Segurança RLS (Row Level Security)

| Política | Tabela | Regra |
|---|---|---|
| `RLS_Course_Manifests_Tenant_Isolation` | `course_manifests` | SELECT apenas se `tenant_id` bater com a claim JWT E contrato ATIVO |
| `RLS_Student_Progress_Owner_Isolation` | `student_uc_progress` | ALL (SELECT + UPSERT) apenas para o `student_id` = `auth.uid()` |
| Convites por Tenant | `student_invites` | SELECT e INSERT apenas para o `tenant_id` correspondente ao JWT |

---

## 9. Modelo de Permissões de Acesso

| Papel | Permissões |
|---|---|
| **Aluno (Student)** | Visualiza seu próprio progresso; submete notas; recebe convite por token |
| **Gestor de Contrato (Tenant Admin)** | Visualiza assentos disponíveis; cria e gerencia convites (`ClientWalletView`) |
| **Proprietário do Tenant (Tenant Owner)** | Todos os acessos acima + gestão do contrato |

---

## 10. Diagrama de Telas (View Routing)

```
handshake  →  (autenticação bem-sucedida)  →  dashboard
                                                  │
                                    ┌─────────────┼─────────────┐
                                    ▼             ▼             ▼
                                  trail        wallet         player
                               (CourseTrail) (Wallet)    (OAPlayerModal
                                                           sobre Trail)
```

---

## 11. Histórico de Versões

| Versão | Data | Descrição das Mudanças |
|---|---|---|
| `1.0.0` | 2026-07 | Instalação inicial do Player na Landing Page. Estrutura base do SDK. |
| `1.1.0` | 2026-08 | Dual-Auth Handshake (Firebase + Supabase RLS). Interface de login temática. Motor DNT. |
| `1.2.0` | 2026-08 | Sistema de convites (`student_invites`). Painel Gestor (`ClientWalletView`). Aba "Gerenciar Acessos". |
| `1.3.0` | 2026-08-11 | **Motor de Telemetria com HMAC SHA-256** (`TelemetryService`). Fila offline com Zustand (`useTelemetryStore`). `ValidationEngineService` refatorado para ser puramente computacional. Inicialização dos listeners online/offline na raiz da aplicação. Campo `signature` na tabela `student_uc_progress`. |
