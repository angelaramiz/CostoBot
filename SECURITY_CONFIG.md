# SECURITY_CONFIG.md — CostoBot

> Checklist de seguridad para cada entorno de despliegue.  
> Completar antes de ir a producción.

---

## 1. Variables de Entorno

### Vercel (Frontend)
1. Dashboard → Settings → Environment Variables
2. Agregar todas las variables de `.env.example` marcadas como `NEXT_PUBLIC_*`
3. **No agregar** nunca: `GIT_PAT_TOKEN`, `INTERNAL_API_KEY`, `DATABASE_URL`, claves de Firebase Admin
4. Marcar las variables sensibles como **Encrypted** si está disponible

### Render (Backend)
1. Dashboard → Environment → Add Environment Variable
2. Agregar todas las variables sin prefijo `NEXT_PUBLIC_`:
   - `PUBLIC_API_KEY`, `INTERNAL_API_KEY`
   - `DATABASE_URL`
   - `FIREBASE_ADMIN_*`
   - `PORT`, `NODE_ENV=production`, `CORS_ALLOWED_ORIGIN`
3. **No agregar** `GIT_PAT_TOKEN` al backend — solo lo usa el frontend localmente

---

## 2. GitHub PAT (Personal Access Token)

- **Scope requerido:** `repo` (para push autónomo)
- **Almacenamiento:** Solo en `.env` local como `GIT_PAT_TOKEN`
- **Expira:** Verifica la fecha de expiración periódicamente
- **Rotación:** Al rotar, actualiza `.env` y el post-commit hook se actualiza automático
- **NUNCA:** Pasar al frontend, commit, ni logs

---

## 3. API Keys

| Key | Usada en | Expuesta al browser |
|-----|----------|---------------------|
| `PUBLIC_API_KEY` | Frontend (version check) | ✅ Sí (read-only endpoint) |
| `INTERNAL_API_KEY` | Backend (writes) | ❌ No |

- **Rotación:** Generar nuevas con: `node -e "console.log('sb_public_' + require('crypto').randomBytes(8).toString('hex'))"`
- Actualizar en `.env`, en Render, y en Vercel si aplica

---

## 4. CORS

- Desarrollo: `CORS_ALLOWED_ORIGIN=http://localhost:3000`
- Producción: `CORS_ALLOWED_ORIGIN=https://tu-dominio-real.vercel.app`
- **Nunca usar** `*` en producción

---

## 5. Rate Limiting

El backend debe tener configurado `express-rate-limit`:

| Endpoint | Límite |
|----------|--------|
| `GET /api/version` | 100 req / 15 min |
| `POST /api/version/record` | 5 req / min |
| `POST /api/*` (general) | 60 req / min |

---

## 6. Firebase Auth

- **Frontend:** Inicializar con `FIREBASE_APIKEY` etc. desde `.env`
- **Backend:** Usar Firebase Admin SDK para validar JWT tokens en cada request protegido
- **Regla:** Ningún endpoint de datos del usuario debe responder sin un JWT válido

---

## 7. MongoDB Atlas

- Usar usuario de base de datos con permisos mínimos (no `atlasAdmin`)
- Whitelist de IPs: agregar IP del servidor Render en Network Access
- Habilitar auditing en Atlas (tier M10+)

---

## 8. Checklist Pre-Producción

- [ ] `.env` está en `.gitignore` y NO fue commiteado
- [ ] `agent-unified.md` está en `.gitignore`
- [ ] `contextoIA/` está en `.gitignore`
- [ ] `versionamiento.config.json` está en `.gitignore`
- [ ] Variables en Vercel configuradas (sin las sensibles)
- [ ] Variables en Render configuradas
- [ ] CORS configurado con dominio real
- [ ] Rate limiting activado
- [ ] Firebase Auth verificada en el backend
- [ ] MongoDB IP whitelist configurada
- [ ] GitHub PAT expira en fecha conocida

---

*Último audit de seguridad: pendiente*
