# VERSIONING_MAINTENANCE_GUIDE.md — CostoBot

> **Modo:** AUTONOMOUS  
> **Repositorio:** https://github.com/angelaramiz/CostoBot.git  
> **Rama:** main  
> **Última actualización:** 2026-03-19

---

## 1. Cómo Funciona el Versionamiento AUTONOMOUS

El sistema detecta el prefijo del commit y, si corresponde, te pregunta si deseas bumppear la versión y pushar automáticamente.

```
Usuario: git commit -m "🐛 fix: el cálculo de Layer 3 no propagaba"
         ↓
Hook: ¿Versionar y pushear a 1.0.1? (y/n): y
         ↓
Sistema: bump PATCH → 1.0.1
         Actualiza package.json
         Crea tag v1.0.1
         Genera RELEASE_NOTES.md
         Actualiza CHANGELOG.md
         Registra en DB
         git push origin main --tags
```

---

## 2. Prefijos Reconocidos

| Prefijo | Tipo de Bump | Ejemplo |
|---------|--------------|---------|
| `🐛` o `fix:` | PATCH (x.x.**N**) | `🐛 fix: validación de monto negativo` |
| `✨` o `feat:` | MINOR (x.**N**.0) | `✨ feat: exportación a XLSX` |
| `💥` o `BREAKING:` | MAJOR (**N**.0.0) | `💥 BREAKING: nuevo esquema de proyecto` |
| Otro prefijo | **Sin bump** | `📝 docs: actualizar README` |

**Prefijos que no disparan bump:**
- `📦 version:` (usado internamente por el sistema)
- `🔖 chore:`, `📝 docs:`, `🔀 merge:`

---

## 3. Flujo de Trabajo Diario

### Commit normal (sin versionamento)
```bash
git add .
git commit -m "🔖 chore: actualizar dependencias"
# → No dispara bump
```

### Commit con versionamiento automático
```bash
git add .
git commit -m "✨ feat: agregar cálculo de margen en Layer 4"
# → Hook te pregunta: ¿Versionar y pushear a 1.1.0? (y/n)
# → Escribe "y" para confirmar
# → Todo se hace automáticamente
```

### Saltar el hook (emergencias)
```bash
git commit --no-verify -m "mensaje urgente"
```

---

## 4. Comandos de Versionamiento

```bash
# Ver versión actual
node -e "console.log(require('./package.json').version)"

# Bump manual (sin hook)
npm run version:patch "descripción del fix"
npm run version:minor "descripción del feature"
npm run version:major "descripción del breaking change"

# Rollback a versión anterior
npm run version:rollback
# → Lista las versiones disponibles y pregunta a cuál regresar

# Instalar/reinstalar el hook
npm run version:setup-hooks

# Remover el hook
npm run version:remove-hooks

# Pre-validación (revisa que todo esté listo para bump)
npm run version:audit
```

---

## 5. Archivos del Sistema

| Archivo | Propósito | ¿Commiteado? |
|---------|-----------|--------------|
| `frontend/post-commit-version.js` | Core del hook AUTONOMOUS | ✅ Sí |
| `frontend/setup-hooks.js` | Instalador del hook | ✅ Sí |
| `frontend/bump-version.js` | Bump manual CLI | ✅ Sí |
| `frontend/bump-version-advanced.js` | Bump con git tags + CHANGELOG | ✅ Sí |
| `frontend/pre-bump-validation.js` | Validación pre-bump | ✅ Sí |
| `frontend/rollback-version.js` | Rollback de versión | ✅ Sí |
| `frontend/version-checker.js` | Check en página web | ✅ Sí |
| `frontend/RELEASE_NOTES.md` | Nota de la última versión | ✅ Sí |
| `frontend/CHANGELOG.md` | Historial completo | ✅ Sí |
| `frontend/versionamiento.config.json` | Config del repo | ❌ .gitignore |
| `.git/hooks/post-commit` | Hook activo de git | ❌ Generado |

---

## 6. Configuración del Token de GitHub

El hook usa `GIT_PAT_TOKEN` del archivo `.env` para hacer push autenticado.

**Si el token expira o necesitas rotarlo:**

1. Ve a GitHub → Settings → Developer settings → Personal access tokens
2. Genera un nuevo token con scope `repo`
3. Copia el token
4. Abre `.env` y actualiza `GIT_PAT_TOKEN=ghp_NUEVO_TOKEN`
5. El hook lo usará en el próximo commit automáticamente

**Token actual:** Ver `.env` → `GIT_PAT_TOKEN`  
**Scope:** `repo` (necesario para push)

---

## 7. Solución de Problemas

### "No .git directory found"
El hook no puede encontrar el repositorio. Asegúrate de ejecutar el comando desde la raíz del proyecto.

### "authentication failed" al hacer push
El token expiró o los permisos son insuficientes. Rota el PAT (ver sección 6).

### El hook no se dispara
Verifica que el hook esté instalado:
```bash
Get-Content .git/hooks/post-commit   # Windows
cat .git/hooks/post-commit           # Git Bash / macOS
```
Si no existe, reinstala con `npm run version:setup-hooks`.

### Quiero deshacer un bump ya hecho
```bash
npm run version:rollback
```
Esto crea una rama de backup y revierte a la versión anterior.

### El bump se hizo pero no se pusheó
```bash
git push origin main --tags
```

---

## 8. Mantenimiento Periódico

### Mensual
- [ ] Verificar que el PAT de GitHub no esté próximo a expirar
- [ ] Ejecutar `npm run context:audit` para validar archivos de contexto
- [ ] Revisar `frontend/CHANGELOG.md` y depurar entradas antiguas si es necesario

### Por cada cambio de stack o arquitectura
- [ ] Actualizar `ARCHITECTURE.md`: `npm run context:adr "Título del cambio"`
- [ ] Actualizar `PROJECT_CONTEXT.md` si cambian dependencias
- [ ] Actualizar `.claude/CLAUDE.md` si cambian las convenciones

---

## 9. Reinstalación en un Clon Nuevo

Después de `git clone`:

```bash
cd CostoBot
cp .env.example .env        # Llenar con valores reales
npm install                 # (cuando package.json tenga dependencias)
npm run version:setup-hooks # Instala el post-commit hook
```

---

*Mantenimiento automático: este archivo se actualiza cuando hay cambios en la arquitectura de versioning.*
