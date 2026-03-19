#!/usr/bin/env node
/**
 * rules-add.js — CostoBot
 * Appends a new rule to the ALWAYS or NEVER section of CLAUDE.md.
 * Usage: node .claude/scripts/rules-add.js "descripción de la regla"
 *        npm run rules:add "Always validate IA response with Zod before using"
 *        npm run rules:add "NEVER skip cascade update after layer change" --never
 * [GREENFIELD — defined by user]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CLAUDE_MD = path.join(__dirname, '..', 'CLAUDE.md');

const args = process.argv.slice(2);
const isNever = args.includes('--never');
const ruleText = args.filter(a => !a.startsWith('--')).join(' ').trim();

if (!ruleText) {
  console.error('Usage: npm run rules:add "rule description" [--never]');
  console.error('  Default: adds to ALWAYS section');
  console.error('  --never: adds to NEVER section');
  process.exit(1);
}

if (!fs.existsSync(CLAUDE_MD)) {
  console.error('❌ .claude/CLAUDE.md not found.');
  process.exit(1);
}

let content = fs.readFileSync(CLAUDE_MD, 'utf8');

const section = isNever ? '### ❌ NEVER do:' : '### ✅ ALWAYS do:';
const newRule = `- ${ruleText}`;

const idx = content.indexOf(section);
if (idx === -1) {
  console.error(`❌ Could not find section "${section}" in CLAUDE.md`);
  process.exit(1);
}

// Find end of section (next ### or ##)
const afterSection = content.indexOf('\n###', idx + section.length);
const insertAt = afterSection === -1 ? content.length : afterSection;

content = content.slice(0, insertAt).trimEnd() + '\n' + newRule + '\n' + content.slice(insertAt);
fs.writeFileSync(CLAUDE_MD, content, 'utf8');

const sectionLabel = isNever ? 'NEVER' : 'ALWAYS';
console.log(`✅ Rule added to ${sectionLabel} section:\n   ${newRule}`);
