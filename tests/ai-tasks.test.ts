import { describe, it, expect } from 'vitest';
import { parseTask, setFields, pendingFor, checkTransition } from '../scripts/ai-tasks.mjs';

const TASK = `---
id: 2026-11-26_exemplo
status: planejada
executor: gemini
revisor: claude
tipo: funcionalidade
base:
---

# Exemplo

Corpo da tarefa.
`;

describe('parseTask', () => {
  it('lê os campos do cabeçalho', () => {
    const t = parseTask(TASK);
    expect(t.id).toBe('2026-11-26_exemplo');
    expect(t.status).toBe('planejada');
    expect(t.executor).toBe('gemini');
    expect(t.revisor).toBe('claude');
    expect(t.tipo).toBe('funcionalidade');
    expect(t.base).toBe('');
  });

  it('recusa arquivo sem cabeçalho', () => {
    expect(() => parseTask('# sem cabeçalho')).toThrow(/cabeçalho/);
  });
});

describe('setFields', () => {
  it('altera campos do cabeçalho e preserva o corpo', () => {
    const out = setFields(TASK, { status: 'em_execucao', base: 'abc123' });
    const t = parseTask(out);
    expect(t.status).toBe('em_execucao');
    expect(t.base).toBe('abc123');
    expect(out).toContain('# Exemplo\n\nCorpo da tarefa.');
  });
});

describe('pendingFor', () => {
  const tasks = [
    { id: 'a', status: 'planejada', executor: 'gemini', revisor: 'claude' },
    { id: 'b', status: 'aguardando_revisao', executor: 'gemini', revisor: 'claude' },
    { id: 'c', status: 'reprovada', executor: 'gemini', revisor: 'claude' },
    { id: 'd', status: 'aprovada', executor: 'gemini', revisor: 'claude' },
    { id: 'e', status: 'em_execucao', executor: 'gemini', revisor: 'claude' },
  ];

  it('executor vê tarefas planejadas, reprovadas e em execução', () => {
    expect(pendingFor('gemini', tasks).map((t: { id: string }) => t.id)).toEqual(['a', 'c', 'e']);
  });

  it('revisor vê só as que aguardam revisão', () => {
    expect(pendingFor('claude', tasks).map((t: { id: string }) => t.id)).toEqual(['b']);
  });
});

describe('checkTransition', () => {
  const task = { status: 'planejada', executor: 'gemini', revisor: 'claude' };

  it('executor inicia uma tarefa planejada', () => {
    expect(checkTransition({ ...task }, 'em_execucao', 'gemini')).toEqual({ ok: true });
  });

  it('revisor não pode executar', () => {
    const r = checkTransition({ ...task }, 'em_execucao', 'claude');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/executor/);
  });

  it('executor não pode aprovar o próprio trabalho', () => {
    const r = checkTransition({ ...task, status: 'aguardando_revisao' }, 'aprovada', 'gemini');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/revisor/);
  });

  it('revisor aprova ou reprova o que aguarda revisão', () => {
    expect(checkTransition({ ...task, status: 'aguardando_revisao' }, 'aprovada', 'claude')).toEqual({ ok: true });
    expect(checkTransition({ ...task, status: 'aguardando_revisao' }, 'reprovada', 'claude')).toEqual({ ok: true });
  });

  it('não pula etapas', () => {
    const r = checkTransition({ ...task }, 'aguardando_revisao', 'gemini');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/planejada → aguardando_revisao/);
  });

  it('tarefa reprovada volta para execução', () => {
    expect(checkTransition({ ...task, status: 'reprovada' }, 'em_execucao', 'gemini')).toEqual({ ok: true });
  });
});
