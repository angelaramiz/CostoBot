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
| `task:new [título]` | Crear tarea en .agente/TODO/pendiente/ |
| `task:start [nombre]` | Iniciar tarea pendiente (o la más crítica) |
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

### Protocolo `task:new`

| Forma | Ejemplo | Qué hace |
|-------|---------|----------|
| Desde chat | `"task:new Integrar Stripe"` | Crea `tarea_XX_integrar_stripe.md` en `pendiente/` |
| Múltiples | `"task:new: 1) Migrar DB 2) Tests"` | Un archivo por ítem |
| Desde archivo | `"task:new ancla contextoIA/requisitos.md"` | Lee el archivo y extrae tareas |
| Desde carpeta | `"task:new ancla contextoIA/"` | Lee todos los archivos, genera tareas detectadas |
| Sin argumentos | `"task:new"` | Pregunta: ¿desde chat o desde archivo/carpeta? |

### Protocolo `task:start`

Muestra listado ordenado por prioridad y pide confirmación:

```
📋 Tareas pendientes
  🔴 tarea_03_correccion_critica.md   CRÍTICA
  🟠 tarea_05_integrar_stripe.md      Alta
  🟡 tarea_06_endpoints.md            Media
  🟢 tarea_08_refactor_ui.md          Baja

💡 Sugerencia: tarea_03 (CRÍTICA)
¿Iniciar? (s / elegir otra / cancelar): _
```

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

| Especialista | Archivo | Activar con |
|-------------|---------|-------------|
| 🎨 **uxui-specialist** | `agent-uxui.agent.md` | `"Implementa el design system"` |
| 🔐 **cybersecurity-saas-specialist** | `agent-cybersecurity-saas.agent.md` | `"Audita la seguridad del proyecto"` |
| 💬 **chat-interface-specialist** | `agent-chat-interface.agent.md` | `"Implementa el chat"` |

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

*Última actualización: 2026-03-20 — agent:update aplicado (v2 → agent-core.agent.md).*
*Para actualizar este archivo: `agent:update` → el agente sincroniza secciones nuevas automáticamente.*
