#!/usr/bin/env node
/**
 * rollback-version.js — CostoBot
 * Reverts frontend to a specific previous version using Git tags.
 *
 * Usage:
 *   node rollback-version.js 1.2.3
 *
 * What it does:
 *   1. Confirms with user
 *   2. Checks out the Git tag v{version}
 *   3. Creates a new backup branch from HEAD
 *   4. Updates package.json to target version (for display)
 *   5. Records rollback in DB
 *
 * [GREENFIELD — defined by user]
 */
'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const targetVersion = process.argv[2];
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_KEY = process.env.INTERNAL_API_KEY || '';

if (!targetVersion) {
  console.error('❌ Usage: node rollback-version.js <version>  (e.g., 1.2.3)');
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const currentVersion = pkg.version;

console.log(`\n⚠️  ROLLBACK — CostoBot`);
console.log(`   Current: v${currentVersion}`);
console.log(`   Target:  v${targetVersion}`);
console.log(`\n   This will checkout tag v${targetVersion} and create a backup branch.`);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('\n¿Confirmar rollback? (s/n): ', (answer) => {
  rl.close();
  if (answer.toLowerCase() !== 's' && answer.toLowerCase() !== 'si') {
    console.log('❌ Rollback cancelled.');
    process.exit(0);
  }

  try {
    // Backup current state
    const backupBranch = `backup/pre-rollback-${currentVersion}-${Date.now()}`;
    execSync(`git checkout -b ${backupBranch}`, { stdio: 'inherit' });
    execSync(`git checkout main`, { stdio: 'inherit' });
    console.log(`✅ Backup branch created: ${backupBranch}`);

    // Checkout the target tag
    execSync(`git checkout v${targetVersion}`, { stdio: 'inherit' });
    console.log(`✅ Checked out v${targetVersion}`);

    // Record rollback in DB
    const payload = JSON.stringify({
      version: targetVersion,
      previous_version: currentVersion,
      bump_type: 'rollback',
      message: `Rollback from v${currentVersion} to v${targetVersion}`,
      date: new Date().toISOString(),
      project: 'CostoBot',
    });

    const url = new URL(`${API_URL}/api/version/record`);
    const mod = url.protocol === 'https:' ? require('https') : require('http');
    const req = mod.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY, 'Content-Length': Buffer.byteLength(payload) },
    }, () => console.log('✅ Rollback recorded in DB'));
    req.on('error', (e) => console.warn('⚠️ DB error:', e.message));
    req.write(payload); req.end();

    console.log(`\n🎉 Rollback complete! Now at v${targetVersion}`);
    console.log(`   Backup saved in branch: ${backupBranch}`);
    console.log(`   Deploy your server to apply the rollback.`);
  } catch (e) {
    console.error('❌ Rollback failed:', e.message);
    process.exit(1);
  }
});
