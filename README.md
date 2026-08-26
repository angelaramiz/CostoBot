# 🤖 CostoBot — Calculadora de Costos Inteligente

**CostoBot** es un SaaS conversacional que ayuda a emprendedores latinoamericanos a calcular costos reales de sus negocios en 5 minutos. Sin Excel, sin consultores caros — solo una IA amigable que te guía paso a paso.

---

## 🎯 Por Qué CostoBot

| Problema | Solución CostoBot |
|----------|------------------|
| ❌ Excel manual propenso a errores | ✅ Estructura automática con cálculos precisos |
| ❌ No sé cuánto me cuesta realmente | ✅ Desglose completo de insumos → precio final |
| ❌ Consultor financiero = $200/hora | ✅ $9/mes o gratis para empezar |
| ❌ Cambio un dato y se rompe todo | ✅ Actualización en cascada automática |

---

## 🏗️ Cómo Funciona

### **El Flujo:**
```
1. Usuario nuevo → Chat de bienvenida IA
   ↓
2. Responde 5 preguntas sobre su negocio
   ↓
3. IA sugiere estructura de costos
   ↓
4. Usuario llena datos (insumos, procesos, precios)
   ↓
5. Sistema calcula todo automáticamente
   ↓
6. Exporta a Excel o guarda en la nube
```

### **Arquitectura:**
```
Frontend (Next.js)          Backend (Node.js)        Base de Datos
  ↓                              ↓                        ↓
Tabla editable      →    Motor de cálculos    →   MongoDB
JSON local (Zustand)     Motor de IA (OpenRouter)  Firebase Auth
Sync cada 5s             Validación de datos
```

---

## 💡 Las 3 Capas Coherentes de CostoBot

CostoBot organiza los costos en **3 capas interconectadas con unidades coherentes**. Cada cambio se propaga automáticamente.

### **Capa 1️⃣ — Insumos (Catálogo coherente)**
Registras TODO lo que compras, con unidad filtrada por categoría y conversión precisa.

**Unidades por categoría** (`lib/units.ts`):
- **Ingrediente:** Peso `mg/g/kg/oz/lb` · Volumen `ml/L/fl_oz/gal` · Cantidad `pza/paquete`
- **Material:** `pza/paquete`
- **Utensilio:** `pza` (costo por depreciación, no por unidad)
- **Máquina:** `pza/hr` (tarifa por hora o servicio)

**Paquete como contenedor:** `Paquete 4×1L Leche $120` → `$30/L`, `Caja 20kg Carne` → costo interno pro-rata. Si es `paquete`, defines contenido interno (ej: 20 `kg`) y el costo se prorratea automático.

**Ejemplo: Panadería**
| Insumo | Unidad | Precio | Cantidad/Pan | Costo |
|--------|--------|--------|--------------|-------|
| Harina integral | kg | $2.50 | 500 g (0.5 kg) | $1.25 |
| Levadura | g | $0.05 | 10 g | $0.50 |
| Paquete Leche 4L | paquete 4 L $120 | $30/L | 250 ml | $7.50 |
| **Total Insumos** | | | | **$9.25** |

> Conversión sin redondeos raros: `500 g → kg` vía `calculateIngredientCost` (`500*1000/1e6`).

---

### **Capa 2️⃣ — Productos (Grafo visual)**
Conectas insumos en un grafo dirigido (ReactFlow). Cada nodo elige insumo y cantidad con **unidad compatible** (si el insumo es `kg`, puedes usar `g/kg/oz/lb`).

**Ejemplo: Panadería**
```
Harina 500g ─┐
Leche 250ml ─┤→ [Mezcla] ──→ [Horno 20min, 1.5kW] ──→ [Resultado: 20 panes]
Sal 5g ──────┘                              ↑ empaque: bolsa pza
```
- Costos: ingredientes con conversión + máquinas (`kW·h·tarifa` o `$/hr`) + utensilios por depreciación + servicios + empaque + yield (merma).

---

### **Capa 3️⃣ — Precios (Producto final correcto)**
Cálculo coherente **por lote y por unidad**:

```
Costo por lote (20 panes):
  Ingredientes:        $9.25
  Máquinas:            $0.90
  Utensilios:          $0.10
  Servicios:           $0.40
  Empaque (20×$0.50):  $10.00
  Mano de obra (extra):$5.00
  Gastos fijos prorrateados: $3.00 (renta $3000/1000u → $3/u ×20)
  ───────────────────────────────
  COSTO TOTAL LOTE:    $28.65 → $1.43 / unidad
  Margen 56%:          +$16.04
  Precio lote:         $44.69 → $2.23 / unidad
  IVA 16%:             +$7.15 ($0.36/u)
  Precio final:        $51.84 → $2.59 / unidad
  Ganancia:            $16.04 lote / $0.80 u — ROI 31%
```

- **Gastos Fijos (mensuales):** renta, servicios base, sueldos → prorrateo por unidad (`totalFijos/unidadesMes * unidadesLote`) o por peso del costo.
- **Gastos Agregados (por lote):** mano de obra, empaque/envío, otros → share proporcional.
- **Impuestos:** suma de tasas habilitadas (IVA 16% MX) → `precioConImpuestos = precioVenta + impuestoMonto`.
- Todo recalculado en cascada si cambias harina en Capa 1.

---

## 🔄 Actualización en Cascada (La Magia)

**Scenario:** Cambias harina $2.50/kg → $3.00/kg.

```
HARINA: $2.50 → $3.00 (+$0.50/kg)

↓ Automáticamente:

Capa 1 (Insumos):    Harina 500g: $1.25 → $1.50 (+$0.25/u)
    ↓
Capa 2 (Productos):  Lote 20 panes: $28.65 → $33.65 (+$5 lote / +$0.25/u)
    ↓
Capa 3 (Precios):    Precio final 20u: $51.84 → $59.34 (+$0.38/u)
                     Ganancia/u: $0.80 → $0.73
                     Gastos fijos y agregados prorrateados se recalculan por unidad
```

**Todo recalculado en < 500ms. Sin presionar botones. Sin errores.**
- Conversión `g→kg`, `ml→L`, `paquete 4L` y prorrateo de fijos por `unidadesMes` incluidos.

---

## ⚙️ Características Principales

### ✅ **MVP (Fase 1)**
- 🤖 Chat IA conversacional para guía
- 📋 3 capas coherentes (Insumos → Productos grafo → Precios por lote/unidad)
- ⚖️ Unidades coherentes por categoría + `paquete` contenedor (4 L, 20 kg) con conversión precisa
- 🧾 Guía de extracción de ticket a la par (folio, IVA, propina no deducible)
- 📊 Gastos fijos mensuales prorrateados + agregados por lote + impuestos con desglose por unidad
- 🔄 Cálculos en cascada automática
- 📊 Tabla editable + grafo ReactFlow
- 💾 Guardado en tiempo real (5s debounce)
- 📥 Exporta a Excel o JSON
- 🔐 Autenticación Firebase
- 📱 Responsive mobile

### 🚧 **Próximas Fases**
- **Fase 2:** Validación express + semáforo de viabilidad
- **Fase 3:** Simulador "¿Qué pasa si...?" + Team Collaboration

---

## 🎬 Simulación Completa

### **Paso 1: Bienvenida**
```
Usuario: Accede al chat

CostoBot: ¡Hola! Soy CostoBot. En 5 minutos voy a ayudarte 
a calcular cuánto cuesta tu negocio realmente.

¿Qué es lo que produces o vendes?
```

### **Paso 2: Descubrimiento**
```
Usuario: Tengo una panadería artesanal en Lima.

CostoBot: Perfecto. Vamos a llenar tu estructura de costos.

Primero: ¿Cuáles son tus 3 insumos principales?
```

### **Paso 3: Llenado de Datos**
```
Usuario: Harina, levadura, sal

CostoBot: Excelente. Ahora dime:
- ¿Cuánto cuesta el kg de harina?
- ¿Cuánto usas por pan?

(Usuario: $2.50 / kg, 0.5 kg por pan)

CostoBot: ✅ Perfecto, tu costo de harina es $1.25/pan.

Ahora agrega levadura y sal...
```

### **Paso 4: Procesos**
```
CostoBot: Ahora vamos con PROCESOS.
¿Cuánto te cuesta hacer un pan? (mano de obra + energía)

Usuario: Unos $1.40 en promedio

CostoBot: ✅ Registrado. Tu costo total de producción es $3.70/pan.
```

### **Paso 5: Precios**
```
CostoBot: Último paso. ¿A cuánto vendes cada pan?

Usuario: A $8.50

CostoBot: ✅ ¡Excelente!

Tu ganancia por pan es $4.80 (56% margen).
Necesitas vender 42 panes/día para cubrir gastos fijos.
Si vendes 200 panes/día, ganas $960.

¿Quieres exportar esto a Excel o guardarlo para después?
```

### **Paso 6: Exportación**
```
CostoBot: ✅ Descargando tu reporte...

Archivo: CostoBot_Panaderia_Lima_Mar2026.xlsx
(Con todas tus capas en hojas separadas)
```

---

## 🛠️ Tech Stack

| Capa | Tecnología |
|------|------------|
| **Frontend** | Next.js 16 + React 18 + TypeScript + Tailwind · Render |
| **Estado Local** | Zustand (JSON reactivo) + sync 5s a MongoDB |
| **Backend** | Node.js + Express + Helmet + Rate Limit · Render |
| **Base de Datos** | MongoDB Atlas (Mongoose) + Firebase Auth |
| **IA** | OpenRouter (Nemotron) + Ollama/LM Studio (adapter) |
| **Cálculos** | Motor determinista `services/calculation` + `lib/units` (conversión precisa) |
| **Exportación** | SheetJS (Excel multi-hoja) + JSON |
| **Tickets** | `lib/ticket` + `TicketExtractionGuide` (guía a la par) |
| **Hosting** | Render (frontend + backend) |

---

## 📦 Instalación & Setup



---

## 📊 Casos de Uso

### ✨ Caso 1: Panadería Artesanal
**Problema:** No sé si soy rentable vendiendo a $8/pan  
**Solución:** CostoBot calcula que necesitas $3.70 para producir → margen $4.30  
**Resultado:** Sabes exactamente cuántos panes vender para vivir

### ✨ Caso 2: E-commerce de Ropa
**Problema:** Compro desde China pero no sé márgenes  
**Solución:** CostoBot suma: precio compra + envío + impuestos + almacén  
**Resultado:** Sabes a qué precio vender en redes

### ✨ Caso 3: Servicio de Consultoría
**Problema:** ¿A cuánto cobro por hora?  
**Solución:** CostoBot suma: tiempo + gastos fijos + impuestos  
**Resultado:** Precio mínimo por hora para ser rentable

---

## 💰 Planes de Precio

| Plan | Precio | Características |
|------|--------|-----------------|
| **Free** | $0 | 1 proyecto, exportación PDF |
| **Pro** | $9/mes | Proyectos ilimitados, Excel |
| **Business** | $49/mes | Team, simulador, soporte |

---

## 🚀 Roadmap

### 🟢 Active (Completado)
- Login/Registro con IA
- 4 capas multi-hoja
- Cálculos en cascada
- Exportación Excel

### 🟡 En Desarrollo
- Dashboard mejorado
- Validación de viabilidad express
- Analytics básico

### ⚪ Próximo
- Simulador de escenarios
- Integración con datos de mercado
- Colaboración en equipo

---

## 📞 Contacto & Soporte

- **GitHub:** [angelaramiz/CostoBot](https://github.com/angelaramiz/CostoBot)
- **Issues:** Reporta bugs en GitHub Issues
- **Email:** support@costobot.app (próximamente)

---

## 📄 Licencia

MIT License — Puedes usar, modificar y distribuir libremente.

---

**CostoBot: Claridad Financiera para Emprendedores Latinoamericanos** 🚀
