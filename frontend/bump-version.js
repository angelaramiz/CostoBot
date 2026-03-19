#!/usr/bin/env node
/**
 * bump-version.js — CostoBot
 * Manual version bump CLI: patch / minor / major
 *
 * Usage:
 *   node bump-version.js patch "Fix login button"
 *   node bump-version.js minor "Add export feature"
 *   node bump-version.js major "Rewrite API"
 *
 * [GREENFIELD — defined by user]
 */
'use strict';

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PKG_PATH = path.join(__dirname, 'package.json');
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_KEY = process.env.INTERNAL_API_KEY || '';

const [,, bumpType, ...msgParts] = process.argv;
const message = msgParts.join(' ');

if (!['patch', 'minor', 'major'].includes(bumpType)) {
  console.error('❌ Usage: node bump-version.js <patch|minor|major> "message"');
  process.exit(1);
}

if (!fs.existsSync(PKG_PATH)) {
  console.error('❌ package.json not found in', __dirname);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
const [maj, min, pat] = pkg.version.split('.').map(Number);
const oldVersion = pkg.version;

const newVersion =
  bumpType === 'major' ? `${maj + 1}.0.0` :
  bumpType === 'minor' ? `${maj}.${min + 1}.0` :
                         `${maj}.${min}.${pat + 1}`;

pkg.version = newVersion;
fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n');

console.log(`\n✅ Version bumped: ${oldVersion} → ${newVersion}`);
console.log(`📝 Message: ${message || '(no message)'}`);

// Record in DB (non-blocking)
const payload = JSON.stringify({
  version: newVersion,
  previous_version: oldVersion,
  bump_type: bumpType,
  message: message || `${bumpType} bump`,
  date: new Date().toISOString(),
  project: 'CostoBot',
  author: process.env.GIT_AUTHOR_NAME || 'unknown',
});

const url = new URL(`${API_URL}/api/version/record`);
const mod = url.protocol === 'https:' ? require('https') : require('http');
const req = mod.request({
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    'Content-Length': Buffer.byteLength(payload),
  },
}, (res) => {
  if (res.statusCode < 300) {
    console.log('✅ Version recorded in database');
  } else {
    console.warn(`⚠️  DB record returned ${res.statusCode}`);
  }
});
req.on('error', (e) => console.warn('⚠️  Could not record in DB:', e.message));
req.write(payload);
req.end();

console.log(`\n🔧 Next steps:`);
console.log(`   git add frontend/package.json`);
console.log(`   git commit -m "📦 version: bump to ${newVersion}"`);
