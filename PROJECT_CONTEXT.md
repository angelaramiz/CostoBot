# 📚 Project Context — CostoBot

## 🎯 Overview
CostoBot es un SaaS conversacional que ayuda a emprendedores latinoamericanos a calcular costos de negocio mediante IA. Libro de costos con **3 capas coherentes** (Insumos con unidades filtradas + `paquete` contenedor → Productos grafo con conversión precisa → Precios por lote y por unidad con fijos/agregados/impuestos) y guía de ticket a la par, con actualización automática en cascada.

**MVP (Fase 1):** Chat + calculadora 3 capas + unidades coherentes + paquete mayoreo + guía ticket + exportación  
**Fase 2:** Validador de viabilidad de idea  
**Fase 3:** Simulador de escenarios + colaboración en equipo

## 🏗️ Architecture
- **Pattern:** Clean Architecture - Separation of concerns (UI / Calculator / Database)
- **Rendering:** SSR + Client-side interactivity (Next.js 16 App Router)
- **Monorepo:** No — Separated Frontend (Next.js) + Backend (Node.js/Express) — ambos en Render
- **Frontend:** `/` — Next.js 16.2 + React 18 + `@xyflow/react` (grafos)
- **Backend:** `/backend/` — Node.js + Express + Helmet + Rate Limit
- **State Management:** Zustand (local) + MongoDB (remote) con `fixedCosts`/`extraCosts` + `package` fields
- **Data Sync:** Debounced (5s) local-to-remote, triggers `cascade-engine` (lote y unidad) + `dependency-graph`

## 📦 Key Dependencies
| Category | Package | Purpose |
|----------|---------|---------|
| **Framework** | next@16.2 | Frontend framework, App Router |
| **UI/React** | react@18 + @xyflow/react | Grafo de productos + componentes |
| **Typing** | typescript 5 | Strict type safety |
| **State** | zustand 4.5 | Local state + multi-sheet JSON reactivity |
| **Validation** | zod 3.22 | Schemas layer1/2/3 + ticket + units |
| **Backend** | express + helmet | REST API server + seguridad |
| **Database** | mongodb (mongoose) | Document store + BusinessProject (package, fixedCosts) |
| **Auth** | firebase 11 | User authentication |
| **Calculations** | — | `services/calculation` (cascade, dependency-graph, units) + `lib/units` + `lib/ticket` |
| **Export** | @e965/xlsx | Multi-sheet Excel + JSON + guía ticket |
| **IA** | openrouter-js (adapter) | Flexible IA provider (OpenRouter/LMStudio/Ollama) |
| **Testing** | jest 29 + testing-library | Unit & component tests |
| **Linting** | eslint 9 | Code quality |
| **Build** | next build | Production build |

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
- **Platform:** Render (frontend `costobot-frontend` + backend `costobot-backend`) — `render.yaml` IaC
- **Environments:** dev (localhost:3000/3001), prod (Render)
- **Build command:** `npm install && npm run build` (frontend) / `npm install` (backend)
- **Start command:** `node .next/standalone/server.js` / `node backend/server.js`
- **Health:** `GET /health` con estado DB
- **Database** managed: MongoDB Atlas (cloud) — `DATABASE_URL`

## 📊 Database
- **Engine:** MongoDB (document-oriented, flexible schema)
- **ORM:** Mongoose — `BusinessProject.model.js` (Insumo con `packageQuantity/packageUnit`, CostBreakdown con `fixed`, ProductPricing con `costoUnitario/precioUnitario/impuestoMonto`)
- **Key models:**
  - `BusinessProject` — 3-layer structure (`layer1` Insumos coherentes, `layer2` ProductGraph, `layer3` Precios con `fixedCosts`+`extraCosts`+`products` por lote/unidad)
  - `User` — Firebase-managed (stored separately)
  - `VersionHistory` — Historial de bumps (para rollback)
  - `TicketData` — guía `lib/ticket/ticket-types.ts` (subtotal/IVA/propina)

## 🔍 Architecture Decisions (ADRs)
See [ARCHITECTURE.md](./ARCHITECTURE.md)

---
*Auto-generated — 19/03/2026*
*Refresh with: `npm run context:update`*
