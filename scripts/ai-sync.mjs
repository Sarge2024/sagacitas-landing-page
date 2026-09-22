#!/usr/bin/env node
// Protocolo de handoff entre agentes de IA (Claude, Gemini, outros) via .ai/sync/.
// Adaptado do mesmo protocolo usado no repo irmão `gestor-de-obras` (Works Manager).
// Ver .ai/sync/README.md para o formato. Uso:
//   node scripts/ai-sync.mjs status --agent claude
//   node scripts/ai-sync.mjs write --agent claude --summary "..." --scope a.ts,b.ts [--ref .ai/history/x.md]

import fs from 'fs';
import path from 'path';

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

  if (cursor.last_seq_read >= state.last_seq) {
    console.log(JSON.stringify({ upToDate: true, last_seq: state.last_seq }));
    return;
  }

  const lines = fs.existsSync(LOG_FILE)
    ? fs.readFileSync(LOG_FILE, 'utf-8').replace(/\n$/, '').split('\n')
    : [];
  const delta = lines.slice(cursor.last_seq_read); // seq é 1-indexado == nº da linha

  console.log(JSON.stringify({ upToDate: false, from_seq: cursor.last_seq_read + 1, to_seq: state.last_seq, entries: delta.map(l => JSON.parse(l)) }, null, 2));

  writeJson(cursorFile(agent), { last_seq_read: state.last_seq, updated_at: new Date().toISOString() });
}

function cmdWrite(args) {
  const { agent, summary, scope, ref } = args;
  if (!agent || !summary || !scope) {
    console.error('Uso: node scripts/ai-sync.mjs write --agent <nome> --summary "<texto>" --scope a.ts,b.ts [--ref path]');
    process.exit(1);
  }
  const seq = countLines(LOG_FILE) + 1;
  const ts = new Date().toISOString();
  const entry = {
    seq,
    ts,
    agent,
    scope: scope.split(',').map(s => s.trim()).filter(Boolean),
    summary,
    ...(ref ? { ref } : {}),
  };

  fs.mkdirSync(SYNC_DIR, { recursive: true });
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
  writeJson(STATE_FILE, { last_seq: seq, last_ts: ts, last_agent: agent });
  writeJson(cursorFile(agent), { last_seq_read: seq, updated_at: ts });

  console.log(JSON.stringify({ ok: true, seq }));
}

const [cmd, ...rest] = process.argv.slice(2);
const args = parseArgs(rest);

if (cmd === 'status') cmdStatus(args);
else if (cmd === 'write') cmdWrite(args);
else {
  console.error('Comando desconhecido. Use "status" ou "write". Ver .ai/sync/README.md');
  process.exit(1);
}
