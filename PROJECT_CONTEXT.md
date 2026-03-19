# 📚 Project Context — CostoBot

## 🎯 Overview
CostoBot es un SaaS conversacional que ayuda a emprendedores latinoamericanos a calcular costos de negocio mediante IA. Los usuarios conversan con un agente IA que genera automáticamente un libro de costos con 4 capas interconectadas (Insumos → Procesos → Productos → Precios) con múltiples hojas por capa y actualización automática en cascada.

**MVP (Fase 1):** Chat + calculadora multi-hoja + exportación  
**Fase 2:** Validador de viabilidad de idea  
**Fase 3:** Simulador de escenarios + colaboración en equipo

## 🏗️ Architecture
- **Pattern:** Clean Architecture - Separation of concerns (UI / Calculator / Database)
- **Rendering:** SSR + Client-side interactivity (Next.js App Router)
- **Monorepo:** No — Separated Frontend (Next.js) + Backend (Node.js/Express)
- **Frontend:** `/frontend/` — Next.js 14+ (this workspace)
- **Backend:** `/backend/` — Node.js + Express (this workspace for dev, Render for prod)
- **State Management:** Zustand (local) + MongoDB (remote)
- **Data Sync:** Debounced (5s) local-to-remote, triggers cascade recalculation

## 📦 Key Dependencies
| Category | Package | Purpose |
|----------|---------|---------|
| **Framework** | next@14+ | Frontend framework, API routes |
| **UI/React** | react@18+ | Component library |
| **Typing** | typescript | Strict type safety |
| **State** | zustand | Local state + multi-sheet JSON reactivity |
| **Validation** | zod | Schema validation (especially multi-layer) |
| **Backend** | express | REST API server |
| **Database** | mongodb | Document store (multi-sheet projects) |
| **Auth** | firebase | User authentication |
| **Calculations** | — | Custom deterministic motor (no lib) |
| **Export** | sheetjs (xlsx) | Multi-sheet export to Excel |
| **IA** | openrouter-js (adapter) | Flexible IA provider (OpenRouter/LMStudio/Ollama) |
| **Testing** | jest, @testing-library/react | Unit & component tests |
| **Linting** | eslint, prettier | Code quality |
| **Build** | webpack (via Next.js) | Production build |

## 🔌 External APIs & Services
| Service | Purpose | Env var | Notes |
|---------|---------|---------|-------|
| OpenRouter API | IA (primary provider) | `OPENROUTER_API_KEY` | Provides LLM access (meta-llama/llama-3.1-8b by default) |
| Firebase Auth | User authentication | `FIREBASE_APIKEY`, etc. | Google-managed auth |
| LM Studio | IA (local alternative) | Config in adapter | Runs locally for dev/offline |
| Ollama | IA (local alternative) | Config in adapter | Alternative local IA stack |
| MongoDB Atlas | Data persistence | `DATABASE_URL` | Free Tier 512MB (sufficient for MVP) |
| Render | Backend hosting | — | Free tier or paid plan for Postgres backup |
| Vercel | Frontend hosting | — | Serverless deployment, auto-scales |

## 🌍 Environment Variables
| Variable | Description | Required | Env |
|----------|-------------|----------|-----|
| `NEXT_PUBLIC_API_URL` | Backend endpoint | Yes | dev: http://localhost:3001, prod: https://api.costobot.app |
| `DATABASE_URL` | MongoDB connection string | Yes | All |
| `FIREBASE_APIKEY` | Firebase API key | Yes | All |
| `FIREBASE_AUTHDOMAIN` | Firebase auth domain | Yes | All |
| `FIREBASE_PROJECTID` | Firebase project ID | Yes | All |
| `FIREBASE_STORAGEBUCKET` | Firebase storage bucket | Yes | All |
| `FIREBASE_MESSAGINGSENDERID` | Firebase sender ID | Yes | All |
| `FIREBASE_APPID` | Firebase app ID | Yes | All |
| `OPENROUTER_API_KEY` | OpenRouter API key | Yes (if using OpenRouter) | All |
| `IA_PROVIDER` | Which IA to use | No | dev: 'openrouter' \| 'lm-studio' \| 'ollama' |
| `PUBLIC_API_KEY` | API key for /api/version | Yes | Frontend |
| `INTERNAL_API_KEY` | API key (backend-only) | Yes | Backend |

## 🚀 Deployment
- **Platform:** Vercel (frontend) + Render (backend)
- **Environments:** dev (localhost), staging (optional), prod (Vercel + Render)
- **Build command:** `npm run build` (Next.js)
- **Start command:** `npm start` (Next.js production server)
- **Database** managed: MongoDB Atlas (cloud)

## 📊 Database
- **Engine:** MongoDB (document-oriented, flexible schema)
- **ORM:** None — using Mongoose for schema definition (optional) or raw MongoDB driver
- **Key models:**
  - `BusinessProject` — Main document with 4-layer structure, dependency graph, metadata
  - `User` — Firebase-managed (stored separately)
  - `ProjectVersion` — History of project snapshots (optional, for Fase 2)

## 🔍 Architecture Decisions (ADRs)
See [ARCHITECTURE.md](./ARCHITECTURE.md)

---
*Auto-generated — 19/03/2026*
*Refresh with: `npm run context:update`*
