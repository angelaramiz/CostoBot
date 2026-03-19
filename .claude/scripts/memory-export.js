#!/usr/bin/env node
/**
 * memory-export.js — CostoBot
 * Exports all .claude/memory/ files into a single timestamped JSON snapshot.
 * Usage: node .claude/scripts/memory-export.js  OR  npm run memory:export
 * [GREENFIELD — defined by user]
 */
'use strict';

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, '..', 'memory');
const EXPORT_DIR = path.join(__dirname, '..', '..', 'contextoIA');

if (!fs.existsSync(MEMORY_DIR)) {
  console.error('❌ .claude/memory/ directory not found.');
  process.exit(1);
}

const files = fs.readdirSync(MEMORY_DIR).filter(f => f.endsWith('.md'));
if (files.length === 0) {
  console.log('ℹ️  No memory files found in .claude/memory/');
  process.exit(0);
}

const snapshot = {};
for (const file of files) {
  const content = fs.readFileSync(path.join(MEMORY_DIR, file), 'utf8');
  snapshot[file] = content;
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outName = `memory-export-${timestamp}.json`;

// Export to contextoIA/ (which is in .gitignore) or current dir if not present
const outDir = fs.existsSync(EXPORT_DIR) ? EXPORT_DIR : __dirname;
const outPath = path.join(outDir, outName);

fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2), 'utf8');
console.log(`✅ Memory exported: ${outPath}`);
console.log(`   Files included: ${files.join(', ')}`);
