import React, { useState } from 'react';
import { MergedNodeProgress } from '../../types';

interface QuizRendererProps {
  node: MergedNodeProgress;
  onComplete: (score: number) => void;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

const DEFAULT_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'Qual das afirmativas melhor descreve o conceito central desta unidade?',
    options: [
      'Opção A: Definição conceitual básica do tema.',
      'Opção B: Abordagem prática e aplicada ao contexto real.',
      'Opção C: Teoria avançada sobre modelos de referência.',
      'Opção D: Implementação de algoritmos de otimização.',
    ],
    correctIndex: 1,
  },
  {
    id: 'q2',
    question: 'Em qual cenário a abordagem estudada seria MAIS eficiente?',
    options: [
      'Cenário A: Conjuntos de dados não estruturados.',
      'Cenário B: Ambientes de alta disponibilidade com SLA crítico.',
      'Cenário C: Pequenos volumes de dados com processamento local.',
      'Cenário D: Fluxos de trabalho com alto grau de paralelização.',
    ],
    correctIndex: 3,
  },
  {
    id: 'q3',
    question: 'Qual é o principal benefício da técnica apresentada no conteúdo?',
    options: [
      'Redução de custo operacional em 40%.',
      'Aumento da escalabilidade horizontal do sistema.',
      'Melhoria na precisão e reprodutibilidade dos resultados.',
      'Eliminação de dependências externas.',
    ],
    correctIndex: 2,
  },
];

export const QuizRenderer: React.FC<QuizRendererProps> = ({ node, onComplete }) => {
  const questions: QuizQuestion[] = node.quiz_questions?.map((q, i) => ({
    id: q.id,
    question: q.question,
    options: q.options,
    correctIndex: q.correctIndex,
  })) ?? DEFAULT_QUESTIONS;

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const selected = answers[questions[currentQ]?.id] ?? null;
  const totalAnswered = Object.values(answers).filter(v => v !== null).length;

  const handleSelect = (optionIndex: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questions[currentQ].id]: optionIndex }));
  };

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctIndex) correct++;
    });
    const finalScore = Math.round((correct / questions.length) * 100);
    setScore(finalScore);
    setSubmitted(true);
  };

  if (submitted && score !== null) {
    const passed = score >= 70;
    return (
      <div className="flex flex-col gap-5">
        <div className={`rounded-md p-6 text-center border shadow-2xs ${passed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <span
            className={`material-symbols-outlined text-6xl mb-3 block ${passed ? 'text-emerald-600' : 'text-red-500'}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {passed ? 'check_circle' : 'cancel'}
          </span>
          <h3 className={`text-2xl font-bold mb-1 ${passed ? 'text-emerald-700' : 'text-red-700'}`}>
            {passed ? 'Parabéns! Aprovado!' : 'Reprovado — Tente Novamente'}
          </h3>
          <p className={`text-4xl font-bold my-3 ${passed ? 'text-emerald-600' : 'text-red-600'}`}>
            {score}%
          </p>
          <p className="text-sm text-slate-600">
            {passed
              ? `Você acertou ${Object.values(answers).filter((v, i) => v === questions[i]?.correctIndex).length} de ${questions.length} questões.`
              : `Nota mínima para aprovação: 70%. Revise o conteúdo e tente novamente.`}
          </p>
        </div>
        {/* Review */}
        <div className="flex flex-col gap-3">
          {questions.map((q, qi) => {
            const userAnswer = answers[q.id];
            const isCorrect = userAnswer === q.correctIndex;
            return (
              <div key={q.id} className={`bg-white border rounded-md p-4 shadow-2xs ${isCorrect ? 'border-emerald-300' : 'border-red-300'}`}>
                <p className="text-sm font-medium text-slate-800 mb-2">{qi + 1}. {q.question}</p>
                <p className={`text-xs ${isCorrect ? 'text-emerald-600' : 'text-red-600'} flex items-center gap-1`}>
                  <span className="material-symbols-outlined text-sm">{isCorrect ? 'check' : 'close'}</span>
                  {isCorrect ? 'Correto' : `Sua resposta: ${q.options[userAnswer ?? 0]} — Correta: ${q.options[q.correctIndex]}`}
                </p>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => onComplete(score)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-2xs"
          >
            <span className="material-symbols-outlined text-base">arrow_forward</span>
            {passed ? 'Confirmar e continuar' : 'Registrar resultado'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header Progress */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600">quiz</span>
          <span className="text-sm font-semibold text-slate-800">
            Questão {currentQ + 1} de {questions.length}
          </span>
        </div>
        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === currentQ
                  ? 'bg-blue-600'
                  : answers[questions[i]?.id] !== undefined
                  ? 'bg-slate-400'
                  : 'bg-slate-200'
              }`}
              aria-label={`Ir para questão ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white border border-slate-200 rounded-md p-5 shadow-2xs">
        <p className="text-base font-semibold text-slate-800 mb-4 leading-snug">
          {currentQ + 1}. {questions[currentQ]?.question}
        </p>
        <div className="flex flex-col gap-2.5">
          {questions[currentQ]?.options.map((opt, oi) => (
            <button
              key={oi}
              onClick={() => handleSelect(oi)}
              className={`w-full text-left border rounded-md p-3.5 text-sm flex items-center gap-3 transition-all ${
                selected === oi
                  ? 'border-blue-500 bg-blue-50 font-medium text-blue-700'
                  : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                selected === oi ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
              }`}>
                {selected === oi && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
          disabled={currentQ === 0}
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-md text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Anterior
        </button>

        {currentQ < questions.length - 1 ? (
          <button
            onClick={() => setCurrentQ(q => q + 1)}
            disabled={selected === null}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
          >
            Próxima
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={totalAnswered < questions.length}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-md text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
          >
            <span className="material-symbols-outlined text-base">check_circle</span>
            Enviar respostas
          </button>
        )}
      </div>
    </div>
  );
};
