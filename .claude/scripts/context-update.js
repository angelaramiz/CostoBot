#!/usr/bin/env node
/**
 * context-update.js — CostoBot
 * Updates the "Last updated" timestamp in CLAUDE.md.
 * Usage: node .claude/scripts/context-update.js  OR  npm run context:update
 * [GREENFIELD — defined by user]
 */
'use strict';

const fs = require('fs');
const path = require('path');

const CLAUDE_MD = path.join(__dirname, '..', 'CLAUDE.md');

if (!fs.existsSync(CLAUDE_MD)) {
  console.error('❌ .claude/CLAUDE.md not found.');
  process.exit(1);
}

let content = fs.readFileSync(CLAUDE_MD, 'utf8');

const today = new Date().toLocaleDateString('es-MX', {
  day: '2-digit', month: '2-digit', year: 'numeric',
}).replace(/\//g, '/');

// Update "Last updated" field
const updated = content.replace(
  /\*\*Last updated:\*\* .+/,
  `**Last updated:** ${today}`
);

if (updated === content) {
  console.log('ℹ️  No "Last updated" field found — adding it...');
  const withTimestamp = content.replace(
    '## 📋 Core Rules',
    `**Last updated:** ${today}\n\n## 📋 Core Rules`
  );
  fs.writeFileSync(CLAUDE_MD, withTimestamp, 'utf8');
} else {
  fs.writeFileSync(CLAUDE_MD, updated, 'utf8');
}

console.log(`✅ CLAUDE.md updated — Last updated: ${today}`);
