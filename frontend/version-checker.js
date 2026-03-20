/**
 * version-checker.js — CostoBot
 * Checks /api/version on page load — throttled 12h per route.
 * Shows an update banner if a newer version is available.
 *
 * Usage (in Next.js root layout or _app):
 *   import { checkVersion } from '../version-checker';
 *   useEffect(() => { checkVersion(window.location.pathname); }, []);
 *
 * [GREENFIELD — defined by user]
 */
'use strict';

const VERSION_CHECK_KEY = 'costobot_version_checks';
const THROTTLE_HOURS = 12;
const API_URL = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:3001';
const API_KEY = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_PUBLIC_API_KEY) || '';

function getStoredChecks() {
  try { return JSON.parse(localStorage.getItem(VERSION_CHECK_KEY) || '{}'); }
  catch { return {}; }
}

function shouldCheck(route) {
  const checks = getStoredChecks();
  const hoursSince = (Date.now() - (checks[route] || 0)) / 3600000;
  return hoursSince >= THROTTLE_HOURS;
}

function markChecked(route) {
  const checks = getStoredChecks();
  checks[route] = Date.now();
  localStorage.setItem(VERSION_CHECK_KEY, JSON.stringify(checks));
}

async function fetchRemoteVersion() {
  const res = await fetch(`${API_URL}/api/version`, {
    headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function getClientVersion() {
  return (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_VERSION) || '0.1.0';
}

function isNewerVersion(current, remote) {
  const parse = (v) => v.replace(/^v/, '').split('.').map(Number);
  const [cMaj, cMin, cPat] = parse(current);
  const [rMaj, rMin, rPat] = parse(remote);
  if (rMaj !== cMaj) return rMaj > cMaj;
  if (rMin !== cMin) return rMin > cMin;
  return rPat > cPat;
}

function showUpdateBanner(remoteVersion) {
  if (document.getElementById('costobot-update-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'costobot-update-banner';
  banner.style.cssText = [
    'position:fixed;top:0;left:0;right:0;z-index:9999',
    'background:#1a73e8;color:#fff;padding:12px 16px',
    'display:flex;align-items:center;justify-content:space-between',
    'font-family:sans-serif;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,.2)',
  ].join(';');
  banner.innerHTML = `
    <span>🚀 Nueva versión disponible (${remoteVersion}). Recarga para actualizar.</span>
    <div>
      <button onclick="window.location.reload()" style="margin-right:8px;padding:6px 12px;background:#fff;color:#1a73e8;border:none;border-radius:4px;cursor:pointer;font-weight:600;">Actualizar</button>
      <button onclick="document.getElementById('costobot-update-banner').remove()" style="padding:6px 12px;background:transparent;color:#fff;border:1px solid #fff;border-radius:4px;cursor:pointer;">Después</button>
    </div>`;
  document.body.prepend(banner);
}

async function checkVersion(route = '/') {
  if (typeof window === 'undefined') return; // SSR guard
  if (!shouldCheck(route)) return;
  try {
    const { version: remote } = await fetchRemoteVersion();
    const client = getClientVersion();
    markChecked(route);
    if (isNewerVersion(client, remote)) {
      console.info(`[CostoBot] Nueva versión: ${remote} (tienes ${client})`);
      showUpdateBanner(remote);
    }
  } catch (err) {
    console.warn('[CostoBot] Version check failed (non-critical):', err.message);
  }
}

function clearVersionCache() {
  localStorage.removeItem(VERSION_CHECK_KEY);
  console.info('[CostoBot] Version cache cleared');
}

module.exports = { checkVersion, clearVersionCache, getClientVersion };
