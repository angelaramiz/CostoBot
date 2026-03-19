# Architecture Rules — CostoBot
*Auto-detected on 19/03/2026 — update after major refactors*

## Detected Patterns
- **Multi-layer calculation system**: 4 interconnected layers (Insumos → Procesos → Productos → Precios)  
- **Cascade dependencies**: Changes propagate downward through layers automatically
- **Multi-sheet per layer**: Each layer contains multiple sheets (Capa 1: Desechables, Reutilizables, Maquinaria, Servicios)
- **Deterministic calculations**: All formulas are pure functions, no IA-based calculations
- **Local-first, sync-on-change**: Zustand local state + debounced 5s sync to MongoDB

## Technical Constraints
- TypeScript strict mode — no `any`, all interfaces typed from root `BusinessProject` schema
- All external inputs (IA responses, API calls) validated with Zod BEFORE processing
- No synchronous operations in cascade engine — all recalculations are async and topologically ordered
- API key required (`X-API-Key` header) for all `/api/` calls
- Monetary amounts stored as integers (cents) to avoid IEEE 754 float precision errors
- Max 100 active sheets per layer per project (UI/performance constraint)

## Implementation Preferences
- Prefer client-side calculations (Zustand + pure functions) over server-side
- Debounced sync: 5-second delay between local change and MongoDB update
- UI responsive first: optimistic updates before network confirmation
- IA used only for context/suggestions, not calculations
- Export/import via XLSX multi-sheet (SheetJS) and JSON formats
- Fallback to local IA (LM Studio/Ollama) if OpenRouter unavailable

## Framework-Specific Notes (Next.js 14 + App Router)
- Use Server Components by default, `'use client'` only for interactive layers/charts
- API routes in `app/api/` follow Next.js conventions
- Zustand store hydrated after mount (prevent SSR hydration mismatch)
- Cascade calculations can run on client OR server (configurable via env)
- Dependency graph serializable to JSON (for caching/export)
