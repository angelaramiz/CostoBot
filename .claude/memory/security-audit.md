# 🔐 Security Audit & CVE Tracking — CostoBot

> Registro centralizado de auditorías de seguridad, vulnerabilidades y rotaciones de API keys.

## API Key Rotation Schedule

| Service | Rotation Date | Next Due | Status | Notes |
|---------|---------------|----------|--------|-------|
| OPENROUTER_API_KEY | 19/03/2026 | 19/09/2026 | ⏳ Pending | 6-month rotation |
| PUBLIC_API_KEY | 19/03/2026 | 19/09/2026 | ⏳ Pending | Version endpoint |
| INTERNAL_API_KEY | 19/03/2026 | 19/09/2026 | ⏳ Pending | Backend-only |
| FIREBASE_APIKEY | 19/03/2026 | 19/09/2026 | ⏳ Pending | Project config |

---

## CVE & Vulnerability Log

### 🟢 FIXED

#### Frontend: picomatch ReDoS Vulnerability (2026-03-26)
| Field | Value |
|-------|-------|
| **CVE IDs** | GHSA-c2c7-rcm5-vvqj, GHSA-3v7f-55p6-f55p |
| **Package** | picomatch (indirect via jest/tinyglobby) |
| **Severity** | 🔴 HIGH |
| **Date Discovered** | 2026-03-26 |
| **Date Fixed** | 2026-03-26 |
| **Commit** | `99a5292` (branch: main) |
| **Method** | `npm audit fix` |
| **Result** | ✅ 0 vulnerabilities post-fix |
| **Action** | Rendered, auto-deployed to Render |

**Details:**
- POSIX injection risk in glob pattern matching
- Potential ReDos (Regular Expression Denial of Service) attack
- Fixed by upgrading jest dependencies
- No breaking changes required

---

### 🟡 PENDING

#### Backend: Firebase Admin SDK Chain (Low Priority)
| Field | Value |
|-------|-------|
| **Package** | Firebase Admin SDK + dependencies |
| **Severity** | 🟡 LOW (8 instances) |
| **Date Discovered** | 2026-03-26 |
| **Status** | ⏳ Review Required |
| **Fix Method** | `npm audit fix --force` (BREAKING) |
| **Recommendation** | Plan for security sprint next month |
| **Notes** | Requires Major version bump; defer to next cycle |

**Details:**
- 8 x LOW severity advisories in transitive dependencies
- Would require force upgrade (potentially breaking changes)
- Backend is not exposed to internet directly (protected by auth)
- Risk level: LOW in current deployment

---

## Security Checks

### 🔍 Last Full Audit
- **Date:** 2026-03-26
- **Scope:** Frontend package.json, Backend package.json
- **Tool:** `npm audit` (npm v8+)
- **Result:** Frontend ✅ PASS (0 vulnerabilities), Backend ⚠️ 8 LOW (deferred)

### 📅 Next Scheduled Audit
- **Date:** 2026-04-26 (monthly)
- **Scope:** Full dependency tree + bundled code
- **Action:** Run `npm audit` in both frontend/ and backend/

---

## CORS & Network Security

| Layer | Config | Status |
|-------|--------|--------|
| **Frontend CORS** | localhost:3000 + Render domain | ✅ Active |
| **API Rate Limiting** | 100 req/15min (general), 5 req/min (version) | ✅ Active |
| **Firebase Auth** | JWT token validation on all backend routes | ✅ Active |
| **API Key Header** | Required on all `/api/` endpoints | ✅ Active |

---

## Infrastructure Security

### Database (MongoDB Atlas)
- ✅ IP whitelist enabled
- ✅ Connection string in .env (never in code)
- ✅ Backup automated daily

### Firebase
- ✅ Service account key in .env
- ✅ Environment-specific credentials
- ✅ No hardcoded keys in repo

### Rendering (Render.com)
- ✅ Environment variables configured
- ✅ Auto-deploy from main branch
- ✅ HTTPS enforced

---

## Maintenance Tasks

- [ ] Review Firebase SDK deprecations before 2026-06-26
- [ ] Rotate API keys on 2026-09-19
- [ ] Run full security audit on 2026-04-26
- [ ] Update dependencies monthly
- [ ] Test security headers (CSP, X-Frame-Options, etc.) quarterly

---

## References
- CLAUDE.md § "🔐 Security"
- SECURITY_CONFIG.md (root)
- `.env.example` (never commit secrets)
