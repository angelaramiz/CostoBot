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

## 💡 Las 4 Capas de CostoBot

CostoBot organiza los costos en **4 capas interconectadas**. Cada cambio en una se refleja automáticamente en las demás.

### **Capa 1️⃣ — Insumos (Materiales)**
Aquí registras TODO lo que necesitas para producir.

**Ejemplo: Panadería**
| Insumo | Unidad | Precio | Cantidad/Pan | Costo Total |
|--------|--------|--------|--------------|-------------|
| Harina integral | kg | $2.50 | 0.5 kg | $1.25 |
| Levadura | g | $0.05 | 10 g | $0.50 |
| Sal | g | $0.01 | 5 g | $0.05 |
| **Total Insumos** | | | | **$1.80** |

**¿Qué incluir?**
- Materias primas (ingredientes, telas, materiales)
- Empaques
- Etiquetas

---

### **Capa 2️⃣ — Procesos (Producción)**
Define cuánto cuesta **hacer** el producto.

**Ejemplo: Panadería**
| Proceso | Tiempo | Costo Mano Obra | Energía | Costo Total |
|---------|--------|-----------------|---------|-------------|
| Mezclar | 5 min | $0.30 | $0.05 | $0.35 |
| Reposo | 30 min | $0.00 | $0.15 | $0.15 |
| Hornear | 20 min | $0.50 | $0.40 | $0.90 |
| **Total Procesos** | | | | **$1.40** |

**¿Qué incluir?**
- Tiempo de mano de obra
- Consumo de energía/gas
- Desgaste de equipos
- Control de calidad

---

### **Capa 3️⃣ — Productos (Costo Final)**
El sistema **calcula automáticamente** cuánto cuesta cada unidad.

**Ejemplo: Panadería**
```
Costo por Pan Francés:
  Insumos (Capa 1):     $1.80
  Procesos (Capa 2):    $1.40
  Gastos Fijos:         $0.50  ← (arriendo, servicios, etc.)
  ─────────────────────────────
  COSTO TOTAL:          $3.70
```

Si cambias el precio de la harina en Capa 1, **automáticamente se recalcula todo en Capa 3**.

---

### **Capa 4️⃣ — Precios (Venta & Rentabilidad)**
Define cuánto cobras y qué ganancias obtienes.

**Ejemplo: Panadería**
```
Costo por Pan (Capa 3):         $3.70
Precio de Venta:                $8.50
────────────────────────────────
Ganancia por Pan:               $4.80
Margen (%):                     56%
────────────────────────────────
Panes para Break-Even:          42 panes/día
Ganancia diaria (si vendes 200): $960
```

**¿Qué defines aquí?**
- Precio de venta final
- Descuentos (mayoreo, promociones)
- Margen de ganancia
- Punto de equilibrio (cuándo empezacas a ganar)

---

## 🔄 Actualización en Cascada (La Magia)

**Scenario:** Cambias el precio de la harina.

```
HARINA: $2.50 → $3.00

↓ Automáticamente se actualiza:

Capa 1 (Insumos):         Costo/unidad: +$0.50
    ↓
Capa 3 (Productos):       Costo total: $3.70 → $4.20
    ↓
Capa 4 (Precios):         Ganancia/pan: $4.80 → $4.30
                          Break-even: 42 panes → 46 panes
```

**Todo recalculado en < 500ms. Sin presionar botones. Sin errores.**

---

## ⚙️ Características Principales

### ✅ **MVP (Fase 1)**
- 🤖 Chat IA conversacional para guía
- 📋 4 capas de costos multi-hoja
- 🔄 Cálculos en cascada automática
- 📊 Tabla editable para cada capa
- 💾 Guardado en tiempo real
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
| **Frontend** | Next.js 14 + React + TypeScript + Tailwind |
| **Estado Local** | Zustand (JSON reactivo) |
| **Backend** | Node.js + Express |
| **Base de Datos** | MongoDB Atlas |
| **Auth** | Firebase Auth |
| **IA** | OpenRouter API (Nemotron) |
| **Exportación** | SheetJS (Excel) |
| **Hosting** | Vercel (frontend) + Render (backend) |

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
