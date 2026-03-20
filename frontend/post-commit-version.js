#!/usr/bin/env node
/**
 * post-commit-version.js — CostoBot (AUTONOMOUS mode)
 *
 * Called automatically by .git/hooks/post-commit after every commit.
 * Reads the last commit message and recognizes emoji prefixes:
 *
 *   🐛 fix: / fix:    → PATCH  (1.2.3 → 1.2.4)
 *   ✨ feat: / feature: → MINOR (1.2.3 → 1.3.0)
 *   💥 BREAKING        → MAJOR  (1.2.3 → 2.0.0)
 *   Other              → skipped (commit stays local, no push)
 *
 * On recognized prefix: asks user to confirm, then bumps version,
 * updates DB, creates tag, and auto-pushes.
 *
 * [GREENFIELD — defined by user]
 */
'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PKG_PATH = path.join(__dirname, 'package.json');
const RELEASE_NOTES_PATH = path.join(__dirname, 'RELEASE_NOTES.md');
const CONFIG_PATH = path.join(__dirname, 'versionamiento.config.json');
const API_URL = process.env.VERSION_RECORD_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_KEY = process.env.INTERNAL_API_KEY || '';
const GIT_TOKEN = process.env.GIT_PAT_TOKEN || '';

// --- Read last commit message ---
let commitMsg = '';
try {
  commitMsg = execSync('git log -1 --format="%s"').toString().trim();
} catch {
  process.exit(0);
}

// --- Detect prefix ---
const PATCH_RE = /^(🐛|:bug:)\s*(fix|fix:)/i;
const MINOR_RE = /^(✨|:sparkles:)\s*(feat|feat:|feature:)/i;
const MAJOR_RE = /^(💥|:boom:)\s*BREAKING/i;

let bumpType = null;
if (MAJOR_RE.test(commitMsg)) bumpType = 'major';
else if (MINOR_RE.test(commitMsg)) bumpType = 'minor';
else if (PATCH_RE.test(commitMsg)) bumpType = 'patch';

if (!bumpType) {
  // Not a recognized prefix — skip silently
  process.exit(0);
}

// --- Calculate new version ---
const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
const [maj, min, pat] = pkg.version.split('.').map(Number);
const oldVersion = pkg.version;
const newVersion =
  bumpType === 'major' ? `${maj + 1}.0.0` :
  bumpType === 'minor' ? `${maj}.${min + 1}.0` :
                         `${maj}.${min}.${pat + 1}`;

// --- Ask user for confirmation ---
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log(`\n🤖 CostoBot AUTONOMOUS Versioning`);
console.log(`   Prefijo detectado: ${bumpType.toUpperCase()} (${commitMsg})`);
console.log(`   Versión actual: v${oldVersion}`);
console.log(`   Nueva versión:  v${newVersion}\n`);

rl.question(`¿Versionar y pushear a v${newVersion}? (s/n): `, async (answer) => {
  rl.close();

  if (answer.toLowerCase() !== 's' && answer.toLowerCase() !== 'si') {
    console.log('⏸️  Versioning skipped. Commit stays local.');
    process.exit(0);
  }

  try {
    // 1. Bump package.json
    pkg.version = newVersion;
    fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n');

    // 2. Update RELEASE_NOTES.md (overwrites each version)
    const date = new Date().toISOString().split('T')[0];
    const notes = `# 🚀 Release Notes — CostoBot v${newVersion}\n\n**Fecha:** ${date}\n**Tipo:** ${bumpType}\n\n## Cambios en esta versión\n\n- ${commitMsg}\n\n---\n*Generado automáticamente por AUTONOMOUS versioning hook*\n`;
    fs.writeFileSync(RELEASE_NOTES_PATH, notes);

    // 3. Commit the version files
    execSync('git add frontend/package.json frontend/RELEASE_NOTES.md', { stdio: 'inherit' });
    execSync(`git commit -m "📦 version: bump to v${newVersion}"`, { stdio: 'inherit' });
    console.log(`✅ package.json & RELEASE_NOTES.md updated`);

    // 4. Create Git tag
    execSync(`git tag -a "v${newVersion}" -m "v${newVersion}: ${commitMsg}"`, { stdio: 'inherit' });
    console.log(`✅ Tag v${newVersion} created`);

    // 5. Push with tag
    let config = {};
    try { config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); } catch {}
    const branch = config.branch || 'main';
    const repoUrl = GIT_TOKEN
      ? `https://${GIT_TOKEN}@github.com/angelaramiz/CostoBot.git`
      : (config.repoUrl || 'origin');

    execSync(`git push ${repoUrl} ${branch}`, { stdio: 'inherit' });
    execSync(`git push ${repoUrl} "v${newVersion}"`, { stdio: 'inherit' });
    console.log(`✅ Pushed to ${branch} with tag v${newVersion}`);

    // 6. Record in DB (non-blocking)
    const payload = JSON.stringify({
      version: newVersion,
      previous_version: oldVersion,
      bump_type: bumpType,
      message: commitMsg,
      date: new Date().toISOString(),
      project: 'CostoBot',
      git_tag: `v${newVersion}`,
      branch,
    });

    const url = new URL(`${API_URL}/api/version/record`);
    const mod = url.protocol === 'https:' ? require('https') : require('http');
    const req = mod.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY, 'Content-Length': Buffer.byteLength(payload) },
    }, () => console.log('✅ Version recorded in database'));
    req.on('error', (e) => console.warn('⚠️ DB record failed (non-critical):', e.message));
    req.write(payload); req.end();

    console.log(`\n🎉 CostoBot es ahora v${newVersion}`);

  } catch (e) {
    console.error('\n❌ Versioning failed:', e.message);
    process.exit(1);
  }
});
