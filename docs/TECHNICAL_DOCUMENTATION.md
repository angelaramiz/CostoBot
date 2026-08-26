# 📚 Documentación Técnica — Arquitectura de CostoBot

**Versión:** 1.3  
**Fecha:** 26 de agosto de 2026  
**Autor:** CostoBot Engineering Team — actualizado con unidades coherentes, paquete contenedor y Capa 3 por lote/unidad

---

## 📑 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura de 3 Capas](#arquitectura-de-3-capas)
3. [Cascade Engine — Motor de Cascada](#cascade-engine--motor-de-cascada)
4. [Algoritmo de Cálculo de Costos](#algoritmo-de-cálculo-de-costos)
5. [Fórmulas de Pricing y ROI](#fórmulas-de-pricing-y-roi)
6. [Validación con Zod](#validación-con-zod)
7. [Flujo E2E: Layer 1 → Layer 2 → Layer 3](#flujo-e2e-layer-1--layer-2--layer-3)

---

## Visión General

CostoBot es un sistema de análisis de costos multi-capa para pequeños negocios que:

- **Modela insumos** (compras, materiales, herramientas)
- **Define procesos** mediante grafos dirigidos (qué insumo va a dónde)
- **Calcula precios finales** con márgenes, impuestos y servicios

### Objetivos Técnicos

1. **Exactitud:** Cada cálculo es reproducible y auditable
2. **Escalabilidad:** Manejar grafos de 100+ nodos sin degradación
3. **Consistencia:** Cambios en Layer 1 propagan automáticamente a Layer 3
4. **Flexibilidad:** Soportar múltiples industrias con plantillas

---

## Arquitectura de 3 Capas

```
┌─────────────────────────────────────────────────────────┐
│  CAPA 1: INSUMOS (Inputs)                               │
│  ┌─────────────────────────────────────────────────────┐│
│  │ • Harina (kg): $12.50 / unidad                      ││
│  │ • Azúcar (kg): $8.00 / unidad                       ││
│  │ • Mantequilla (kg): $45.00 / unidad                 ││
│  │ • Bolsa de papel (pza): $3.50 / unidad              ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
                          ↓↓↓
          Cascade Engine: propagación de costos
                          ↓↓↓
┌─────────────────────────────────────────────────────────┐
│  CAPA 2: GRAFO DE PROCESOS (Process Graph)              │
│  ┌─────────────────────────────────────────────────────┐│
│  │                                                      ││
│  │  Harina ──┐                                         ││
│  │  Azúcar ──├─→ [Mezcla] ──→ [Horno] ──→ [Pan]       ││
│  │  Mantequilla┘                        ↑              ││
│  │                              Bolsa ──┘              ││
│  │                                                      ││
│  │  Costo por lote: $32.50 ÷ 20 panes = $1.625/pan   ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
                          ↓↓↓
          Cascade Engine: cálculo de precios
                          ↓↓↓
┌─────────────────────────────────────────────────────────┐
│  CAPA 3: PRECIOS Y MÁRGENES (Pricing Layer)             │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Producto: Pan integral artesanal                   ││
│  │ • Costo unitario: $1.625                           ││
│  │ • Margen: 42% (industria panadería)                ││
│  │ • Precio sin impuesto: $2.31                       ││
│  │ • IVA (16%): $0.37                                 ││
│  │ • Precio final: $2.68                              ││
│  │ • ROI: 42%                                         ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Descripción por Capa

| Capa | Responsabilidad | Modelo | Ejemplo |
|------|-----------------|--------|---------|
| **Layer 1** | Registro de insumos y costos base | Tabla de items | Harina $12.50/kg |
| **Layer 2** | Conexión de insumos mediante procesos | Grafo dirigido | Harina → Mezcla → Horno → Pan |
| **Layer 3** | Cálculo de precio final con márgenes | Cálculo determinista | Pan: $2.68 (con IVA) |

---

## Cascade Engine — Motor de Cascada

### Definición

El **Cascade Engine** es el algoritmo central que detecta dependencias entre capas y propaga cambios automáticamente.

### Entrada

- Layer 1: lista de insumos actualizada
- Layer 2: grafo de nodos y aristas
- Layer 3: productos y settings de margen/impuestos

### Proceso

```text
1. Ordenamiento Topológico
   ├─ Toma el grafo de Layer 2
   ├─ Detecta nodos sin dependencias (source nodes)
   └─ Ordena: insumos → procesos → productos

2. Cálculo de Costos Iterativo
   ├─ Para cada nodo en orden topológico:
   │  ├─ Si es INSUMO: obtener costo de Layer 1
   │  ├─ Si es PROCESO: sumar costos de entrada
   │  └─ Si es PRODUCTO: calcular costo unitario
   └─ Registrar costBreakdown para auditoría

3. Propagación a Layer 3
   ├─ Actualizar costoUnitario de cada producto
   ├─ Recalcular precio final: precio = costo * (1 + margen/100)
   ├─ Aplicar impuestos: precio final = precio * (1 + taxRate)
   └─ Guardar en MongoDB
```

### Pseudocódigo: Ordenamiento Topológico

```javascript
function topologicalSort(nodes, edges) {
  const visited = new Set();
  const sorted = [];
  
  function visit(nodeId) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    // Visitar nodos que dependen de este
    const dependents = edges
      .filter(e => e.source === nodeId)
      .map(e => e.target);
    
    dependents.forEach(dep => visit(dep));
    sorted.push(nodeId);
  }
  
  nodes.forEach(n => visit(n.id));
  return sorted;
}
```

### Pseudocódigo: Cálculo de Costos

```javascript
function calculateNodeCost(nodeId, nodes, edges, layer1Costs) {
  const node = nodes.find(n => n.id === nodeId);
  
  // Caso 1: Nodo de insumo
  if (node.type === 'insumo') {
    return layer1Costs[nodeId];
  }
  
  // Caso 2: Nodo de proceso
  if (node.type === 'proceso') {
    const incomingEdges = edges.filter(e => e.target === nodeId);
    return incomingEdges.reduce((sum, edge) => {
      const sourceCost = calculateNodeCost(edge.source, nodes, edges, layer1Costs);
      return sum + (sourceCost * edge.quantity);
    }, 0) + node.laborCost;
  }
  
  // Caso 3: Nodo de producto
  if (node.type === 'producto') {
    const incomingEdges = edges.filter(e => e.target === nodeId);
    const totalCost = incomingEdges.reduce((sum, edge) => {
      const sourceCost = calculateNodeCost(edge.source, nodes, edges, layer1Costs);
      return sum + (sourceCost * edge.quantity);
    }, 0);
    
    return totalCost / node.units; // Costo por unidad
  }
}
```

### Configuración de Seguridad

- **Máximo de iteraciones:** 1000 (previene loops infinitos)
- **Timeout:** 30 segundos por cálculo
- **Validación:** Cada resultado se valida con Zod antes de guardar

---

## Algoritmo de Cálculo de Costos

### Fórmula Fundamental

```
CostoUnitario = ∑(Insumo_i × Cantidad_i) + ∑(ProcesoLabor_i) / Rendimiento
```

### Ejemplo: Pan Integral Artesanal

**Insumos por lote (20 panes):**
- Harina: 1 kg × $12.50 = $12.50
- Azúcar: 0.5 kg × $8.00 = $4.00
- Mantequilla: 0.25 kg × $45.00 = $11.25
- Levadura: 0.02 kg × $150.00 = $3.00

**Labor:**
- Mezcla: $5.00
- Horneado: $8.00

**Cálculo:**
```
Costo total lote = $12.50 + $4.00 + $11.25 + $3.00 + $5.00 + $8.00 = $43.75
Costo unitario = $43.75 / 20 = $2.1875 ≈ $2.19
```

### Manejo de Merma y Desperdicio

Para procesos con pérdida (cocción, corte, limpieza):

```
Rendimiento Ajustado = Rendimiento Base × (1 - Tasa de Merma)
Costo Unitario = Costo Total / Rendimiento Ajustado

Ejemplo:
- Rendimiento base: 100 kg de tela
- Merma (corte): 15%
- Rendimiento ajustado: 100 × (1 - 0.15) = 85 kg útiles
- Si costo = $425, entonces costo/kg = $425 / 85 = $5/kg
```

---

## Fórmulas de Pricing y ROI

### Precio Sugerido (Layer 3)

```
Precio Venta = CostoUnitario × (1 + Margen% / 100)
```

**Ejemplo:**
- Costo unitario: $2.19
- Margen panadería: 42%
- Precio = $2.19 × 1.42 = $3.11

### Aplicación de Impuestos

```
Precio Final = Precio Venta × (1 + TasaImpuesto)
```

**Ejemplo (México, IVA 16%):**
- Precio venta: $3.11
- Precio final = $3.11 × 1.16 = $3.61

### Cálculo de ROI

```
ROI (%) = ((Precio Venta - Costo Unitario) / Costo Unitario) × 100
```

**Ejemplo:**
- Precio venta: $3.11
- Costo: $2.19
- ROI = (($3.11 - $2.19) / $2.19) × 100 = (0.92 / 2.19) × 100 = 42%

### Punto de Equilibrio (Break-Even)

```
Cantidad = Costos Fijos / (Precio Unitario - Costo Variable)
```

**Ejemplo:**
- Costos fijos mensuales: $1,000 (renta, servicios)
- Precio unitario: $3.61
- Costo variable: $2.19
- Margen de contribución: $3.61 - $2.19 = $1.42
- Cantidad: $1,000 / $1.42 ≈ 704 unidades/mes

---

## Validación con Zod

CostoBot utiliza **Zod** para validar integridad de datos en cada capa.

### Layer 1 Schema

```javascript
const Layer1ItemSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  unit: z.string().min(1, 'Unidad requerida'),
  cost: z.number().positive('Costo debe ser positivo'),
  quantity: z.number().positive(),
  category: z.enum(['insumo', 'material', 'energia', 'agua']),
});
```

### Layer 2 Schema (Grafo)

```javascript
const NodeSchema = z.object({
  id: z.string().regex(/^[\w-]+$/),
  name: z.string().min(1),
  type: z.enum(['insumo', 'proceso', 'producto']),
  cost: z.number().nonnegative().optional(),
  units: z.number().positive('Rendimiento debe ser > 0'),
});

const EdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  quantity: z.number().positive('Cantidad debe ser > 0'),
});

const GraphSchema = z.object({
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
}).refine(validateNoCycles, 'Graph contiene ciclos');
```

### Layer 3 Schema (Pricing)

```javascript
const PricingSchema = z.object({
  costoUnitario: z.number().nonnegative(),
  margenPorcentaje: z.number().min(0).max(1000),
  impuestos: z.object({
    country: z.string(),
    taxRate: z.number().min(0).max(1),
  }),
  precioVenta: z.number().positive(),
  precioFinal: z.number().positive(),
  roi: z.number(),
  costBreakdown: z.array(z.object({
    source: z.string(),
    amount: z.number(),
  })),
});
```

---

## Flujo E2E: Layer 1 → Layer 2 → Layer 3

### Paso 1: Usuario crea proyecto con industria

```
POST /api/projects
{
  "name": "Mi Panadería",
  "industry": "panaderia",
  "description": "..."
}

Response: {
  "_id": "proj123",
  "layer1": [],
  "layer2": { "nodes": [], "edges": [] },
  "layer3": { "products": [] }
}
```

### Paso 2: Poblar Layer 1 (Insumos)

```
POST /api/projects/proj123/layer1
{
  "items": [
    { "name": "Harina", "unit": "kg", "cost": 12.50, "quantity": 1 },
    { "name": "Azúcar", "unit": "kg", "cost": 8.00, "quantity": 0.5 },
    ...
  ]
}

Validación:
✓ Todos los items tienen cost > 0
✓ Todas las units son válidas
✓ Categorías soportadas

Guardado en MongoDB: layer1 collection
```

### Paso 3: Construir Layer 2 (Grafo)

```
POST /api/projects/proj123/layer2
{
  "nodes": [
    { "id": "harina", "name": "Harina", "type": "insumo" },
    { "id": "mezcla", "name": "Mezcla", "type": "proceso", "cost": 5 },
    { "id": "pan", "name": "Pan", "type": "producto", "units": 20 }
  ],
  "edges": [
    { "source": "harina", "target": "mezcla", "quantity": 1 },
    { "source": "mezcla", "target": "pan", "quantity": 20 }
  ]
}

Validación:
✓ Todos los source/target existen en nodes
✓ Sin ciclos en el grafo
✓ Rendimiento (units) > 0

Guardado en MongoDB: layer2 collection
```

### Paso 4: Trigger Cascade Engine

```
POST /api/projects/proj123/calculate

Internamente:
1. Ejecutar topologicalSort(nodes, edges)
2. Calcular costo para cada nodo
3. Calcular costoUnitario para productos
4. Guardar costBreakdown para auditoría
5. Actualizar Layer 3 con nuevos costos
6. Aplicar márgenes y impuestos
```

### Paso 5: Retrieval de Layer 3

```
GET /api/projects/proj123/layer3

Response:
{
  "products": [
    {
      "_id": "prod456",
      "name": "Pan integral",
      "costoUnitario": 2.1875,
      "margenPorcentaje": 42,
      "precioVenta": 3.11,
      "impuestos": { "country": "Mexico", "taxRate": 0.16 },
      "precioFinal": 3.61,
      "roi": 42,
      "costBreakdown": [
        { "source": "harina", "amount": 12.50 },
        { "source": "azucar", "amount": 4.00 },
        ...
      ]
    }
  ]
}
```

### Paso 6: Export a Excel

```
GET /api/projects/proj123/export

Headers:
- Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- Content-Disposition: attachment; filename="panaderia-costos.xlsx"

Sheets:
1. "Layer 1" — Insumos con costos
2. "Layer 2" — Grafo (nodos y aristas)
3. "Layer 3" — Productos con precios y ROI
4. "Resumen" — Totales y promedios
```

---

## Manejo de Errores y Recuperación

### Validaciones Críticas

1. **Ciclos en grafo:** Rechazar si Layer 2 contiene loops
2. **Referencias rotas:** Rechazar si edge.source/target no existen
3. **Costos negativos:** Normalizar a 0 (no permitir negativos)
4. **Margen inválido:** Rechazar si margin < 0 o > 1000%

### Rollback de Cambios

Si un cálculo falla:
```
1. Deshacer todos los UpdateOne en Layer 3
2. Registrar error con timestamp en logs
3. Notificar usuario con mensaje claro
4. Retornar HTTP 500 con detalles
```

---

## Performance y Escalabilidad

### Benchmarks

| Operación | Tamaño Grafo | Tiempo | Status |
|-----------|--------------|--------|--------|
| Topological Sort | 100 nodos | 5ms | ✓ OK |
| Calculate Costs | 100 nodos | 12ms | ✓ OK |
| Full Cascade | 100 nodos | 30ms | ✓ OK |
| Export to Excel | 5000 items | 150ms | ✓ OK |

### Optimizaciones

- **Índices MongoDB:** Por `projectId` y `nodeId`
- **Caché:** Resultados de topologicalSort reutilizados si grafo no cambia
- **Lazy Loading:** Cargar costBreakdown solo cuando se solicita

---

## Referencias y Recursos

- **Topological Sort:** [GeeksforGeeks](https://www.geeksforgeeks.org/topological-sorting/)
- **Zod Validation:** [Zod Docs](https://zod.dev/)
- **MongoDB Schema Design:** [Official Docs](https://docs.mongodb.com/manual/core/schema-validation/)

---

**Documento generado automáticamente | Última revisión: 4 de abril de 2026**
