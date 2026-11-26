#!/usr/bin/env node
// Protocolo de handoff entre agentes de IA (Claude, Gemini, outros) via .ai/sync/.
// Adaptado do mesmo protocolo usado no repo irmão `gestor-de-obras` (Works Manager).
// Ver .ai/sync/README.md para o formato. Uso:
//   node scripts/ai-sync.mjs status --agent claude
//   node scripts/ai-sync.mjs write --agent claude --summary "..." --scope a.ts,b.ts [--ref .ai/history/x.md]
//   node scripts/ai-sync.mjs task --agent gemini --id <id> --to em_execucao|aguardando_revisao|aprovada|reprovada [--summary "..."]
// Fluxo de tarefas (Claude planeja e revisa, Gemini executa): ver .ai/WORKFLOW.md.

import fs from 'fs';
import path from 'path';
import { execFileSync, spawnSync } from 'child_process';
import { parseTask, setFields, pendingFor, checkTransition, loadTasks, TASKS_DIR } from './ai-tasks.mjs';

const ROOT = process.cwd();
const SYNC_DIR = path.join(ROOT, '.ai', 'sync');
const LOG_FILE = path.join(SYNC_DIR, 'LOG.jsonl');
const STATE_FILE = path.join(SYNC_DIR, 'STATE.json');
const CURSORS_DIR = path.join(SYNC_DIR, 'cursors');

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n');
}

function countLines(file) {
  if (!fs.existsSync(file)) return 0;
  const content = fs.readFileSync(file, 'utf-8');
  const trimmed = content.replace(/\n$/, '');
  if (trimmed === '') return 0;
  return trimmed.split('\n').length;
}

function cursorFile(agent) {
  return path.join(CURSORS_DIR, `${agent}.json`);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      args[key] = val;
    } else {
      args._.push(a);
    }
  }
  return args;
}

function cmdStatus(args) {
  const agent = args.agent;
  if (!agent) {
    console.error('Uso: node scripts/ai-sync.mjs status --agent <nome>');
    process.exit(1);
  }
  const state = readJson(STATE_FILE, { last_seq: 0, last_ts: null, last_agent: null });
  const cursor = readJson(cursorFile(agent), { last_seq_read: 0 });
  const pending_tasks = pendingFor(agent, loadTasks()).map(t => ({ id: t.id, status: t.status, file: t.file }));

  if (cursor.last_seq_read >= state.last_seq) {
    console.log(JSON.stringify({ upToDate: true, last_seq: state.last_seq, pending_tasks }));
    return;
  }

  const lines = fs.existsSync(LOG_FILE)
    ? fs.readFileSync(LOG_FILE, 'utf-8').replace(/\n$/, '').split('\n')
    : [];
  const delta = lines.slice(cursor.last_seq_read); // seq é 1-indexado == nº da linha

  console.log(JSON.stringify({ upToDate: false, from_seq: cursor.last_seq_read + 1, to_seq: state.last_seq, entries: delta.map(l => JSON.parse(l)), pending_tasks }, null, 2));

  writeJson(cursorFile(agent), { last_seq_read: state.last_seq, updated_at: new Date().toISOString() });
}

function appendEntry({ agent, scope, summary, ref, task, kind }) {
  const seq = countLines(LOG_FILE) + 1;
  const ts = new Date().toISOString();
  const entry = {
    seq,
    ts,
    agent,
    scope: scope.split(',').map(s => s.trim()).filter(Boolean),
    summary,
    ...(ref ? { ref } : {}),
    ...(task ? { task } : {}),
    ...(kind ? { kind } : {}),
  };

  fs.mkdirSync(SYNC_DIR, { recursive: true });
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
  writeJson(STATE_FILE, { last_seq: seq, last_ts: ts, last_agent: agent });
  writeJson(cursorFile(agent), { last_seq_read: seq, updated_at: ts });
  return seq;
}

function cmdWrite(args) {
  const { agent, summary, scope, ref } = args;
  if (!agent || !summary || !scope) {
    console.error('Uso: node scripts/ai-sync.mjs write --agent <nome> --summary "<texto>" --scope a.ts,b.ts [--ref path]');
    process.exit(1);
  }
  const seq = appendEntry({ agent, scope, summary, ref });
  console.log(JSON.stringify({ ok: true, seq }));
}

// Gates automáticos: lint + suíte inteira verde + prova Red→Green contra a base da tarefa.
function runGates(task) {
  const steps = [
    ['npm', ['run', 'lint']],
    ['npx', ['vitest', 'run']],
    ['node', ['scripts/verify-red-green.mjs', '--base', task.base, '--expect', task.tipo === 'refatoracao' ? 'green' : 'red']],
  ];
  for (const [cmd, argv] of steps) {
    const r = spawnSync(cmd, argv, { cwd: ROOT, encoding: 'utf-8' });
    if (r.status !== 0) {
      return { ok: false, step: `${cmd} ${argv.join(' ')}`, output: (r.stdout + r.stderr).trim().split('\n').slice(-25).join('\n') };
    }
  }
  return { ok: true };
}

function cmdTask(args) {
  const { agent, id, to, summary } = args;
  if (!agent || !id || !to) {
    console.error('Uso: node scripts/ai-sync.mjs task --agent <nome> --id <id> --to <status> [--summary "..."]');
    process.exit(1);
  }
  const file = path.join(TASKS_DIR, `${id}.md`);
  if (!fs.existsSync(file)) {
    console.error(`Tarefa não encontrada: ${path.relative(ROOT, file)}`);
    process.exit(1);
  }
  let text = fs.readFileSync(file, 'utf-8');
  const task = parseTask(text);
  const check = checkTransition(task, to, agent);
  if (!check.ok) {
    console.error(JSON.stringify({ ok: false, error: check.error }));
    process.exit(1);
  }

  const changes = { status: to };
  if (to === 'em_execucao' && !task.base) {
    // a base fixa o código "antes" da tarefa, usada na prova Red→Green
    changes.base = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf-8' }).trim();
  }
  if (to === 'aguardando_revisao' || to === 'aprovada') {
    const gates = runGates(task);
    if (!gates.ok) {
      console.error(JSON.stringify({ ok: false, error: `gate falhou: ${gates.step}`, output: gates.output }, null, 2));
      process.exit(1);
    }
  }

  text = setFields(text, changes);
  fs.writeFileSync(file, text);
  const seq = appendEntry({
    agent,
    scope: path.relative(ROOT, file),
    summary: summary || `Tarefa ${id}: ${task.status} → ${to}`,
    task: id,
    kind: to,
  });
  console.log(JSON.stringify({ ok: true, seq, task: id, status: to, ...(changes.base ? { base: changes.base } : {}) }));
}

const [cmd, ...rest] = process.argv.slice(2);
const args = parseArgs(rest);

if (cmd === 'status') cmdStatus(args);
else if (cmd === 'write') cmdWrite(args);
else if (cmd === 'task') cmdTask(args);
else {
  console.error('Comando desconhecido. Use "status", "write" ou "task". Ver .ai/sync/README.md e .ai/WORKFLOW.md');
  process.exit(1);
}
