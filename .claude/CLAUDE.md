# CLAUDE.md — CostoBot
> Master rules for AI agents working on this project.
> Read this file BEFORE generating any code.
> Updated automatically after each user correction.

## 🎯 Project Context
**Name:** CostoBot SaaS
**Stack:** Next.js 14+ (App Router) + TypeScript | Node.js + Express | MongoDB Atlas | Firebase Auth | OpenRouter/LMStudio/Ollama IA
**Architecture:** Mode A (Separated frontend/backend); Greenfield project; AUTONOMOUS versioning (post-commit hook)
**Language:** TypeScript (strict mode)
**Last updated:** 19/03/2026

**Last updated:** 19/03/2026

## 📋 Core Rules

### ✅ ALWAYS do:
- TypeScript strict mode — no `any`, always define interfaces/types from the schema
- Use Zustand for local state with reactivity and multi-sheet JSON handling
- Validate all data with Zod schemas — especially multi-layer business project structures
- Motor de dependencias: always build the dependency graph when loading a project
- Actualización en cascada: after ANY change on layer 1-3, trigger cascade recalculation (propagateChange)
- IA adapter pattern: support OpenRouter, LM Studio, and Ollama — switch via config
- All async operations must use try/catch and proper error handling
- Sync frontend-to-backend debounced every 5 seconds for auto-save
- Export/import via SheetJS (XLSX multi-sheet) and JSON
- Test critical functions: auth, cascade engine, calculations, schema validation
- Commit with emoji prefixes for AUTONOMOUS hook: 🐛 fix, ✨ feat, 💥 BREAKING
- Never hardcode API keys — always use .env variables
- **Defensive validation on data load**: Normalize ALL collections (layer1, layer2 ProductGraph.nodes/edges, layer3.products) on load from backend — backend serialization can produce `undefined` instead of arrays. Use `Array.isArray()` pattern before any iteration/access.
- **Defensive iteration**: Before iterating/mapping/filtering over arrays, validate with `Array.isArray()` or fallback to empty array: `for (const x of Array.isArray(data) ? data : [])`

### ❌ NEVER do:
- Store API keys in source files or .claude/ folder
- Modify Zod schema without testing backward compatibility
- Cascade updates without validating the dependency graph
- Direct DOM manipulation — use React components only
- Ignore merge conflicts in dependency graph resolution
- Hardcode CORS domains — use environment variables
- Skip validation of IA responses (always validate with Zod)
- Mix local Zustand updates with backend sync without debouncing
- Deploy without running full test suite
- Use console.log in production — use structured logging

## 🏗️ Folder Structure (GREENFIELD)
```
CostoBot/
├── contextoIA/          (project docs — added to .gitignore)
├── .claude/             (context files — COMMITTED)
│   ├── CLAUDE.md       (this file)
│   ├── memory/
│   │   ├── architecture-rules.md
│   │   ├── corrections-log.md
│   │   └── versioning-rules.md
├── .agente/            (task system — added to .gitignore)
├── frontend/           (Next.js app — PRIMARY versioning target)
├── backend/            (Node.js server — in this workspace for dev)
├── .env                (secrets — NEVER commit)
├── .env.example        (template for .env — COMMIT THIS)
├── .gitignore
├── IMPLEMENTATION_ROADMAP.md
├── PROJECT_CONTEXT.md
├── ARCHITECTURE.md
├── VERSIONING_MAINTENANCE_GUIDE.md
└── AGENT_COMMANDS.md
```

## 🎨 Code Conventions

### Naming:
- Components: **PascalCase** (Layer1InsumoSheet.tsx, Layer4PreciosSheet.tsx)
- Utilities/Functions: **camelCase** (calculateLayer1Totals, propagateChanges)
- Types/Interfaces: **PascalCase** (BusinessProject, DependencyGraph, CascadeUpdateRules)
- Files: **kebab-case-for-utilities** or **PascalCase for React** (my-util.ts vs MyComponent.tsx)
- Constants: **UPPER_SNAKE_CASE** (MAX_SHEETS_PER_LAYER, API_TIMEOUT_MS)

### Imports:
- External libraries first, then internal imports from @/
- Absolute imports via tsconfig path alias: `@/components`, `@/lib`, `@/types`
- Group imports: types/interfaces first, then utilities, then React, then side-effects

### Components / Modules:
- Server Components by default (Next.js 14)
- Use `'use client'` only for interactive sheets and cascading updates
- Props typed with TypeScript interfaces, no PropTypes
- Hooks for cascade engine: `useCascadeUpdate(projectId)`, `useDependencyGraph()`
- One component per file, descriptive names

## 🔧 Frequent Commands

```bash
# Development
npm run dev                        # Next.js dev server
npm run build                      # Production build
npm run lint                       # ESLint + Prettier check
npm run test                       # Jest test suite

# Versioning (AUTONOMOUS — installed via setup)
npm run version:patch "msg"       # Bump PATCH
npm run version:minor "msg"       # Bump MINOR
npm run version:major "msg"       # Bump MAJOR
npm run version:setup-hooks       # Install post-commit hook

# Context & Memory
npm run context:audit
npm run context:update
npm run context:adr "título"
npm run rules:add "descripción"
npm run rules:list
```

## � Project Memory System

All project knowledge stored in `.claude/memory/`:
- **architecture-rules.md** — Technical constraints, detected patterns, framework notes
- **versioning-rules.md** — Commit conventions, AUTONOMOUS hook, version history
- **corrections-log.md** — Learning log with corrections, patterns, and rules (auto-updated)
- **security-audit.md** — CVE tracking, API key rotation schedule, infrastructure security
- **contributors-checklist.md** — Onboarding guide, code review checklist, common tasks

**Update these files when:** fixing common patterns, discovering new rules, or recording CVEs.

---

## �🗄️ Database (MongoDB + Zustand)

### Schema Definition (Zod + TypeScript)
- Master schema in `types/business-project.ts` — defines BusinessProject interface
- Zod validator in `validators/business-project.schema.ts` — for runtime validation
- Validation happens BEFORE any database operation or IA response processing
- All monetary amounts: **numbers stored as cents** (E.g., $1.50 = 150) to avoid float precision issues

### Cascade & Recalculation
- Layer1 insumos → Layer2 procesos: recalculate process costs when insumo.cost changes
- Layer2 procesos → Layer3 productos: recalculate product unit cost when proceso.cost changes
- Layer3 productos → Layer4 precios: recalculate margins/ROI when producto.costoUnitario changes
- **Implementation**: services/calculation/cascadeEngine.ts with topological sort

### Sync Strategy
- **Local first**: Zustand store holds the project JSON in memory
- **Debounced sync**: Every 5 seconds, diff is sent to backend (only changed sheets)
- **On save**: User can explicitly trigger full sync or export
- **On load**: Full project JSON pulled from MongoDB, loaded into Zustand

## 🔐 Security
- **API Keys**: Always in .env, never in code
  - `PUBLIC_API_KEY` — Frontend can use (version checks, IA calls)
  - `INTERNAL_API_KEY` — Backend-only, for database access
- **Environment Variables** (see .env.example):
  - `NEXT_PUBLIC_API_URL` — Backend endpoint (http://localhost:3001 for dev)
  - `DATABASE_URL` — MongoDB connection string
  - `FIREBASE_APIKEY`, `FIREBASE_AUTHDOMAIN`, etc. — FirebaseConfig
  - `OPENROUTER_API_KEY` — Default IA provider
  - `PUBLIC_API_KEY` — For /api/version endpoint
  - `INTERNAL_API_KEY` — Server-only
- **CORS**: Configured for localhost:3000 (dev) + Render domain (prod)
- **Auth**: Firebase JWT tokens validated on every backend request
- **Rate limiting**: 100 req/15min for general API, 5 req/min for /api/version

## 🧪 Testing
- **Test runner**: Jest + React Testing Library
- **Coverage target**: > 70% for critical paths (cascade engine, calculations, validation)
- **File location**: Colocated with source (`my-module.test.ts` next to `my-module.ts`)
- **Naming**: `describe('Module')` → `it('should do X')` pattern
- **Critical tests**:
  - Cascade engine propagation (verify edges recalculate correctly)
  - Zod schema validation (valid projects + invalid edge cases)
  - Calculation determinism (same inputs always produce same outputs)
  - IA response validation (test schema after parsing responses)

## 🔄 Versioning Workflow (AUTONOMOUS)
**Mode:** AUTONOMOUS | **Branch:** main | **Architecture:** Separated front/back
**Frontend repo versioning trigger:** Post-commit hook on frontend repo

**Commit prefixes recognized:**
- 🐛 `fix:` or `fix /` → PATCH (1.2.3 → 1.2.4)
- ✨ `feat:` or `feature:` → MINOR (1.2.3 → 1.3.0)
- 💥 `BREAKING CHANGE:` → MAJOR (1.2.3 → 2.0.0)
- Other prefixes → no auto-push (commit stays local)

**Full workflow** (after setup):
```bash
git add .
git commit -m "🐛 fix: cascade not updating layer 3 correctly"
# Hook fires automatically
# System prompts: "Versionar y pushear a 1.0.1? (y/n)"
# User says yes → packge.json updated, RELEASE_NOTES regenerated, DB updated, tag created, push triggered
```

**Backend**: No hook, no versioning. Only adds `/api/version` endpoint for frontend checks.

---
**Maintenance:** This file updates automatically after each user correction.  
Do NOT edit the "NEVER do" / "ALWAYS do" sections manually — use: `npm run rules:add "description"`
