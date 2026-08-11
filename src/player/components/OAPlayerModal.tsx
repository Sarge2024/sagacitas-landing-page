import React, { useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useCourseStore } from '../store/useCourseStore';

export const OAPlayerModal: React.FC = () => {
  const { activeNode, setCurrentView, submitScore, isLoading } = usePlayerStore();
  const { dntInstruction } = useCourseStore();

  const isDntExempt = activeNode?.is_exempt_by_dnt && activeNode?.state !== 'REMEDIATION';
  const isRemediation = activeNode?.state === 'REMEDIATION';

  const [simCommand, setSimCommand] = useState<string>('apply_transform(target_column="income")');
  const [simOutput, setSimOutput] = useState<string[]>([
    '> initialize_scaler(method="min-max")',
    '> dataset_loaded: 1,420 rows',
    '> status: ready for validation',
  ]);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(0);
  const [testScoreInput, setTestScoreInput] = useState<number>(85);
  const [evalResultMsg, setEvalResultMsg] = useState<string | null>(null);

  const handleRunCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simCommand.trim()) return;
    setSimOutput(prev => [
      ...prev,
      `> ${simCommand}`,
      `[OK] Standard deviation scaled to [0, 1]. Range verified!`,
    ]);
    setSimCommand('');
  };

  const handleFinalizeEvaluation = async (overrideScore?: number) => {
    const scoreToSubmit = overrideScore !== undefined ? overrideScore : testScoreInput;
    const res = await submitScore(scoreToSubmit);
    if (res) {
      setEvalResultMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/60 backdrop-blur-xs animate-fadeIn font-['Inter']">
      {/* Modal Container */}
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl border border-[#c0c7d6] flex flex-col h-[90vh] max-h-[850px] overflow-hidden relative">
        {/* Top Header */}
        <header className="border-b border-[#c0c7d6] p-4 flex justify-between items-center bg-[#f8f9ff]">
          <div className="flex items-center gap-3">
            <div className="bg-[#e5eeff] h-10 w-10 flex items-center justify-center rounded-lg text-[#005daa]">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                play_lesson
              </span>
            </div>
            <div>
              <h1 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#0b1c30]">
                {activeNode?.title || 'Técnicas de Normalização de Dados'}
              </h1>
              <p className="font-['JetBrains_Mono'] text-xs text-[#404753]">
                Passo 3 de 3 • Validação &amp; Motor DNT
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('trail')}
            className="text-[#404753] hover:text-[#ba1a1a] p-2 rounded-full hover:bg-[#ffdad6] transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </header>

        {/* DNT Logic / Progression Bar */}
        <div className="bg-[#eff4ff] border-b border-[#c0c7d6] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            {/* Step 1: Propósito */}
            <div className="flex items-center gap-2 relative group cursor-help">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isDntExempt
                  ? 'bg-[#d3e4fe] text-[#404753] opacity-60 border border-[#c0c7d6]'
                  : 'bg-[#005daa] text-white shadow-xs'
              }`}>
                {isDntExempt ? (
                  <span className="material-symbols-outlined text-xs">fast_forward</span>
                ) : (
                  '1'
                )}
              </div>
              <span className={`text-xs ${isDntExempt ? 'text-[#404753] line-through opacity-60' : 'text-[#005daa] font-bold'} hidden sm:inline`}>
                Propósito
              </span>
              {isDntExempt && (
                <div className="absolute top-full left-0 mt-1 w-max bg-[#213145] text-[#eaf1ff] font-mono text-[11px] px-2 py-1 rounded shadow hidden group-hover:block z-50">
                  Skipped: Exempt by DNT
                </div>
              )}
            </div>

            <div className={`w-6 h-px ${isDntExempt ? 'bg-[#c0c7d6] opacity-60' : 'bg-[#005daa]'}`} />

            {/* Step 2: Conteúdo */}
            <div className="flex items-center gap-2 relative group cursor-help">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isDntExempt
                  ? 'bg-[#d3e4fe] text-[#404753] opacity-60 border border-[#c0c7d6]'
                  : 'bg-[#005daa] text-white shadow-xs'
              }`}>
                {isDntExempt ? (
                  <span className="material-symbols-outlined text-xs">fast_forward</span>
                ) : (
                  '2'
                )}
              </div>
              <span className={`text-xs ${isDntExempt ? 'text-[#404753] line-through opacity-60' : 'text-[#005daa] font-bold'} hidden sm:inline`}>
                Conteúdo
              </span>
              {isDntExempt && (
                <div className="absolute top-full left-0 mt-1 w-max bg-[#213145] text-[#eaf1ff] font-mono text-[11px] px-2 py-1 rounded shadow hidden group-hover:block z-50">
                  Skipped: Exempt by DNT
                </div>
              )}
            </div>

            <div className="w-6 h-px bg-[#005daa]" />

            {/* Step 3: Validação */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#005daa] flex items-center justify-center text-white text-xs font-bold shadow-xs">
                3
              </div>
              <span className="text-xs font-bold text-[#005daa] hidden sm:inline">Validação</span>
            </div>
          </div>

          {/* DNT Status Flag Indicator */}
          {isDntExempt ? (
            <div className="flex items-center gap-1.5 bg-[#825100]/10 text-[#825100] px-3 py-1 rounded-full border border-[#ffddb8] text-xs font-['JetBrains_Mono'] font-medium">
              <span className="material-symbols-outlined text-base text-[#825100]">speed</span>
              <span>DNT Rota Acelerada Ativa</span>
            </div>
          ) : isRemediation ? (
            <div className="flex items-center gap-1.5 bg-[#ffdad6] text-[#ba1a1a] px-3 py-1 rounded-full border border-[#ba1a1a]/30 text-xs font-['JetBrains_Mono'] font-medium">
              <span className="material-symbols-outlined text-base text-[#ba1a1a]">warning</span>
              <span>Remediação DNT Ativa</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-[#e5eeff] text-[#005daa] px-3 py-1 rounded-full border border-[#a5c8ff] text-xs font-['JetBrains_Mono'] font-medium">
              <span className="material-symbols-outlined text-base text-[#005daa]">auto_awesome</span>
              <span>Trilha Completa Padrão</span>
            </div>
          )}
        </div>

        {/* Main Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#f8f9ff] flex flex-col gap-6">

          {/* Evaluation Engine Simulator Panel */}
          <div className="bg-white border-2 border-[#005daa] rounded-xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#005daa]" />
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-[#0075d5] text-white p-2 rounded-lg shrink-0">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  terminal
                </span>
              </div>
              <div>
                <h3 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#0b1c30]">
                  Data Normalization Simulator
                </h3>
                <p className="text-xs text-[#404753]">
                  Aplique o redimensionamento padrão ao conjunto de dados fornecido.
                </p>
              </div>
            </div>

            {/* Interactive Simulator Shell */}
            <div className="bg-[#0b1c30] text-emerald-400 rounded-lg p-4 font-['JetBrains_Mono'] text-xs shadow-inner">
              <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-2 text-gray-400">
                <span>Dataset_Raw.csv</span>
                <span className="material-symbols-outlined text-sm cursor-pointer hover:text-white">download</span>
              </div>
              <div className="text-amber-300 mb-2"># Expected Output Range: [0, 1]</div>

              {simOutput.map((out, idx) => (
                <div key={idx} className="leading-relaxed">{out}</div>
              ))}

              <form onSubmit={handleRunCommand} className="flex items-center mt-3 pt-2 border-t border-gray-800">
                <span className="text-[#0075d5] font-bold mr-2">&gt;</span>
                <input
                  type="text"
                  value={simCommand}
                  onChange={(e) => setSimCommand(e.target.value)}
                  placeholder="Digite um comando (ex: apply_transform)..."
                  className="bg-transparent border-none focus:outline-none w-full text-white placeholder-gray-600 font-mono text-xs"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-[#005daa] text-white rounded text-[11px] font-sans hover:bg-[#0075d5] transition-colors"
                >
                  Executar
                </button>
              </form>
            </div>
          </div>

          {/* Quiz / Knowledge Verification */}
          <div className="bg-white border border-[#c0c7d6] rounded-xl p-5 shadow-xs">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-[#e5eeff] text-[#005daa] p-2 rounded-lg shrink-0">
                <span className="material-symbols-outlined text-xl">quiz</span>
              </div>
              <div>
                <h3 className="font-['Hanken_Grotesk'] text-lg font-bold text-[#0b1c30]">
                  Verificação de Conhecimento
                </h3>
                <p className="text-xs text-[#404753]">Questões finais de validação para cálculo de nota.</p>
              </div>
            </div>

            <div className="space-y-3 font-['Inter'] text-sm">
              <button
                onClick={() => setSelectedQuizOption(0)}
                className={`w-full border rounded-lg p-3 text-left flex items-center gap-3 transition-colors ${
                  selectedQuizOption === 0
                    ? 'border-[#005daa] bg-[#e5eeff]/50 font-medium text-[#005daa]'
                    : 'border-[#c0c7d6] hover:bg-[#eff4ff]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedQuizOption === 0 ? 'border-[#005daa] bg-[#005daa]' : 'border-[#707785]'
                  }`}
                >
                  {selectedQuizOption === 0 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span>Min-Max Scaling</span>
              </button>

              <button
                onClick={() => setSelectedQuizOption(1)}
                className={`w-full border rounded-lg p-3 text-left flex items-center gap-3 transition-colors ${
                  selectedQuizOption === 1
                    ? 'border-[#005daa] bg-[#e5eeff]/50 font-medium text-[#005daa]'
                    : 'border-[#c0c7d6] hover:bg-[#eff4ff]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedQuizOption === 1 ? 'border-[#005daa] bg-[#005daa]' : 'border-[#707785]'
                  }`}
                >
                  {selectedQuizOption === 1 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span>Z-Score Standardization</span>
              </button>
            </div>
          </div>

          {/* Validation Engine Driver Tester (DNT Test Panel) */}
          <div className="bg-[#d3e4fe]/40 border border-[#a5c8ff] rounded-xl p-4 text-xs font-mono">
            <div className="font-bold text-[#004785] flex items-center gap-2 mb-2 text-sm">
              <span className="material-symbols-outlined text-base">psychology</span>
              Testar Motor de Validação DNT (ValidationEngineService)
            </div>
            <p className="text-[#404753] mb-3 leading-relaxed">
              Submeta uma nota para testar o algoritmo DNT: Nota &ge; 70% aprova e conclui o OA; Nota &lt; 70% reprova, ativa <strong>REMEDIAÇÃO</strong> e revoga a isenção DNT!
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-[#c0c7d6]">
                <label className="text-[#0b1c30]">Nota (0-100%):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={testScoreInput}
                  onChange={(e) => setTestScoreInput(Number(e.target.value))}
                  className="w-16 p-1 border border-[#c0c7d6] rounded text-center font-bold text-[#005daa]"
                />
              </div>

              <button
                onClick={() => handleFinalizeEvaluation(85)}
                disabled={isLoading}
                className="px-3 py-1.5 bg-[#006c49] text-white rounded font-sans font-medium hover:bg-[#006c49]/90 transition-colors flex items-center gap-1 shadow-xs"
              >
                <span>Aprovar (&ge;70%)</span>
              </button>

              <button
                onClick={() => handleFinalizeEvaluation(55)}
                disabled={isLoading}
                className="px-3 py-1.5 bg-[#ba1a1a] text-white rounded font-sans font-medium hover:bg-[#ba1a1a]/90 transition-colors flex items-center gap-1 shadow-xs"
              >
                <span>Reprovar (&lt;70%) - Revogar DNT</span>
              </button>
            </div>

            {evalResultMsg && (
              <div className="mt-3 p-3 bg-white border rounded text-xs font-sans text-[#0b1c30] shadow-xs">
                {evalResultMsg}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <footer className="border-t border-[#c0c7d6] p-4 bg-[#f8f9ff] flex flex-wrap justify-between items-center gap-3 mt-auto">
          <button
            onClick={() => setCurrentView('trail')}
            className="px-6 py-2 border border-[#005daa] text-[#005daa] rounded-md font-['JetBrains_Mono'] text-xs font-semibold hover:bg-[#eff4ff] transition-colors"
          >
            Anterior
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentView('trail')}
              className="px-6 py-2 bg-[#dce9ff] text-[#404753] rounded-md font-['JetBrains_Mono'] text-xs font-semibold hover:bg-[#c0c7d6] transition-colors"
            >
              Próximo
            </button>
            <button
              onClick={() => handleFinalizeEvaluation()}
              disabled={isLoading}
              className="px-6 py-2 bg-[#006c49] text-white rounded-md font-['JetBrains_Mono'] text-xs font-semibold hover:bg-[#006c49]/90 transition-colors flex items-center gap-2 shadow-xs"
            >
              <span className="material-symbols-outlined text-base">check_circle</span>
              Finalizar
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
