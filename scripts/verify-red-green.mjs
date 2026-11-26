#!/usr/bin/env node
/**
 * verify-red-green.mjs — Prova determinística de TDD (Red → Green).
 *
 * Roda os testes ATUAIS contra o código de produção da BASE (sem a sua mudança)
 * e contra o código atual:
 *   --expect red   (padrão; correção de bug / funcionalidade nova):
 *                  algum teste precisa FALHAR na base e todos PASSAR agora.
 *                  Prova que o teste de fato cobre a mudança.
 *   --expect green (refatoração): todos passam na base E agora — comportamento preservado.
 *
 * Uso:
 *   node scripts/verify-red-green.mjs                          # testes alterados vs HEAD
 *   node scripts/verify-red-green.mjs --tests tests/a.test.ts,tests/b.test.ts --base HEAD~1
 *   ... [--expect red|green] [--json]
 *
 * Mecânica: `git worktree` temporário na base, com o diretório tests/ e o
 * vitest.config.ts do working tree atual copiados por cima e node_modules por symlink.
 * Copiado do repo irmão gestor-de-obras. Ver .ai/WORKFLOW.md.
 */
import { execFileSync, spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const git = (args, cwd = rootDir) => execFileSync('git', args, { cwd, encoding: 'utf-8' });

/**
 * Reduz o relatório JSON do vitest a {suites: [{file, loadError}], tests: {fullName: status}}.
 * `loadError` = a suíte nem carregou (ex.: módulo/export ainda inexistente na base).
 */
export function summarize(report, root) {
  const suites = [];
  const tests = {};
  for (const suite of report?.testResults ?? []) {
    const file = path.relative(root, suite.name).split(path.sep).join('/');
    const loadError = suite.status === 'failed' && suite.assertionResults.length === 0
      ? String(suite.message || 'falha ao carregar a suíte').split('\n')[0].slice(0, 200)
      : null;
    suites.push({ file, loadError });
    for (const a of suite.assertionResults) tests[`${file} > ${a.fullName}`] = a.status;
  }
  return { suites, tests };
}

/**
 * Julga a transição base → head.
 * @returns {{verdict: 'RED_GREEN_OK'|'GREEN_GREEN_OK'|'NOT_RED'|'NOT_GREEN'|'REGRESSION'|'NO_TESTS', evidence: string[], problems: string[]}}
 */
export function judge({ base, head, expect = 'red' }) {
  const evidence = [];
  const problems = [];
  const headNames = Object.keys(head.tests);

  if (headNames.length === 0 && head.suites.every(s => !s.loadError)) {
    return { verdict: 'NO_TESTS', evidence, problems: ['nenhum teste executado'] };
  }

  for (const s of head.suites) if (s.loadError) problems.push(`${s.file}: não carrega no código atual — ${s.loadError}`);
  for (const [name, status] of Object.entries(head.tests)) {
    if (status === 'failed') problems.push(`${name}: falha no código atual`);
  }
  if (problems.length) return { verdict: 'NOT_GREEN', evidence, problems };

  if (expect === 'green') {
    for (const s of base.suites) if (s.loadError) problems.push(`${s.file}: não carrega na base — ${s.loadError}`);
    for (const [name, status] of Object.entries(base.tests)) {
      if (status === 'failed') problems.push(`${name}: já falhava/muda de comportamento na base`);
    }
    return problems.length
      ? { verdict: 'REGRESSION', evidence, problems }
      : { verdict: 'GREEN_GREEN_OK', evidence: [`${headNames.length} teste(s) verdes na base e no código atual`], problems };
  }

  for (const s of base.suites) {
    if (s.loadError) evidence.push(`${s.file}: RED na base (suíte não carrega — ${s.loadError}) → GREEN agora`);
  }
  for (const name of headNames) {
    if (base.tests[name] === 'failed') evidence.push(`${name}: RED na base → GREEN agora`);
  }
  return evidence.length
    ? { verdict: 'RED_GREEN_OK', evidence, problems }
    : { verdict: 'NOT_RED', evidence, problems: ['todos os testes já passavam sem a mudança — eles não provam a correção/funcionalidade'] };
}

function changedTestFiles(base) {
  const tracked = git(['diff', '--name-only', base, '--', 'tests']).split('\n');
  const untracked = git(['ls-files', '--others', '--exclude-standard', '--', 'tests']).split('\n');
  return [...new Set([...tracked, ...untracked])].filter(f => f.endsWith('.test.ts') && fs.existsSync(path.join(rootDir, f)));
}

function runVitest(cwd, files, outFile) {
  spawnSync('npx', ['vitest', 'run', ...files, '--reporter=json', `--outputFile=${outFile}`], {
    cwd, encoding: 'utf-8', stdio: 'ignore', env: { ...process.env, CI: '1' },
  });
  if (!fs.existsSync(outFile)) return { suites: files.map(f => ({ file: f, loadError: 'vitest não gerou relatório' })), tests: {} };
  return summarize(JSON.parse(fs.readFileSync(outFile, 'utf-8')), cwd);
}

export function verify({ base = 'HEAD', tests = null, expect = 'red' } = {}) {
  const files = tests ?? changedTestFiles(base);
  if (files.length === 0) return { verdict: 'NO_TESTS', base, expect, files, evidence: [], problems: ['nenhum arquivo de teste alterado em relação à base'] };

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'red-green-'));
  const wt = path.join(tmp, 'wt');
  try {
    git(['worktree', 'add', '--detach', '--quiet', wt, base]);
    fs.rmSync(path.join(wt, 'tests'), { recursive: true, force: true });
    fs.cpSync(path.join(rootDir, 'tests'), path.join(wt, 'tests'), { recursive: true });
    fs.copyFileSync(path.join(rootDir, 'vitest.config.ts'), path.join(wt, 'vitest.config.ts'));
    fs.rmSync(path.join(wt, 'node_modules'), { recursive: true, force: true }); // pode vir versionado como link
    fs.symlinkSync(path.join(rootDir, 'node_modules'), path.join(wt, 'node_modules'), 'dir');

    const baseResult = runVitest(wt, files, path.join(tmp, 'base.json'));
    const headResult = runVitest(rootDir, files, path.join(tmp, 'head.json'));
    return { base, expect, files, ...judge({ base: baseResult, head: headResult, expect }) };
  } finally {
    try { git(['worktree', 'remove', '--force', wt]); } catch { /* já removido */ }
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function main() {
  const args = process.argv.slice(2);
  const opt = name => { const i = args.indexOf(name); return i !== -1 ? args[i + 1] : undefined; };
  const expect = opt('--expect') ?? 'red';
  if (!['red', 'green'].includes(expect)) { console.error('--expect deve ser red ou green'); process.exit(2); }

  const result = verify({ base: opt('--base') ?? 'HEAD', tests: opt('--tests')?.split(',').filter(Boolean) ?? null, expect });
  const ok = result.verdict === 'RED_GREEN_OK' || result.verdict === 'GREEN_GREEN_OK';

  if (args.includes('--json')) {
    console.log(JSON.stringify({ gate: 'RED_GREEN', ...result, ok }, null, 2));
  } else {
    console.log(`\n🔴🟢 verify-red-green (base ${result.base}, esperado ${expect}): ${result.verdict}`);
    for (const e of result.evidence) console.log(`  ✅ ${e}`);
    for (const p of result.problems) console.log(`  ❌ ${p}`);
  }
  process.exit(ok ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
