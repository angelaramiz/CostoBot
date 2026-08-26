# 🏛️ Architecture Decisions — CostoBot

> Record of significant technical decisions.
> Add new ones with: `npm run context:adr "title"`

---

## ADR-001: Multi-Layer Calculation Architecture (3 Capas coherentes)
- **Date:** 19/03/2026 — actualizado 08/2026
- **Status:** Active (core feature) — **evolucionado de 4 a 3 capas**
- **Context:** CostoBot needs to support complex business cost calculations with interconnected dependencies. Linear calculator insufficient, y 4 capas generaba duplicación Productos/Precios.
- **Decision:** Implement 3-layer architecture:
  - **Layer 1:** Insumos — catálogo coherente por categoría (ingrediente peso/volumen/cantidad + `paquete` contenedor, material/utensilio/maquina sin kg/L) — `lib/units.ts`
  - **Layer 2:** Productos (grafo ReactFlow) — nodos ingredient/utensil/machine/resultado/import/export, con conversión de unidades y yield/empaque
  - **Layer 3:** Precios — servicios variables, **gastos fijos mensuales** prorrateados, **gastos agregados por lote**, impuestos, y pricing por lote **y por unidad** (`costoUnitario/precioUnitario`)
- **Trade-offs:**
  - ✅ Unidades coherentes + paquete evita errores de conversión
  - ✅ Precio por unidad es intuitivo para el emprendedor
  - ✅ Reusable: mismo insumo usado por varios productos
  - ❌ Complejo: dependency graph + conversión + prorrateo
- **Consequences:** Cada cambio en Layer 1 recalcula Layer 2 y Layer 3 (lote y unidad) vía `cascade-engine`; ver ADR-009/010/012

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

## ADR-009: Sistema de Unidades Coherente por Categoría
- **Date:** 08/2026
- **Status:** Active
- **Context:** Ingredientes usan peso/volumen, materiales no deben venderse por kg, utensilios solo pza. Conversiones g↔kg, ml↔L con floats causaban $0.01 de error.
- **Decision:** `lib/units.ts` con grupos `weight (mg/g/kg/oz/lb)`, `volume (ml/L/fl_oz/gal)`, `count (pza/paquete)`, `time`. Factores a unidad base y `convertQuantity`/`calculateIngredientCost` con `Math.round` en centavos. `InsumoAddForm` filtra por `UNITS_BY_CATEGORY` con `<optgroup>`, `NodePropsPanel` solo ofrece compatibles.
- **Consequences:** Ingrediente 500 g de insumo kg se calcula como `0.5 kg`. Sin `m/cm/mm` (eliminado por pedido).

## ADR-010: Paquete como Contenedor (Mayoreo)
- **Date:** 08/2026
- **Status:** Active
- **Context:** Compras por mayoreo vienen en cajas/paquetes (ej: caja 20 kg carne, pack 4×1 L leche) pero se consumen por kg/L/pza.
- **Decision:** Si `unit === 'paquete'`, el insumo guarda `packageQuantity` + `packageUnit` (contenido interno). `calculateIngredientCost` hace `costo/paquete ÷ cantidad` → costo por unidad interna, con conversión si el uso es `ml` vs `L`. UI muestra bloque azul `Contenido por paquete` y en Capa 2 permite usar `paquete` o la unidad interna.
- **Trade-offs:** ✅ Modela mayoreo real, ❌ añade dos campos opcionales al schema.

## ADR-011: Guía de Extracción de Ticket a la Par
- **Date:** 08/2026
- **Status:** Active
- **Context:** Ticket de restaurante tiene 8 campos con reglas fiscales (subtotal 65% deducible, propina no deducible).
- **Decision:** `lib/ticket/ticket-types.ts` define `TicketData` + `TICKET_EXTRACTION_GUIDE` y `TicketExtractionGuide.tsx` replica el ticket con flechas `→ campo` y tabla de mapeo, integrado en `ImportDialog` como tab `Ticket de compra` junto a `Proyecto JSON`.
- **Consequences:** OCR aún placeholder, guía sirve como contrato de extracción para futuro OCR.

## ADR-012: Capa 3 Coherente (Lote/Unidad, Fijos/Agregados/Impuestos)
- **Date:** 08/2026
- **Status:** Active
- **Context:** Capa 3 solo tenía `extraCosts` (3 campos) y `precioVenta` por lote sin distinguir por unidad; fijos no existían y prorrateo era impreciso.
- **Decision:** 
  - `FixedCosts` (renta, serviciosFijos, sueldosFijos, otrosFijos, unidadesMes) → `applyFixedCostsToBreakdown` prorratea por `fixedPerUnit * unidadesLote` si hay `unidadesMes`, si no por share de costo. 
  - `ExtraCosts` renombrado a **Gastos Agregados (por lote)**.
  - `ProductPricing` añade `costoUnitario/precioUnitario/precioUnitarioConImpuestos/gananciaUnitaria/impuestoMonto/unidadesLote`.
  - Orden UI: Servicios → Fijos → Agregados → Impuestos → Productos, desglose muestra 7 líneas + fila por unidad si `unidadesLote>1`.
- **Consequences:** Precio por lote y por unidad son coherentes, impuestos se separan (`impuestoMonto`), ROI sobre precio final.

---

*Add decisions with: `npm run context:adr "title"`*
*Update status when decisions change*
