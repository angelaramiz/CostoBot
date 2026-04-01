# 📝 Corrections & Learning Log — CostoBot

> Auto-updated after each user correction. Do NOT edit manually.
> Add rules manually with: `npm run rules:add "description"`

## Format
---
[YYYY-MM-DD HH:MM] Category: [TypeScript/Architecture/Security/DB/Testing/Convention/Other]
Task: what the agent was doing
Error: what the agent did wrong
Fix: how it should be done
Rule: one-line rule learned
Updated: .claude/CLAUDE.md > {{section}}
---

## History

### [2026-03-26 14:30] Security: Frontend picomatch ReDoS
**Task:** Scanning dependencies for vulnerabilities  
**Error:** 2 HIGH severity CVEs detected in picomatch (GHSA-c2c7-rcm5-vvqj, GHSA-3v7f-55p6-f55p)  
**Fix:** Ran `npm audit fix` to upgrade jest/tinyglobby transitive dependencies  
**Rule:** Run `npm audit` monthly in both frontend/ and backend/; schedule CVE fixes in security sprint  
**Updated:** security-audit.md § "CVE & Vulnerability Log"  
**Commit:** `99a5292` (🔒 sec prefix)

---

### [2026-03-26 10:15] Architecture: Agent code in services/ folder
**Task:** Creating task management modules  
**Error:** Built TaskExecutor and task types in `services/task-management/` (wrong location)  
**Fix:** Moved to `.agente/task-management/` — agent code MUST NOT go in app folders  
**Rule:** Ask: "Will only the agent run this?" → YES = `.agente/[domain]/`; NO = `services/`  
**Updated:** CLAUDE.md § "🏗️ Folder Structure"; agent-structure-rules.md in user-memory  
**Reference:** ONLY FOR AGENT comment added to task-types.ts, task-executor.ts

---

### [2026-03-20 16:45] Defensive Validation: Layer3.products undefined crash
**Task:** Loading BusinessProject from backend  
**Error:** Frontend crash: "e.layers.layer3.products is not iterable"  
**Fix:** Added `Array.isArray()` check before all iterations; normalized on load in project.store.ts  
**Rule:** ALWAYS validate arrays BEFORE iterating: `Array.isArray(data) ? data : []`  
**Updated:** defensive-validation-patterns.md in user-memory; project.store.ts; cascade-engine.ts  
**Pattern:** See user-memory § "defensive-validation-patterns.md"

---

### [2026-03-19 09:00] TypeScript: Using 'any' type in cascade engine
**Task:** Implementing dependency graph resolution  
**Error:** Cascade engine had multiple `any` types, missing ProductGraph type safety  
**Fix:** Defined ProductGraph interface, added strict type guards  
**Rule:** NEVER use `any`; always define interfaces from schema in types/  
**Updated:** CLAUDE.md § "Core Rules > ✅ ALWAYS do"

---

## Format Reference

Each entry follows this pattern:

```
[YYYY-MM-DD HH:MM] Category: [TypeScript | Architecture | Security | DB | Testing | Convention | Other]
Task: what the agent was doing (one line)
Error: what went wrong (be specific)
Fix: the solution applied
Rule: one-line rule to prevent recurrence
Updated: file path and section modified
[Optional] Commit: Git commit hash if applicable
```

Use this format when adding new corrections via `npm run rules:add "description"`
