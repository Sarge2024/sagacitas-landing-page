import React, { useState } from 'react';
import { MergedNodeProgress } from '../../types';

interface SimulatorRendererProps {
  node: MergedNodeProgress;
  onComplete: (score: number) => void;
}

const INITIAL_LINES = [
  '> ambiente_inicializado(dataset="raw_data.csv")',
  '> linhas_carregadas: 1.420 | colunas: 12',
  '> aguardando_instrucoes...',
];

const COMMAND_RESPONSES: Record<string, string[]> = {
  help: ['Comandos disponíveis: help, analisar(), normalizar(), validar(), limpar()'],
  'analisar()': ['> [OK] Distribuição analisada. Outliers detectados: 3%', '> Sugestão: normalizar(metodo="z-score")'],
  'normalizar()': ['> [OK] Normalização concluída. Range: [0, 1]', '> Precisão estimada: +14.3%'],
  'validar()': ['> [PASS] Validação concluída com êxito!', '> Score de qualidade: 94/100', '> Próximo passo: finalizar()'],
  'limpar()': ['> [OK] Cache limpo. Dataset restaurado ao estado original.'],
  'finalizar()': ['> [CONCLUÍDO] Simulação finalizada com sucesso!', '> Resultado registrado para avaliação DNT.'],
};

export const SimulatorRenderer: React.FC<SimulatorRendererProps> = ({ node, onComplete }) => {
  const [lines, setLines] = useState<string[]>(INITIAL_LINES);
  const [input, setInput] = useState('');
  const [completed, setCompleted] = useState(false);
  const [scoreReady, setScoreReady] = useState(false);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;

    const responses = COMMAND_RESPONSES[cmd.toLowerCase()] ?? [`> [ERRO] Comando desconhecido: "${cmd}". Digite "help" para ver os comandos disponíveis.`];

    setLines(prev => [...prev, `> ${cmd}`, ...responses]);
    setInput('');

    if (cmd.toLowerCase() === 'validar()' || cmd.toLowerCase() === 'finalizar()') {
      setScoreReady(true);
    }
    if (cmd.toLowerCase() === 'finalizar()') {
      setCompleted(true);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Info Header */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs flex items-start gap-3">
        <div className="bg-slate-800 text-emerald-400 p-2 rounded-md shrink-0">
          <span className="material-symbols-outlined text-xl">terminal</span>
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 text-sm mb-0.5">{node.title}</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {node.description || 'Utilize o terminal interativo para executar os comandos e completar a simulação. Digite "help" para ver os comandos disponíveis.'}
          </p>
        </div>
      </div>

      {/* Interactive Terminal */}
      <div className="bg-slate-900 text-emerald-400 rounded-md overflow-hidden shadow-md font-mono text-xs">
        {/* Terminal Header Bar */}
        <div className="bg-slate-800 px-4 py-2 flex items-center gap-2 border-b border-slate-700">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="ml-3 text-slate-400 text-[11px]">simulator — {node.id || 'oa_simulator'}</span>
        </div>

        {/* Output Area */}
        <div className="p-4 max-h-64 overflow-y-auto flex flex-col gap-0.5">
          {lines.map((line, i) => (
            <div
              key={i}
              className={`leading-relaxed ${
                line.startsWith('> [OK]') || line.startsWith('> [PASS]') || line.startsWith('> [CONCLUÍDO]')
                  ? 'text-emerald-300'
                  : line.startsWith('> [ERRO]')
                  ? 'text-red-400'
                  : line.startsWith('> Sugestão') || line.startsWith('> Próximo')
                  ? 'text-amber-300'
                  : 'text-emerald-400'
              }`}
            >
              {line}
            </div>
          ))}
          {completed && (
            <div className="text-emerald-200 font-bold mt-2">
              ✓ Simulação encerrada — aguardando confirmação.
            </div>
          )}
        </div>

        {/* Command Input */}
        <form onSubmit={handleCommand} className="flex items-center border-t border-slate-700 px-4 py-2">
          <span className="text-blue-400 font-bold mr-2 select-none">{'>'}</span>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder='Digite um comando (ex: analisar(), validar())...'
            disabled={completed}
            className="flex-1 bg-transparent text-emerald-300 placeholder-slate-600 focus:outline-none text-xs"
          />
          <button
            type="submit"
            disabled={completed || !input.trim()}
            className="ml-2 px-3 py-1 bg-blue-600 text-white rounded text-[11px] hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Executar
          </button>
        </form>
      </div>

      {/* Hint Panel */}
      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-800 flex items-start gap-2 shadow-2xs">
        <span className="material-symbols-outlined text-base text-amber-600 shrink-0 mt-0.5">lightbulb</span>
        <span>
          <strong>Dica:</strong> Execute <code className="bg-amber-100 px-1 rounded font-mono">analisar()</code> → <code className="bg-amber-100 px-1 rounded font-mono">normalizar()</code> → <code className="bg-amber-100 px-1 rounded font-mono">validar()</code> → <code className="bg-amber-100 px-1 rounded font-mono">finalizar()</code> para concluir a simulação.
        </span>
      </div>

      {/* Complete Button */}
      <div className="flex justify-end">
        <button
          onClick={() => onComplete(scoreReady ? 90 : 50)}
          disabled={!scoreReady}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold transition-all shadow-2xs ${
            scoreReady
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span className="material-symbols-outlined text-base">check_circle</span>
          {scoreReady ? 'Finalizar e registrar resultado' : 'Execute "validar()" para liberar'}
        </button>
      </div>
    </div>
  );
};
