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

```
task:new "título" "descripción"     # Crear nueva tarea en .agente/TODO/pendiente/
task:start [nombre]                  # Iniciar tarea pendiente por nombre (o la más crítica)
agent:update                         # Actualizar agent-core.md con nueva versión (con backup)
config:update                        # Actualizar versionamiento.config.json en runtime
```

### Protocolo `agent:update`
1. Leer nueva versión del agente desde `agentupdate/agent-unified.md`
2. Hacer backup: `.agente/backups/agent-core.backup-YYYY-MM-DD.md`
3. Copiar nueva versión a `.agente/core/agent-core.md`
4. Verificar que el backup existe antes de sobrescribir
5. Reportar diferencias clave detectadas

### Protocolo `task:start`
1. Si se da `[nombre]`, buscar en `.agente/TODO/pendiente/` por nombre parcial
2. Si no se da nombre, evaluar tareas pendientes y sugerir la más crítica por impacto
3. Mover archivo `.md` de `pendiente/` → `en_progreso/`
4. Leer el contenido del task y comenzar ejecución

---

## Archivos Clave del Sistema

| Archivo | Ubicación | Propósito |
|---------|-----------|----------|
| `agent-core.md` | `.agente/core/` | Agente activo — NO commitear, NO editar directamente |
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

*Generado por el agente de versionamiento CostoBot — actualizar cuando cambien comandos o convenciones.*
