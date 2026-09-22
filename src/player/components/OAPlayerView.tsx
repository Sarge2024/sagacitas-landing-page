import React, { useState, useEffect, useCallback } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useCourseStore } from '../store/useCourseStore';
import { MergedNodeProgress, OAType } from '../types';
import { VideoRenderer } from './renderers/VideoRenderer';
import { QuizRenderer } from './renderers/QuizRenderer';
import { SimulatorRenderer } from './renderers/SimulatorRenderer';
import { SlideRenderer } from './renderers/SlideRenderer';
import { HeaderNav } from './HeaderNav';
import { SidebarNav } from './SidebarNav';
import { MobileNav } from './MobileNav';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type Phase = 'proposito' | 'conteudo' | 'validacao';

interface PhaseStep {
  id: Phase;
  label: string;
  icon: string;
}

const ALL_PHASES: PhaseStep[] = [
  { id: 'proposito', label: 'Propósito', icon: 'my_location' },
  { id: 'conteudo',  label: 'Conteúdo',  icon: 'menu_book'   },
  { id: 'validacao', label: 'Validação', icon: 'fact_check'  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Renderer Map — add new types here as the platform grows
// ─────────────────────────────────────────────────────────────────────────────
type RendererProps = { node: MergedNodeProgress; onComplete: (score?: number) => void };

const RENDERER_MAP: Partial<Record<string, React.FC<RendererProps>>> = {
  video:         ({ node, onComplete }) => <VideoRenderer node={node} onComplete={onComplete} />,
  slide:         ({ node, onComplete }) => <SlideRenderer node={node} onComplete={onComplete} />,
  quiz:          ({ node, onComplete }) => <QuizRenderer node={node} onComplete={(s) => onComplete(s)} />,
  simulator:     ({ node, onComplete }) => <SimulatorRenderer node={node} onComplete={(s) => onComplete(s)} />,
  simulator_dre: ({ node, onComplete }) => <SimulatorRenderer node={node} onComplete={(s) => onComplete(s)} />,
  lab:           ({ node, onComplete }) => <SimulatorRenderer node={node} onComplete={(s) => onComplete(s)} />,
  project:       ({ node, onComplete }) => (
    <div className="bg-white border border-slate-200 rounded-md p-6 shadow-2xs text-center flex flex-col gap-3 items-center">
      <span className="material-symbols-outlined text-4xl text-blue-400" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
      <h3 className="font-semibold text-slate-700 text-lg">Projeto Prático</h3>
      <p className="text-sm text-slate-500 max-w-md leading-relaxed">
        Este objeto de aprendizagem requer a entrega de um projeto. Siga as instruções fornecidas pelo seu gestor e faça o upload da sua entrega na área designada.
      </p>
      <button
        onClick={() => onComplete(100)}
        className="mt-2 px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors shadow-2xs"
      >
        Marcar como entregue
      </button>
    </div>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// Unsupported Type Fallback
// ─────────────────────────────────────────────────────────────────────────────
const UnsupportedRenderer: React.FC<{ type: string }> = ({ type }) => (
  <div className="bg-amber-50 border border-amber-200 rounded-md p-6 shadow-2xs flex flex-col gap-3 items-center text-center">
    <span className="material-symbols-outlined text-4xl text-amber-500">help</span>
    <h3 className="font-semibold text-amber-800">Renderizador não suportado</h3>
    <p className="text-sm text-amber-700 max-w-sm leading-relaxed">
      O tipo de mídia <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">{type}</code> ainda não possui um renderizador registrado nesta versão do Player.
    </p>
    <p className="text-xs text-amber-600">
      Contate o administrador do sistema para adicionar suporte a este tipo de objeto de aprendizagem.
    </p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Phase Content — maps each phase to what it renders for a given node type
// ─────────────────────────────────────────────────────────────────────────────
const PHASE_TYPE_MAP: Record<Phase, OAType[]> = {
  proposito: ['video'],
  conteudo:  ['lab', 'simulator', 'simulator_dre', 'project', 'slide'],
  validacao: ['quiz'],
};

function resolvePhaseType(phase: Phase, node: MergedNodeProgress): OAType {
  const candidates = PHASE_TYPE_MAP[phase];
  // If the node type directly matches the phase's primary types, use it
  if (candidates.includes(node.type as OAType)) return node.type as OAType;
  // Otherwise use the phase's default type
  const defaults: Record<Phase, OAType> = { proposito: 'video', conteudo: 'simulator', validacao: 'quiz' };
  return defaults[phase];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main OAPlayerView
// ─────────────────────────────────────────────────────────────────────────────
export const OAPlayerView: React.FC = () => {
  const { activeNode, submitScore, setCurrentView, isLoading } = usePlayerStore();
  const { dntInstruction } = useCourseStore();

  // DNT Logic
  const isDntExempt  = Boolean(activeNode?.is_exempt_by_dnt && activeNode?.state !== 'REMEDIATION');
  const isRemediation = activeNode?.state === 'REMEDIATION';

  // Visible phases — DNT hides propósito + conteúdo
  const visiblePhases: PhaseStep[] = isDntExempt
    ? ALL_PHASES.filter(p => p.id === 'validacao')
    : ALL_PHASES;

  const [activePhase, setActivePhase] = useState<Phase>(
    isDntExempt ? 'validacao' : 'proposito'
  );

  // When the activeNode or DNT status changes, reset the phase
  useEffect(() => {
    setActivePhase(isDntExempt ? 'validacao' : 'proposito');
    setEvalResult(null);
  }, [activeNode?.id, isDntExempt]);

  const [evalResult, setEvalResult] = useState<string | null>(null);
  const [phaseCompleted, setPhaseCompleted] = useState<Set<Phase>>(new Set());

  const markPhaseComplete = (phase: Phase) =>
    setPhaseCompleted(prev => new Set(prev).add(phase));

  const canAdvanceToPhase = (phase: Phase): boolean => {
    if (isDntExempt) return phase === 'validacao';
    const order: Phase[] = ['proposito', 'conteudo', 'validacao'];
    const targetIdx = order.indexOf(phase);
    if (targetIdx === 0) return true;
    return order.slice(0, targetIdx).every(p => phaseCompleted.has(p));
  };

  // ── Score submit handler ────────────────────────────────────────────────
  const handleValidacaoComplete = useCallback(async (score = 85) => {
    const res = await submitScore(score);
    if (res) setEvalResult(res.message);
  }, [submitScore]);

  const handlePhaseComplete = useCallback((phase: Phase, score?: number) => {
    markPhaseComplete(phase);
    if (phase === 'proposito')  setActivePhase('conteudo');
    if (phase === 'conteudo')   setActivePhase('validacao');
    if (phase === 'validacao')  handleValidacaoComplete(score ?? 85);
  }, [handleValidacaoComplete]);

  // ── Render the dynamic content for the active phase ─────────────────────
  const renderPhaseContent = () => {
    if (!activeNode) return null;
    const resolvedType = resolvePhaseType(activePhase, activeNode);
    const RendererComponent = RENDERER_MAP[resolvedType];

    if (!RendererComponent) return <UnsupportedRenderer type={resolvedType} />;

    return (
      <RendererComponent
        node={activeNode}
        onComplete={(score?: number) => handlePhaseComplete(activePhase, score)}
      />
    );
  };

  if (!activeNode) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
        Nenhum Objeto de Aprendizagem selecionado.
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STATE BADGE
  // ─────────────────────────────────────────────────────────────────────────
  const StateBadge = () => {
    if (isDntExempt) return (
      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-300">
        <span className="material-symbols-outlined text-sm">speed</span>
        DNT — Rota Acelerada
      </span>
    );
    if (isRemediation) return (
      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-300">
        <span className="material-symbols-outlined text-sm">warning</span>
        Remediação
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
        <span className="material-symbols-outlined text-sm">auto_awesome</span>
        Trilha Padrão
      </span>
    );
  };

  return (
    <div className="bg-slate-50 text-slate-900 h-full overflow-y-auto font-['Inter']">
      <HeaderNav />
      <SidebarNav />

      <main className="flex-1 md:ml-[280px] max-w-[1100px] mx-auto px-4 md:px-8 pt-24 pb-32 md:pt-24 md:pb-12 transition-all">

        {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-5">
          <button
            onClick={() => setCurrentView('trail')}
            className="hover:text-blue-600 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Trilha do Curso
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-medium truncate max-w-[260px]">{activeNode.title}</span>
        </nav>

        {/* ── OA Header Card ──────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-md shadow-2xs p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600 text-white p-3 rounded-md shrink-0">
              <span
                className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {activeNode.type === 'video' ? 'play_lesson'
                  : activeNode.type === 'slide' ? 'menu_book'
                  : activeNode.type === 'quiz' ? 'quiz'
                  : activeNode.type === 'project' ? 'assignment'
                  : 'terminal'}
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="font-semibold text-slate-800 text-lg leading-tight">
                  {activeNode.title}
                </h1>
                <StateBadge />
              </div>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
                {activeNode.description}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  {activeNode.duration || '—'}
                </span>
                <span className="text-xs text-slate-400 uppercase font-mono tracking-wide">
                  {activeNode.type}
                </span>
              </div>
            </div>
          </div>

          {/* Score badge (if completed) */}
          {activeNode.score !== null && activeNode.state === 'COMPLETED' && (
            <div className="flex flex-col items-center bg-emerald-50 border border-emerald-200 rounded-md px-5 py-3 shrink-0">
              <span className="text-xs text-emerald-600 font-medium mb-0.5">Nota Final</span>
              <span className="text-3xl font-bold text-emerald-700">{activeNode.score}%</span>
            </div>
          )}
        </div>

        {/* ── Phase Stepper ───────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-md shadow-2xs mb-6 overflow-hidden">
          <div className="flex items-stretch">
            {isDntExempt && (
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border-r border-amber-200 text-xs font-mono text-amber-700 shrink-0">
                <span className="material-symbols-outlined text-sm">fast_forward</span>
                <span className="hidden sm:inline">Propósito + Conteúdo isentos pelo Motor DNT</span>
              </div>
            )}
            {visiblePhases.map((phase, idx) => {
              const isActive = activePhase === phase.id;
              const isDone = phaseCompleted.has(phase.id);
              const canAccess = canAdvanceToPhase(phase.id);

              return (
                <button
                  key={phase.id}
                  onClick={() => canAccess && setActivePhase(phase.id)}
                  disabled={!canAccess}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-3 text-sm font-semibold border-b-2 transition-all relative ${
                    isActive
                      ? 'border-blue-600 text-blue-700 bg-blue-50'
                      : isDone
                      ? 'border-emerald-500 text-emerald-600 bg-emerald-50/40 hover:bg-emerald-50'
                      : canAccess
                      ? 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                      : 'border-transparent text-slate-300 cursor-not-allowed'
                  }`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {/* Step number or check */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isDone
                      ? 'bg-emerald-500 text-white'
                      : canAccess
                      ? 'bg-slate-200 text-slate-600'
                      : 'bg-slate-100 text-slate-300'
                  }`}>
                    {isDone
                      ? <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                      : idx + 1
                    }
                  </div>
                  <span className="hidden sm:inline">{phase.label}</span>
                  {!canAccess && (
                    <span className="material-symbols-outlined text-xs text-slate-300">lock</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Phase Content Panel ─────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-md shadow-2xs p-5 md:p-6">
          {/* Phase label */}
          <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
            <span className="material-symbols-outlined text-base text-blue-600">
              {ALL_PHASES.find(p => p.id === activePhase)?.icon}
            </span>
            <h2 className="font-semibold text-slate-800 text-base">
              {ALL_PHASES.find(p => p.id === activePhase)?.label}
            </h2>
            {isDntExempt && activePhase === 'validacao' && (
              <span className="ml-auto text-[11px] font-mono text-amber-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">speed</span>
                Acesso direto — DNT ativo
              </span>
            )}
          </div>

          {/* Dynamic renderer */}
          {renderPhaseContent()}

          {/* Eval result feedback */}
          {evalResult && (
            <div className={`mt-5 p-4 rounded-md border text-sm shadow-2xs ${
              evalResult.includes('APROVAÇÃO') || evalResult.includes('Aprovação')
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-base mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {evalResult.includes('APROVAÇÃO') || evalResult.includes('Aprovação') ? 'check_circle' : 'warning'}
                </span>
                <p className="leading-relaxed">{evalResult}</p>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setCurrentView('trail')}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  Voltar à trilha
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Loading Overlay ─────────────────────────────────────────────── */}
        {isLoading && (
          <div className="fixed inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-slate-600">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Processando avaliação…</span>
            </div>
          </div>
        )}

      </main>
      <MobileNav />
    </div>
  );
};
