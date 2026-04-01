# AGENT_COMMANDS.md — CostoBot

> Referencia rápida de todos los comandos disponibles para agentes IA y desarrolladores.  
> Leer junto con `.claude/CLAUDE.md` antes de generar código.

---

## Comandos de Desarrollo

```bash
npm run dev            # Next.js dev server en localhost:3000
npm run build          # Build de producción
npm run start          # Servidor de producción
npm run lint           # ESLint + Prettier check
npm run test           # Jest test suite
npm run test:watch     # Jest en modo watch
npm run test:coverage  # Jest con reporte de cobertura
```

---

## Comandos de Versionamiento

```bash
# Bumps manuales (requiere estar en main, sin cambios sin commitear)
npm run version:patch "mensaje del fix"
npm run version:minor "mensaje del feature"
npm run version:major "mensaje del breaking change"

# Rollback a versión anterior via git tags
npm run version:rollback

# Hook management
npm run version:setup-hooks    # Instalar post-commit hook
npm run version:remove-hooks   # Desinstalar post-commit hook

# Auditoría y validación
npm run version:audit          # Valida estado antes de bump
npm run version:check          # Compara versión local vs remota
```

---

## Comandos de Contexto IA

```bash
# Auditar archivos de contexto (verifica que todos existen)
npm run context:audit

# Actualizar "Last updated" en CLAUDE.md
npm run context:update

# Agregar un ADR a ARCHITECTURE.md
npm run context:adr "Título del ADR"
# Ejemplo: npm run context:adr "Usar Redis para sesiones"
```

---

## Comandos de Reglas

```bash
# Listar todas las reglas de CLAUDE.md
npm run rules:list

# Agregar regla al bloque ALWAYS DO
npm run rules:add "Usar Zod para validar respuestas de IA"

# Agregar regla al bloque NEVER DO
npm run rules:add "Hacer push sin correr tests" --never
```

---

## Comandos de Memoria

```bash
# Exportar archivos de .claude/memory/ a JSON
npm run memory:export
# → Genera contextoIA/memory-export-YYYY-MM-DD.json

# Importar un snapshot de memoria
npm run memory:import contextoIA/memory-export-2026-01-01.json
```

---

## Estructura de Carpetas Clave

```
CostoBot/
├── .claude/
│   ├── CLAUDE.md                  ← LEER PRIMERO (reglas del agente)
│   ├── memory/
│   │   ├── architecture-rules.md  ← Constraints arquitecturales
│   │   ├── corrections-log.md     ← Correcciones del usuario
│   │   └── versioning-rules.md    ← Configuración AUTONOMOUS
│   └── scripts/                   ← Scripts de mantenimiento
├── .agente/                       ← Sistema de agente (en .gitignore)
│   ├── core/
│   │   └── agent-core.md          ← Agente activo (NO editar, NO commitear)
│   ├── docs/
│   │   ├── IMPLEMENTATION_ROADMAP.md ← Mapa de fases del proyecto
│   │   └── IMPLEMENTATION_REPORT.md  ← Reporte de implementación
│   ├── backups/                   ← Backups del agente (agent:update)
│   └── TODO/
│       ├── pendiente/             ← .md tasks por hacer
│       ├── en_progreso/           ← .md task activa
│       └── completado/            ← .md tasks finalizadas
├── frontend/                      ← Next.js app + scripts versioning
├── backend/                       ← Node.js + Express server
├── database/                      ← SQL/MongoDB schemas
├── contextoIA/                    ← Documentos del proyecto (en .gitignore)
├── PROJECT_CONTEXT.md             ← Stack, deps, env vars
├── ARCHITECTURE.md                ← ADRs (decisiones arquitecturales)
├── VERSIONING_MAINTENANCE_GUIDE.md← Este sistema explicado
└── SECURITY_CONFIG.md             ← Checklist de seguridad
```

---

## Convenciones de Commit

| Prefijo | Tipo | Efecto en versión |
|---------|------|-------------------|
| `🐛 fix:` | Bug fix | PATCH bump (x.x.N) |
| `✨ feat:` | Nueva feature | MINOR bump (x.N.0) |
| `💥 BREAKING:` | Breaking change | MAJOR bump (N.0.0) |
| `📦 version:` | Versión bump (auto) | Sin efecto |
| `📝 docs:` | Documentación | Sin efecto |
| `🔖 chore:` | Mantenimiento | Sin efecto |
| `🔀 merge:` | Merge | Sin efecto |

---

## Variables de Entorno Críticas

| Variable | Uso | Quién la lee |
|----------|-----|-------------|
| `GIT_PAT_TOKEN` | Push autónomo a GitHub | `post-commit-version.js` |
| `PUBLIC_API_KEY` | Autenticar `GET /api/version` | Frontend + Backend |
| `INTERNAL_API_KEY` | Autenticar `POST /api/version/record` | Backend |
| `DATABASE_URL` | Conexión MongoDB | Backend |
| `NEXT_PUBLIC_API_URL` | URL del backend desde Next.js | Frontend |
| `OPENROUTER_API_KEY` | IA por OpenRouter | Backend |
| `IA_PROVIDER` | Proveedor IA activo (`openrouter`/`lmstudio`/`ollama`) | Backend |

---

## Reglas para Agentes IA

Antes de generar cualquier código, leer:
1. `.claude/CLAUDE.md` → Reglas, convenciones, stack
2. `PROJECT_CONTEXT.md` → Dependencias, env vars
3. `ARCHITECTURE.md` → ADRs, decisiones tomadas
4. `.claude/memory/corrections-log.md` → Correcciones del usuario

### Nunca hacer sin leer el contexto:
- Modificar el esquema Zod sin verificar backward compatibility
- Crear componentes sin seguir las convenciones de naming
- Hacer cambios en la cascade engine sin validar el dependency graph
- Generar código con `any` o sin interfaces TypeScript

---

---

## Comandos de Agente en Lenguaje Natural

> Instrucciones que el agente interpreta directamente en el chat.

### Frases de activación

| Frase | Qué activa |
|-------|-----------|
| `"Implementa el sistema de versionamiento"` | Flujo completo desde cero |
| `"Implementa versionamiento standard/advanced/autonomous"` | Flujo directo al modo elegido |
| `"Audit my versioning system"` | Health check sin npm |
| `"I need to restructure my project architecture"` | Wizard de migración |
| `"Estoy separando mi frontend del backend"` | Migration wizard monolith → separado |
| `"Agrega una regla sobre..."` | Añade regla a CLAUDE.md sin npm |
| `"Ya pegué mis archivos en contextoIA, continúa"` | Lectura de contextoIA/ (Greenfield Autonomous) |
| `"Actualiza el contexto del proyecto"` | Re-scan y refresh de PROJECT_CONTEXT.md |
| `agent:update` | Actualizar agente con backup automático |
| `agent:add-specialist [uxui/security/chat]` | Instala agente especialista |
| `task:list` | Listar todas las tareas pendientes (Notion: CostoBot-TDL) |
| `task:fetch` | Traer la siguiente tarea de mayor prioridad |
| `task:execute [name]` | Ejecutar una tarea (flujo completo: mark → execute → archive) |
| `task:stats` | Ver estadísticas del sistema de tareas |
| `task:cron [on/off] [interval]` | Activar/desactivar sincronización automática (ej: `task:cron on 1h`) |
| `config:update` | Actualizar configuración del proyecto |

### Protocolo `agent:update` (actualizado v2)

**Archivos necesarios en `.agente/update_agent/`:**
- `agent-unified.agent.md` — nueva versión del agente
- `AGENT_COMMANDS.md` — del repo agente_versionamiento/

| Paso | Qué hace el agente |
|------|--------------------|
| 0 — Verificar | Confirma que `.agente/core/agent-core.agent.md` existe |
| 1 — Preparar | Crea `.agente/update_agent/` y pide que el dev copie ambos archivos |
| 2 — Analizar | Lee ambas versiones, genera reporte de diferencias |
| 3 — Confirmar | Muestra reporte y **espera confirmación** antes de tocar nada |
| 4 — Backup | Crea `.agente/backups/{{timestamp}}_agent-core.bak.md` — si falla, cancela todo |
| 5 — Aplicar | Reemplaza `agent-core.agent.md` con el nuevo contenido |
| 6 — Sincronizar | Extrae nuevos comandos de `AGENT_COMMANDS.md` y los aplica (append, never overwrite) |
| 7 — Limpiar | Elimina `.agente/update_agent/` y muestra resumen |

**Rollback:** `"agent:update rollback"` → lista backups y restaura el elegido.

---

## 🔗 Sistema de Tareas — Notion MCP Integration (NUEVO)

> ⚠️ **Cambio importante:** El sistema de tareas ahora usa **Notion MCP** en lugar de archivos `.md` locales.  
> Las carpetas `.agente/TODO/` y `.agente/HISTORIAL/` son **obsoletas** (pueden eliminarse).

### Bases de datos Notion utilizadas

| Base | Propósito | Data Source |
|------|----------|------------|
| **CostoBot-TDL** | Tareas operativas (pendientes, en curso) | `collection://331e72c1-e746-8082-8e18-000bdb2076ec` |
| **CostoBot-Hy** | Tareas completadas con reportes | `collection://331e72c1-e746-8046-9451-000bd835d62c` |

### Protocolo `task:list` (Notion MCP)

Usa `notion-search` para traer todas las tareas con Estado = "Sin empezar":

```
notion-search({
  query: "tareas pendientes Estado='Sin empezar'",
  data_source_url: "collection://331e72c1-e746-8082-8e18-000bdb2076ec",
  page_size: 25
})
```

**Output esperado:**
```
📋 Tareas Pendientes — CostoBot-TDL

  🔴 Implementar autenticación Firebase              [Backend, API]
  🟠 Integrar Stripe checkout                        [Frontend, API]
  🟡 Refactor de store Zustand                       [Frontend, Database]
  🟢 Documentar endpoints                            [Backend]

Total: 4 pendientes | 2 en proceso | 8 completadas hoy
```

### Protocolo `task:fetch` (Notion MCP)

Trae la próxima tarea de mayor prioridad (similar a `task:list` pero limitado a 1):

```
Siguiente tarea (ALTA prioridad):
🔴 Implementar autenticación Firebase
    URL: https://notion.so/331e72c1e74680619407c101b2ee3dbb
    Etiquetas: [Backend, API]
    Creada: 2026-03-27

¿Iniciar ejecución? (s/n): _
```

### Protocolo `task:execute [name]` (Notion MCP + Execution)

Ejecuta el flujo completo de una tarea:

1. **Buscar** tarea en CostoBot-TDL
2. **Marcar "En curso"** — `notion-update-page`
3. **Ejecutar** — Tu trabajo como agente
4. **Generar reporte** — Markdown con detalles
5. **Crear en CostoBot-Hy** — `notion-create-pages` con reporte adjunto
6. **Marcar "Listo"** en CostoBot-TDL — `notion-update-page`

**Ejemplo:**
```
task:execute Implementar autenticación Firebase

✅ Paso 1: Buscando en Notion...
✅ Paso 2: Marcando como "En curso"...
⚙️  Paso 3: Ejecutando [847ms]...
   - Instalado firebase-admin SDK
   - Middleware creado: backend/middleware/verifyFirebaseToken.js
   - Tests: 12 passed ✅
📝 Paso 4: Generando reporte...
📦 Paso 5: Archivando en CostoBot-Hy...
✅ Paso 6: Marcando como "Listo" en CostoBot-TDL...

✨ Tarea completada. Reporte: https://notion.so/xxxxxxx
```

### Protocolo `task:stats` (Notion MCP Query)

Trae estadísticas de ejecución del sistema:

```
📊 Estadísticas del Sistema de Tareas

Tareas Operativas (CostoBot-TDL):
  • Sin empezar:  4
  • En curso:     2
  • Listo:        8

Estadísticas de Ejecución:
  • Completadas hoy:         8
  • Tiempo promedio:         847ms
  • Tareas CRÍTICA (Alta):   3 pendientes
  • Tasa de éxito:           100% (8/8 completadas)

Próxima tarea:
  🔴 Integrar Stripe checkout (Alta) — creada hace 2h
```

### Protocolo `task:cron [on/off] [interval]` (Automático)

Activa/desactiva sincronización automática con Notion:

```
task:cron on 1h
✅ Sincronización automática ACTIVADA
   Intervalo: cada 1 hora
   Próxima sincronización: 2026-03-28 15:32

task:cron off
✅ Sincronización automática DESACTIVADA
   Cambios manuales solo (task:execute, task:list)
```

### Protocolo `task:plan` (IA-powered Task Breakdown)

Genera un plan detallado de tareas desde descripción del usuario, luego sube automáticamente a CostoBot-TDL:

```
task:plan Implementar sistema de autenticación JWT con refresh tokens y roles

🎯 Analizando requisito...
   • 5 tareas identificadas
   • 2 dependencias críticas
   • Tiempo estimado: 5.25 horas

📋 Plan generado:
   1️⃣  Instalar y configurar Firebase            [Backend, API]       — 30 min
   2️⃣  Crear middleware de verificación JWT      [Backend, API]       — 45 min  → depende de 1
   3️⃣  Implementar refresh tokens                [Backend, Database]  — 60 min  → depende de 2
   4️⃣  Agregar sistema de roles/permisos         [Backend, API]       — 90 min  → depende de 2
   5️⃣  Escribir tests                            [Backend, Bug]       — 120 min → depende de 2,3,4

✅ ¿Subir este plan a CostoBot-TDL? (s/n): s

📤 Subiendo tareas...
   ✅ Tarea 1 creada: https://notion.so/xxxxx
   ✅ Tarea 2 creada: https://notion.so/xxxxx
   ✅ Tarea 3 creada: https://notion.so/xxxxx
   ✅ Tarea 4 creada: https://notion.so/xxxxx
   ✅ Tarea 5 creada: https://notion.so/xxxxx

✨ Plan completado. 5 tareas listas para ejecutar con task:execute
```

**Cómo funciona:**

1. **Análisis** — IA desglosa el requisito en tareas atómicas
2. **Validación** — Verifica que cada tarea sea independiente (~1-2h de trabajo)
3. **Formato Notion** — Convierte a formato CostoBot-TDL (Nombre, Prioridad, Etiquetas, Estado)
4. **Carga** — Sube todas las tareas con Estado = "Sin empezar"
5. **Reporte** — Muestra URLs y resumen

**Ejemplo de uso:**
```
task:plan Integrar Stripe checkout con manejo de errores

// == Resultado ==

📋 5 tareas creadas:
   📦 Setup Stripe SDK en backend
   🎨 Crear componente CheckoutForm
   💳 Validar datos de tarjeta
   📧 Enviar confirmación por email
   🧪 Escribir tests E2E
```

**Para ver el plan completo:**
- Ejecutar `task:list` — Ver todas las tareas en CostoBot-TDL
- Ejecutar `task:fetch` — Traer la de mayor prioridad
- Ejecutar `task:execute [nombre]` — Ejecutar una tarea específica

### Módulos TypeScript asociados

Ver `.agente/task-management/`:
- `task-types.ts` — Interfaces y tipos
- `notion-tasks.ts` — Funciones de integración Notion
- `task-executor.ts` — Orquestación del flujo

Ver documentación completa: `.agente/task-execution/INTEGRATION.md`

### Protocolo `config:update`

| Forma | Ejemplo | Qué hace |
|-------|---------|----------|
| Campo puntual | `"config:update repo: https://github.com/..."` | Actualiza solo ese campo |
| Varios campos | `"config:update: repo=https://... ; db=PostgreSQL"` | Actualiza todos |
| Desde archivo | `"config:update ancla contextoIA/nuevos-datos.md"` | Lee el archivo y extrae campos |
| Interactivo | `"config:update"` solo | Muestra campos, indica vacíos, pregunta uno a uno |

### Etiquetas de prioridad en tareas

| Etiqueta | Nivel | Cuándo usarla |
|----------|-------|---------------|
| `🔴 CRÍTICA` | 0 | Bug en producción, seguridad, bloquea a otros |
| `🟠 Alta` | 1 | Feature comprometida, deadline próximo |
| `🟡 Media` | 2 | Mejora planificada, refactor necesario |
| `🟢 Baja` | 3 | Nice-to-have, exploración, documentación |

---

## Archivos Clave del Sistema

| Archivo | Ubicación | Propósito |
|---------|-----------|----------|
| `agent-core.agent.md` | `.agente/core/` | Agente activo (v2 — `.agent.md` extension) — NO commitear |
| `agent-core.md` | `.agente/core/` | Versión anterior del agente (backup de referencia) |
| `IMPLEMENTATION_ROADMAP.md` | `.agente/docs/` | Plan de fases del proyecto |
| `IMPLEMENTATION_REPORT.md` | `.agente/docs/` | Reporte de implementación completada |
| `CLAUDE.md` | `.claude/` | Reglas maestras del agente — LEER PRIMERO |
| `architecture-rules.md` | `.claude/memory/` | Constraints arquitecturales |
| `corrections-log.md` | `.claude/memory/` | Correcciones del usuario |
| `versioning-rules.md` | `.claude/memory/` | Config AUTONOMOUS |
| `versionamiento.config.json` | `frontend/` | Config de versioning |
| `RELEASE_NOTES.md` | `frontend/` | Notas de versión actuales |

> ⚠️ **Nota de seguridad**: Los archivos en `.agente/` están en `.gitignore` y NUNCA deben commitarse. Contienen estado interno del agente.

---

## ➕ Agentes Especializados Disponibles

> Instalar con: `agent:add-specialist [nombre]`
> Los archivos van a `.agente/core/specialists/` tras la instalación.

### Flujo de instalación

```text
1. Activar: "agent:add-specialist uxui" (o security / chat)
2. El agente crea .agente/add_specialist/
3. Copiar el archivo del especialista + AGENT_COMMANDS.md a esa carpeta
4. Escribir: "ya copié el especialista, instala"
5. El agente lee contexto, ejecuta setup y mueve a .agente/core/specialists/
```

### Especialistas disponibles

| Especialista | Archivo | Activar con | Estado |
|-------------|---------|-------------|--------|
| 🎨 **uxui-specialist** | `agent-uxui.agent.md` | `"Implementa el design system"` | ✅ Instalado |
| 🔐 **cybersecurity-saas-specialist** | `agent-cybersecurity-saas.agent.md` | `"Audita la seguridad del proyecto"` | ✅ Instalado |
| 💬 **chat-interface-specialist** | `agent-chat-interface.agent.md` | `"Implementa el chat"` | ⬜ Pendiente |

### Comandos por especialista

**🎨 uxui:** `uxui:audit` · `uxui:a11y` · `uxui:tokens` · `uxui:darkmode` · `uxui:component [nombre]` · `uxui:animate`

**🔐 security:** `sec:audit` · `sec:auth` · `sec:tenants` · `sec:headers` · `sec:secrets` · `sec:deps` · `sec:gdpr`

**💬 chat:** `chat:ai` · `chat:realtime` · `chat:reactions` · `chat:threads` · `chat:files` · `chat:virtualscroll` · `chat:widget`

### Orden recomendado para SaaS completo

```text
① agent-unified       → versionamiento + contexto base
② uxui-specialist     → design system (tokens que usa el chat)
③ security-specialist → hardening antes de construir features
④ chat-specialist     → usa tokens de uxui + controles de security
```

### Integración entre agentes

```text
agent-unified → contexto y versionamiento del proyecto
  ├── uxui       → CSS, tokens, componentes, dark mode
  ├── security   → auth, rate-limit, secrets, GDPR
  └── chat       → streaming, WebSocket, archivos, historial
```

---

*Última actualización: 2026-03-20 — agent:add-specialist aplicado (uxui ✅ + security ✅).*
*Para actualizar este archivo: `agent:update` → el agente sincroniza secciones nuevas automáticamente.*
