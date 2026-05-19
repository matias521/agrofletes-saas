<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Flujo de trabajo en equipo (Bauti + Mati)

Repositorio: https://github.com/matias521/agrofletes-saas

## Regla principal

**Nadie toca `main` directamente. Todo entra por Pull Request.**

`main` es producción. Vercel deploya automáticamente con cada merge a `main`.

## Convenciones de código

- Nombres de variables y funciones: **inglés**
- Textos de UI: **español rioplatense**

## Flujo completo

### 1. Crear un Issue en GitHub antes de tocar código

Título claro y directo. La descripción es opcional.

Ejemplos:
- `Implementar POST /auth/login/`
- `Pantalla de Login (frontend)`
- `Corregir signal de KYC cuando status es approved`

GitHub asigna un número automáticamente (`#1`, `#2`, etc.).

### 2. Avisar al otro

Antes de arrancar, avisarle por WhatsApp:
> "Voy con el Issue #12 — endpoint de login"

Esto evita que los dos trabajen en lo mismo al mismo tiempo.

### 3. Crear el branch desde `main` actualizado

```bash
git checkout main
git pull origin main
git checkout -b 12-auth-login-endpoint
```

Nombre del branch: siempre empieza con el número del Issue.
Ejemplos: `12-auth-login-endpoint`, `13-screen-login`, `14-fix-kyc-signal`

### 4. Commitear seguido con mensajes descriptivos

Commitear cada vez que algo funciona, no solo al final.

```
✅ Agrega endpoint POST /auth/login/
✅ Corrige signal de KYC cuando status es approved
✅ Implementa pantalla de Login con validación de campos

❌ fix
❌ cambios
❌ wip
❌ asdfgh
```

### 5. Pushear el branch

```bash
git push origin 12-auth-login-endpoint
```

### 6. Abrir un Pull Request en GitHub

**Título:** igual al Issue.
**Descripción:** qué se hizo + `Closes #12` al final (cierra el Issue automáticamente al mergear).

```
- Serializer con email y password
- Devuelve access y refresh token
- Valida credenciales contra la BD

Closes #12
```

### 7. El otro revisa

Revisión liviana — no tiene que ser exhaustiva:
- ¿Tiene sentido lo que hizo?
- ¿Rompió algo obvio?
- ¿Variables y funciones en inglés?
- ¿Textos de UI en español rioplatense?

Si está bien → **"Merge pull request"**.

### 8. Vercel deploya solo

Una vez mergeado a `main`, Vercel detecta el cambio y deploya automáticamente.
