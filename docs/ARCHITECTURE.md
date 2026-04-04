# 🏛️ Arquitectura de CostoBot

> Documento de referencia técnica. Actualizar con cada cambio estructural significativo.
> Última actualización: v0.30.0

---

## 📐 Visión General del Sistema

CostoBot es un SaaS de costeo empresarial con cálculo en cascada de 3 capas (insumos → procesos → productos/precios). El motor de cálculo es determinista y reactivo: cualquier cambio en capa 1 propaga actualizaciones hacia arriba automáticamente.

```
Layer 1 — Insumos     →   Layer 2 — Procesos (Grafos)   →   Layer 3 — Precios
(costPerUnit, qty)        (ProductGraph, nodes/edges)        (ProductPricing, margen, ROI)
         │                          │                                  │
         └──── cascade-engine.ts ───┴──────────────────────────────────┘
                   propagateChange() / recalculateAllLayers()
```

---

## 🗂️ Capas del Modelo de Datos (`BusinessProject`)

### Layer 1 — Insumos (`Insumo[]`)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID único |
| `name` | string | Nombre del insumo |
| `costPerUnit` | number | Costo por unidad (en centavos) |
| `quantity` | number | Cantidad usada por lote |
| `category` | string | `'ingrediente' \| 'material' \| 'empaque'` |
| `supplier` | string? | Proveedor (opcional) |
| `sku` | string? | Código de referencia (opcional) |

### Layer 2 — Procesos (`ProductGraph[]`)

Cada proceso es un **grafo dirigido** (DAG) con nodos tipados:

| Tipo de nodo | Datos | Propósito |
|---|---|---|
| `ingredient` | `{ insumoId, quantity }` | Referencia a Layer 1 |
| `material` | `{ insumoId, quantity }` | Insumo tipo empaque/material |
| `process` | `{ laborCost, duration }` | Etapa de procesamiento |
| `resultado` | `{ mainProduct, byProducts[], yield }` | Producto final (obligatorio ×1) |

El `totalCost` del grafo se calcula como `rawCost / yield`, donde `rawCost` acumula costos de todos los nodos de entrada.

**Campo adicional**: `servicesUsage` en nodos tipo `resultado` — mapa de `serviceId → unidadesConsumidas`, para registrar el consumo de servicios (electricidad, gas, etc.) por proceso.

### Layer 3 — Precios y Servicios (`Layer3Data`)

```typescript
Layer3Data {
  services: Record<string, ServiceConfig>   // definición de servicios
  taxes:    Record<string, TaxConfig>        // definición de impuestos
  products: ProductPricing[]                 // un registro por grafo L2
}
```

**`ProductPricing`** — campos clave:

| Campo | Cálculo |
|-------|---------|
| `margenPorcentaje` | Input del usuario (default 30%) |
| `precioVenta` | `totalCost × (1 + margen/100)` |
| `ganancia` | `precioVenta − totalCost` |
| `totalTaxRate` | Suma de `rate` de todos los impuestos habilitados |
| `precioVentaConImpuestos` | `round(precioVenta × (1 + totalTaxRate))` |
| `roi` | `round(ganancia / precioVentaConImpuestos × 100)` |

---

## ⚙️ Motor de Cascada (`services/calculation/cascade-engine.ts`)

### API Pública

```typescript
// Propaga un cambio puntual desde cualquier capa hacia arriba
propagateChange(project, layerId, itemId, field, newValue): BusinessProject

// Recalcula todo el proyecto desde cero (útil tras cambios estructurales)
recalculateAllLayers(project): BusinessProject
```

### Flujo de `propagateChange` (layer1)

```
1. propagateInsumoChange(project, insumoId, field, value)
   ├── Clona el proyecto (structuredClone)
   ├── Actualiza el campo en layer1
   ├── Para cada grafo en layer2 que use este insumo:
   │     recalculateProductGraph(graph, layer1, layer2, services)
   └── Para cada pricing en layer3 cuyo grafo cambió:
         recalculateProductPricing(pricing, graph, taxes)
           ├── calculateGraphCostBreakdown(...)
           ├── calculatePricing(totalCost, margen, totalTaxRate)
           └── retorna { precioVenta, ganancia, totalTaxRate,
                          precioVentaConImpuestos, roi }
```

### `syncL2ToL3` — Auto-sincronización

Llamada automáticamente por `recalculateAllLayers`. Garantiza que por cada grafo en Layer 2 exista al menos un `ProductPricing` en Layer 3 (con `margenPorcentaje = 30%` por defecto). Nunca duplica entradas existentes.

---

## 🤖 Módulo de IA (`backend/lib/ia/`)

### Adaptadores

| Archivo | Responsabilidad |
|---------|----------------|
| `ia.adapter.js` | Interfaz común + tipos (`ProjectContext`) |
| `openrouter.adapter.js` | Cliente OpenRouter; contiene `buildSystemPrompt` compartido |
| `ollama.adapter.js` | Proxy a Ollama local (reutiliza `buildSystemPrompt`) |
| `lmstudio.adapter.js` | Proxy a LM Studio local (reutiliza `buildSystemPrompt`) |
| `prompt-templates.js` | **NUEVO** — plantillas de prompt por industria |

### Plantillas de Prompt por Industria (`prompt-templates.js`)

**6 industrias soportadas**: `panaderia`, `cosmeticos`, `textil`, `alimentos`, `servicios`, `reventa`

**Detección automática** (`detectIndustry`):
- Analiza nombres de insumos (Layer 1) y productos (Layer 2)
- Asigna puntuación por coincidencia de palabras clave por industria
- Retorna la industria con mayor puntuación (mínimo 1 coincidencia)
- Fallback: `'default'` si no hay suficientes coincidencias

**Inyección en el system prompt** (`buildSystemPrompt` modo `project`):
```
[Guía de Industria: Panadería]
- Considera el rendimiento del horneado y mermas
- Revisa los costos de insumos principales: harina, mantequilla, huevos
- El punto de equilibrio es clave en productos perecederos
...
```

### Contexto del Proyecto en Resumen IA

`generateResumen` en `ia.routes.js` incluye desde v0.29.0:
- Industria detectada (label legible)
- Servicios activos con costo unitario
- Impuestos activos con tasas
- ROI promedio de los productos

---

## 🧪 Estrategia de Testing

**Test runner**: Jest con `@swc/jest` (TypeScript nativo, sin compilación)  
**Cobertura**: 4 suites, 66 tests (v0.30.0)

| Suite | Archivo | Qué verifica |
|-------|---------|-------------|
| `calculations.test.ts` | `services/calculation/` | Funciones puras: `calculatePricing`, `calculateGraphCostBreakdown`, etc. |
| `cascade-engine.test.ts` | `services/calculation/` | Propagación en cascada, ROI, impuestos, `syncL2ToL3` |
| `business-project.schema.test.ts` | `validators/` | Validación Zod: proyectos válidos e inválidos |
| `project.store.test.ts` | `store/` | Zustand store: CRUD de capas, reactividad |

**Tests críticos para cascade-engine**:
- Propagación `layer1 → layer2 → layer3` (precio y costo)
- ROI con y sin impuestos habilitados
- `precioVentaConImpuestos` con IVA 16%
- `syncL2ToL3`: crea entradas nuevas, no duplica existentes, no muta el original

---

## 🔄 Historial de Decisiones (ADRs)

### ADR-001 — Motor de Cascada con Clonación Profunda
- **Fecha**: v0.20.0
- **Decisión**: Usar `structuredClone` en cada operación de propagación
- **Razón**: Garantiza inmutabilidad — los tests pueden comparar el objeto original con el resultado sin efectos secundarios

### ADR-002 — `totalTaxRate` como suma de impuestos habilitados
- **Fecha**: v0.28.0
- **Decisión**: Calcular `totalTaxRate` en cada recálculo; no cachear
- **Razón**: Los impuestos pueden cambiar dinámicamente; recalcular siempre es O(k) donde k = número de impuestos (típicamente < 5)

### ADR-003 — ROI sobre precio con impuestos (no sobre precio base)
- **Fecha**: v0.28.0
- **Decisión**: `roi = round(ganancia / precioVentaConImpuestos × 100)`
- **Razón**: El precio con impuestos es el precio real de venta; el ROI sobre ese valor es más representativo para el negocio

### ADR-004 — Detección de industria por scoring de palabras clave
- **Fecha**: v0.29.0
- **Decisión**: `detectIndustry` acumula puntuación y elige la industria con mayor score
- **Razón**: Simple, sin dependencias externas, funciona bien con vocabulario de insumos en español. Alternativa rechazada: clasificación con IA (costo adicional por token)

### ADR-005 — `syncL2ToL3` solo en `recalculateAllLayers`
- **Fecha**: v0.28.0
- **Decisión**: `syncL2ToL3` se llama únicamente en `recalculateAllLayers`, no en `propagateChange` granular
- **Razón**: `propagateChange` es para actualizaciones puntuales; añadir sync en cada llamada introduciría complejidad innecesaria. El usuario puede agregar grafos nuevos y luego llamar a `recalculateAllLayers`

---

*Auto-generado por el agente de versionamiento. Actualizar con `npm run context:adr "título"`.*
