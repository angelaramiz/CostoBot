#!/usr/bin/env node
/**
 * rules-list.js — CostoBot
 * Prints all ALWAYS and NEVER rules from CLAUDE.md.
 * Usage: node .claude/scripts/rules-list.js  OR  npm run rules:list
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

const content = fs.readFileSync(CLAUDE_MD, 'utf8');
const lines = content.split('\n');

let section = null;
const alwayRules = [];
const neverRules = [];

for (const line of lines) {
  if (line.startsWith('### ✅ ALWAYS')) { section = 'always'; continue; }
  if (line.startsWith('### ❌ NEVER'))  { section = 'never';  continue; }
  if (line.startsWith('##'))            { section = null;    continue; }

  if (section === 'always' && line.startsWith('- ')) alwayRules.push(line.slice(2));
  if (section === 'never'  && line.startsWith('- ')) neverRules.push(line.slice(2));
}

console.log('\n📋 CostoBot — Agent Rules (CLAUDE.md)\n');
console.log('─'.repeat(60));

console.log('\n✅ ALWAYS DO:\n');
if (alwayRules.length === 0) console.log('   (none found)');
alwayRules.forEach((r, i) => console.log(`  ${String(i + 1).padStart(2)}. ${r}`));

console.log('\n❌ NEVER DO:\n');
if (neverRules.length === 0) console.log('   (none found)');
neverRules.forEach((r, i) => console.log(`  ${String(i + 1).padStart(2)}. ${r}`));

console.log('\n' + '─'.repeat(60));
console.log(`\n📊 Total: ${alwayRules.length} ALWAYS + ${neverRules.length} NEVER = ${alwayRules.length + neverRules.length} rules\n`);
console.log('💡 Add a rule:  npm run rules:add "description"');
console.log('💡 Add a NEVER: npm run rules:add "description" --never\n');
