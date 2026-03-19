#!/usr/bin/env node
/**
 * bump-version-advanced.js — CostoBot
 * Advanced version bump: Git tags + pre-validation + CHANGELOG + database record.
 *
 * Usage:
 *   node bump-version-advanced.js patch "Fix login button"
 *   node bump-version-advanced.js minor "Add export feature" --skip-validation
 *
 * [GREENFIELD — defined by user]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PKG_PATH = path.join(__dirname, 'package.json');
const CHANGELOG_PATH = path.join(__dirname, 'CHANGELOG.md');
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_KEY = process.env.INTERNAL_API_KEY || '';

const args = process.argv.slice(2);
const bumpType = args[0];
const message = args.filter(a => !a.startsWith('--')).slice(1).join(' ');
const skipValidation = args.includes('--skip-validation');

if (!['patch', 'minor', 'major'].includes(bumpType)) {
  console.error('❌ Usage: node bump-version-advanced.js <patch|minor|major> "message" [--skip-validation]');
  process.exit(1);
}

// --- Pre-validation ---
if (!skipValidation) {
  console.log('🔍 Running pre-bump validation...');
  try {
    const preValidate = path.join(__dirname, 'pre-bump-validation.js');
    if (fs.existsSync(preValidate)) {
      execFileSync(process.execPath, [preValidate], { stdio: 'inherit' });
    }
  } catch {
    console.error('❌ Pre-bump validation failed. Fix issues or use --skip-validation.');
    process.exit(1);
  }
}

// --- Bump version ---
const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
const [maj, min, pat] = pkg.version.split('.').map(Number);
const oldVersion = pkg.version;

const newVersion =
  bumpType === 'major' ? `${maj + 1}.0.0` :
  bumpType === 'minor' ? `${maj}.${min + 1}.0` :
                         `${maj}.${min}.${pat + 1}`;

pkg.version = newVersion;
fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n');
console.log(`✅ ${oldVersion} → ${newVersion}`);

// --- Update CHANGELOG ---
const date = new Date().toISOString().split('T')[0];
const changeEntry = `\n## [${newVersion}] — ${date}\n\n### ${bumpType.charAt(0).toUpperCase() + bumpType.slice(1)}\n- ${message || 'Version bump'}\n`;

if (fs.existsSync(CHANGELOG_PATH)) {
  const existing = fs.readFileSync(CHANGELOG_PATH, 'utf8');
  const insertAt = existing.indexOf('\n## [');
  if (insertAt >= 0) {
    fs.writeFileSync(CHANGELOG_PATH, existing.slice(0, insertAt) + changeEntry + existing.slice(insertAt));
  } else {
    fs.appendFileSync(CHANGELOG_PATH, changeEntry);
  }
} else {
  fs.writeFileSync(CHANGELOG_PATH, `# Changelog — CostoBot\n${changeEntry}`);
}
console.log('✅ CHANGELOG.md updated');

// --- Create Git tag ---
try {
  execSync(`git add frontend/package.json frontend/CHANGELOG.md`, { stdio: 'inherit' });
  execSync(`git commit -m "📦 version: bump to ${newVersion} — ${message || bumpType}"`, { stdio: 'inherit' });
  execSync(`git tag -a "v${newVersion}" -m "${message || newVersion}"`, { stdio: 'inherit' });
  console.log(`✅ Git tag v${newVersion} created`);
} catch (e) {
  console.warn('⚠️  Git operations failed:', e.message);
}

// --- Record in DB ---
const payload = JSON.stringify({
  version: newVersion,
  previous_version: oldVersion,
  bump_type: bumpType,
  message: message || `${bumpType} bump`,
  date: new Date().toISOString(),
  project: 'CostoBot',
  author: process.env.GIT_AUTHOR_NAME || 'unknown',
  git_tag: `v${newVersion}`,
});

const url = new URL(`${API_URL}/api/version/record`);
const mod = url.protocol === 'https:' ? require('https') : require('http');
const req = mod.request({
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY, 'Content-Length': Buffer.byteLength(payload) },
}, (res) => console.log(res.statusCode < 300 ? '✅ Recorded in DB' : `⚠️ DB ${res.statusCode}`));
req.on('error', (e) => console.warn('⚠️ DB error:', e.message));
req.write(payload); req.end();

console.log(`\n🎉 Done! CostoBot is now v${newVersion}`);
