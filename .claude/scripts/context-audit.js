#!/usr/bin/env node
/**
 * context-audit.js — CostoBot
 * Audits the .claude/ context files to verify they are present and up-to-date.
 * Usage: node .claude/scripts/context-audit.js  OR  npm run context:audit
 * [GREENFIELD — defined by user]
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

const REQUIRED_FILES = [
  { file: '.claude/CLAUDE.md',                label: 'Master rules' },
  { file: 'PROJECT_CONTEXT.md',               label: 'Project context' },
  { file: 'ARCHITECTURE.md',                  label: 'Architecture ADRs' },
  { file: '.agente/docs/IMPLEMENTATION_ROADMAP.md', label: 'Implementation roadmap' },
  { file: '.claude/memory/architecture-rules.md', label: 'Architecture rules memory' },
  { file: '.claude/memory/corrections-log.md',    label: 'Corrections log' },
  { file: '.claude/memory/versioning-rules.md',   label: 'Versioning rules memory' },
  { file: '.env.example',                     label: '.env template' },
  { file: '.gitignore',                       label: '.gitignore' },
  { file: 'frontend/versionamiento.config.json', label: 'Versioning config' },
  { file: 'frontend/post-commit-version.js',  label: 'Post-commit hook script' },
  { file: 'backend/routes/version.routes.js', label: 'Version API route' },
  { file: 'backend/middleware/apiKey.middleware.js', label: 'API key middleware' },
];

const REQUIRED_DIRS = [
  '.agente/TODO/pendiente',
  '.agente/TODO/en_progreso',
  '.agente/TODO/completado',
  '.agente/core',
  '.agente/docs',
  '.agente/backups',
  '.claude/memory',
  '.claude/scripts',
  'frontend',
  'backend/routes',
  'backend/middleware',
  'database',
];

let passed = 0;
let failed = 0;

console.log('\n🔍 CostoBot — Context Audit\n');
console.log('─'.repeat(50));

// Check directories
console.log('\n📁 Directories:\n');
for (const dir of REQUIRED_DIRS) {
  const full = path.join(ROOT, dir);
  const exists = fs.existsSync(full);
  const icon = exists ? '✅' : '❌';
  console.log(`  ${icon}  ${dir}`);
  if (exists) passed++; else failed++;
}

// Check files
console.log('\n📄 Files:\n');
for (const { file, label } of REQUIRED_FILES) {
  const full = path.join(ROOT, file);
  const exists = fs.existsSync(full);
  const icon = exists ? '✅' : '❌';
  const size = exists ? `(${Math.ceil(fs.statSync(full).size / 1024)}KB)` : '';
  console.log(`  ${icon}  ${file.padEnd(45)} ${label} ${size}`);
  if (exists) passed++; else failed++;
}

// Check .git hook
const hookPath = path.join(ROOT, '.git', 'hooks', 'post-commit');
const hookInstalled = fs.existsSync(hookPath);
console.log(`\n🪝 Hook:\n`);
console.log(`  ${hookInstalled ? '✅' : '⚠️ '}  .git/hooks/post-commit ${hookInstalled ? '(installed)' : '(NOT installed — run: npm run version:setup-hooks)'}`);

// Check .env
const envExists = fs.existsSync(path.join(ROOT, '.env'));
console.log(`\n🔐 Security:\n`);
console.log(`  ${envExists ? '✅' : '❌'}  .env (${envExists ? 'present' : 'MISSING — copy .env.example and fill values'})`);

// Summary
console.log('\n' + '─'.repeat(50));
console.log(`\n📊 Result: ${passed + (hookInstalled ? 1 : 0)} OK, ${failed + (hookInstalled ? 0 : 1)} warnings\n`);

if (failed > 0) {
  console.log('⚠️  Some context files are missing. The agent may have incomplete information.\n');
  process.exit(1);
} else {
  console.log('✅ All context files present and accounted for.\n');
}
