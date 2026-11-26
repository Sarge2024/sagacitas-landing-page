// Tarefas de handoff entre agentes (.ai/tasks/*.md) — ver .ai/WORKFLOW.md.
// Cada tarefa é um Markdown com cabeçalho `chave: valor` entre linhas `---`.
// Ciclo: planejada → em_execucao → aguardando_revisao → aprovada | reprovada → em_execucao ...

import fs from 'fs';
import path from 'path';

export const TASKS_DIR = path.join(process.cwd(), '.ai', 'tasks');

// transição → papel que pode fazê-la
const TRANSITIONS = {
  'planejada>em_execucao': 'executor',
  'reprovada>em_execucao': 'executor',
  'em_execucao>aguardando_revisao': 'executor',
  'aguardando_revisao>aprovada': 'revisor',
  'aguardando_revisao>reprovada': 'revisor',
};

const PENDING = {
  executor: ['planejada', 'reprovada', 'em_execucao'],
  revisor: ['aguardando_revisao'],
};

const HEADER = /^---\n([\s\S]*?)\n---\n/;

export function parseTask(text) {
  const m = text.match(HEADER);
  if (!m) throw new Error('tarefa sem cabeçalho (bloco --- chave: valor --- no topo do arquivo)');
  const fields = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) fields[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return fields;
}

export function setFields(text, changes) {
  const m = text.match(HEADER);
  if (!m) throw new Error('tarefa sem cabeçalho');
  const pending = { ...changes };
  const lines = m[1].split('\n').map(line => {
    const key = line.slice(0, line.indexOf(':')).trim();
    if (key in pending) {
      const v = pending[key];
      delete pending[key];
      return `${key}: ${v}`;
    }
    return line;
  });
  for (const [k, v] of Object.entries(pending)) lines.push(`${k}: ${v}`);
  return `---\n${lines.join('\n')}\n---\n` + text.slice(m[0].length);
}

export function pendingFor(agent, tasks) {
  return tasks.filter(t =>
    (t.executor === agent && PENDING.executor.includes(t.status)) ||
    (t.revisor === agent && PENDING.revisor.includes(t.status)));
}

export function checkTransition(task, to, agent) {
  const role = TRANSITIONS[`${task.status}>${to}`];
  if (!role) return { ok: false, error: `transição inválida: ${task.status} → ${to}` };
  if (task[role] !== agent) return { ok: false, error: `só o ${role} da tarefa (${task[role]}) pode fazer ${task.status} → ${to}` };
  return { ok: true };
}

export function loadTasks(dir = TASKS_DIR) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md') && !f.startsWith('_') && f !== 'README.md')
    .sort()
    .map(f => ({ ...parseTask(fs.readFileSync(path.join(dir, f), 'utf-8')), file: path.join('.ai', 'tasks', f) }));
}
