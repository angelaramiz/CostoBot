# 🏛️ Architecture Decisions — CostoBot

> Record of significant technical decisions.
> Add new ones with: `npm run context:adr "title"`

---

## ADR-001: Multi-Layer Calculation Architecture (4 Capas)
- **Date:** 19/03/2026
- **Status:** Active (core feature)
- **Context:** CostoBot needs to support complex business cost calculations with interconnected dependencies. A linear calculator is insufficient.
- **Decision:** Implement 4-layer architecture:
  - **Layer 1:** Insumos (raw materials, services) — multiple sheets per category
  - **Layer 2:** Procesos (manufacturing steps, labor) — steps can reference layer 1
  - **Layer 3:** Productos (finished goods) — recipes reference layer 1, processes reference layer 2
  - **Layer 4:** Precios (sales prices, projections) — pulls costs from layer 3, calculates margins
- **Trade-offs:**
  - ✅ Flexible: users can model complex businesses
  - ✅ Reusable: same insumo used by multiple processes/products
  - ❌ Complex to implement: requires dependency graph and cascade recalculation
  - ❌ Learning curve: users must understand layer relationships
- **Consequences:** Every change triggers cascading recalculations; performance depends on dependency graph optimization

---

## ADR-002: Zustand + Debounced MongoDB Sync
- **Date:** 19/03/2026
- **Status:** Active (data persistence strategy)
- **Context:** Users should experience instant UI responsiveness while changes persist to database.
- **Decision:** Hybrid approach:
  - Zustand store holds full project JSON locally (multi-sheet business model)
  - Changes immediately reflected in UI (optimistic update)
  - Every 5 seconds, diff is sent to MongoDB (debounced sync)
  - On page reload, full project loaded from MongoDB into Zustand
- **Trade-offs:**
  - ✅ Responsive UI: no network latency felt by user
  - ✅ Offline capability: can continue working if backend is down (manual save needed)
  - ✅ Simple state management: Zustand is lightweight
  - ❌ Potential sync conflicts: if two tabs edit same project simultaneously
  - ❌ Data loss risk: if user closes browser without explicit save
- **Consequences:** Need explicit "Save Project" button for critical workflows; consider adding warning before unload

---

## ADR-003: IA Adapter Pattern (Pluggable)
- **Date:** 19/03/2026
- **Status:** Active (flexibility for IA provider)
- **Context:** CostoBot should support multiple IA providers (OpenRouter, LM Studio, Ollama) without rewriting code.
- **Decision:** Create adapter pattern for IA providers:
  ```typescript
  interface IAProvider {
    generateStructure(prompt): Promise<BusinessProject>;
    chat(messages, context): Promise<string>;
  }
  
  class OpenRouterAdapter implements IAProvider { ... }
  class LMStudioAdapter implements IAProvider { ... }
  class OllamaAdapter implements IAProvider { ... }
  ```
  - Config selects provider via `IA_PROVIDER` env var
  - Same interface for all providers
  - Fallback to local (LM Studio/Ollama) if OpenRouter unavailable
- **Trade-offs:**
  - ✅ Flexible: can switch providers without code changes
  - ✅ Resilient: fallback to local IA if cloud is down
  - ✅ Cost-effective: can use free local models for development
  - ❌ Extra abstraction layer: slightly more complex code
  - ❌ Response format variability: different models output differently
- **Consequences:** Need comprehensive response validation (Zod schema) to handle output variance

---

## ADR-004: Deterministic Calculation Engine (No IA)
- **Date:** 19/03/2026
- **Status:** Active (calculation integrity)
- **Context:** Cost calculations must be reproducible, auditable, and mathematically correct. IA should not be used for calculations.
- **Decision:** Build custom calculation engine in `services/calculation/cascadeEngine.ts`:
  - Pure functions: same inputs always produce same outputs
  - No randomness or external dependencies
  - Explicit formulas documented in code comments
  - Comprehensive test coverage (100% for calculation logic)
  - IA used only for generating initial structure and answering questions
- **Trade-offs:**
  - ✅ Reliable: calculations are deterministic and auditable
  - ✅ Fast: no network calls during calculations
  - ✅ Offline-capable: calculations work in browser
  - ❌ Manual maintenance: formulas must be manually defined
  - ❌ Limited flexibility: can't adapt calculations dynamically
- **Consequences:** Document all formulas clearly; consider adding calculation explanation UI for users

---

## ADR-005: TypeScript Strict Mode + Zod Validation
- **Date:** 19/03/2026
- **Status:** Active (type safety)
- **Context:** Multi-layer architecture is complex; type errors can cascade.
- **Decision:**
  - Use TypeScript strict mode in `tsconfig.json`
  - All functions have explicit return types
  - Master schema defined in `types/business-project.ts`
  - Zod validators in `validators/business-project.schema.ts`
  - All external inputs validated with Zod BEFORE processing
- **Trade-offs:**
  - ✅ Catches bugs early (compile-time and runtime)
  - ✅ IDE autocomplete improves developer experience
  - ✅ Easier refactoring: type system guides changes
  - ❌ More verbose code: requires explicit types
  - ❌ Learning curve: TypeScript syntax
- **Consequences:** Stricter code review for type safety; setup linter to enforce

---

## ADR-006: Firebase Auth (Not Custom)
- **Date:** 19/03/2026
- **Status:** Active (authentication)
- **Context:** Building custom auth is risky; Firebase is proven and scalable.
- **Decision:** Use Firebase Auth for user authentication:
  - Email/password login
  - Optionally: Google sign-in
  - JWT token-based API auth (backend validates Firebase tokens)
  - No custom password hashing or session management
- **Trade-offs:**
  - ✅ Secure: Google-managed, industry standard
  - ✅ Scalable: no custom infrastructure needed
  - ✅ Fast to implementation: no auth code to write
  - ❌ Vendor lock-in: difficult to migrate away from Firebase
  - ❌ Cost: Firebase has paid tiers; free tier may limit concurrency
- **Consequences:** Users must be comfortable with Google's data handling; add privacy policy

---

## ADR-007: MongoDB for Flexible Schema
- **Date:** 19/03/2026
- **Status:** Active (data persistence)
- **Context:** Business projects are heterogeneous (different industries, different layer structures).
- **Decision:** Use MongoDB (document-oriented) instead of PostgreSQL:
  - Multi-sheet structure naturally maps to nested arrays in JSON
  - Flexible schema: can add custom sheets without migration
  - Easy scaling: horizontal scaling with sharding
  - Free tier on Atlas: 512MB sufficient for MVP
- **Trade-offs:**
  - ✅ Flexible schema: natural fit for nested data
  - ✅ Easy iteration: no migrations needed for new fields
  - ✅ Scaling: horizontally scalable
  - ❌ Joins are complex: no SQL joins (but not needed for this model)
  - ❌ Storage overhead: JSON storage uses more disk than normalized SQL
  - ❌ Consistency: eventual consistency (configurable)
- **Consequences:** Ensure Zod schema is comprehensive; use schema versioning for future migrations

---

## ADR-008: AUTONOMOUS Versioning with Post-Commit Hook
- **Date:** 19/03/2026
- **Status:** Active (versioning)
- **Context:** CostoBot is a living project with frequent iterations. Versioning must be automatic and low-friction.
- **Decision:** Implement AUTONOMOUS mode:
  - Post-commit hook on frontend repo (`.git/hooks/post-commit`)
  - Recognizes emoji prefixes: 🐛 `fix:` (PATCH), ✨ `feat:` (MINOR), 💥 `BREAKING` (MAJOR)
  - Hook automatically bumps version, updates RELEASE_NOTES, creates tag, and pushes
  - Backend: no versioning (only frontend version increments)
  - Database tracks version history (for Fase 2 rollback support)
- **Trade-offs:**
  - ✅ Frictionless: developers don't think about versioning
  - ✅ Atomic: version bump and tag created together
  - ✅ Semantic: emoji prefixes are consistent with commit conventions
  - ❌ Hook failures: if hook fails, commit stays local (need `--no-verify` to bypass)
  - ❌ Global version: entire frontend shares one version (not granular)
- **Consequences:** Document emoji prefix convention for team; add `version:setup-hooks` command for new clones

---

*Add decisions with: `npm run context:adr "title"`*
*Update status when decisions change*
