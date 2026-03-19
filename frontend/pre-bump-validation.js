#!/usr/bin/env node
/**
 * pre-bump-validation.js — CostoBot
 * Validates state before a version bump:
 *   ✅ No uncommitted changes
 *   ✅ Tests pass (if npm test exists)
 *   ✅ On correct branch (main)
 *   ✅ package.json is valid JSON
 *
 * Exit code 0 = OK to proceed, 1 = block the bump.
 * [GREENFIELD — defined by user]
 */
'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let errors = 0;

function check(label, fn) {
  try {
    fn();
    console.log(`  ✅ ${label}`);
  } catch (e) {
    console.error(`  ❌ ${label}: ${e.message}`);
    errors++;
  }
}

console.log('\n🔍 Pre-bump validation — CostoBot\n');

check('No uncommitted changes', () => {
  const status = execSync('git status --porcelain').toString().trim();
  if (status) throw new Error(`Uncommitted changes found:\n${status}`);
});

check('On main branch', () => {
  const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  if (branch !== 'main') throw new Error(`Expected main, got ${branch}`);
});

check('package.json is valid', () => {
  const pkgPath = path.join(__dirname, 'package.json');
  if (!fs.existsSync(pkgPath)) throw new Error('package.json not found');
  JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
});

check('Tests pass', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  if (!pkg.scripts || !pkg.scripts.test) {
    console.log('     (no test script — skipping)');
    return;
  }
  execSync('npm test --passWithNoTests', { stdio: 'pipe' });
});

console.log('');

if (errors > 0) {
  console.error(`❌ ${errors} validation error(s). Fix them before bumping.\n`);
  process.exit(1);
} else {
  console.log('✅ All checks passed. Safe to bump.\n');
}
