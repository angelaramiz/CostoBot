#!/usr/bin/env node
/**
 * memory-import.js — CostoBot
 * Imports a memory JSON snapshot back into .claude/memory/.
 * Usage: node .claude/scripts/memory-import.js <path-to-snapshot.json>
 *        npm run memory:import contextoIA/memory-export-2026-01-01T12-00-00.json
 * [GREENFIELD — defined by user]
 */
'use strict';

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, '..', 'memory');
const snapshotPath = process.argv[2];

if (!snapshotPath) {
  console.error('Usage: npm run memory:import <path-to-snapshot.json>');
  process.exit(1);
}

const fullPath = path.resolve(process.cwd(), snapshotPath);
if (!fs.existsSync(fullPath)) {
  console.error(`❌ Snapshot file not found: ${fullPath}`);
  process.exit(1);
}

let snapshot;
try {
  snapshot = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
} catch (e) {
  console.error(`❌ Invalid JSON snapshot: ${e.message}`);
  process.exit(1);
}

if (!fs.existsSync(MEMORY_DIR)) {
  fs.mkdirSync(MEMORY_DIR, { recursive: true });
}

let count = 0;
for (const [filename, content] of Object.entries(snapshot)) {
  if (!filename.endsWith('.md')) continue;
  const dest = path.join(MEMORY_DIR, filename);
  fs.writeFileSync(dest, content, 'utf8');
  console.log(`  ✅ Restored: ${filename}`);
  count++;
}

console.log(`\n✅ Memory import complete — ${count} files restored to .claude/memory/`);
