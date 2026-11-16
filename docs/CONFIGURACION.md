# Configuración — ITADAKIMASU

Guía de configuración del proyecto. Plantilla de variables: `.env.example`
(**sin secretos**; nunca subir `.env.local` al repositorio).

## 1. Variables de entorno

Copia la plantilla y rellena:

```bash
cp .env.example .env.local
```

| Variable                      | Obligatoria | Descripción                                                        |
| ----------------------------- | ----------- | ------------------------------------------------------------------ |
| `DATA_PROVIDER`               | Sí          | `local` (demo, por defecto) o `neon` (PostgreSQL en Neon).          |
| `AUTH_MODE`                   | Sí          | `local` (scrypt + cookie, por defecto) o `supabase` (Supabase Auth). |
| `NEON_DATABASE_URL`           | Solo neon   | URL pooled de Neon con `itadakimasu_runtime` (`NOBYPASSRLS`). No usar la URL propietaria de migraciones en la app. |
| `NEXT_PUBLIC_SUPABASE_URL`    | Auth o imágenes | URL del proyecto Supabase.                                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Solo supabase | Key pública (anon).                                               |
| `SUPABASE_SERVICE_ROLE_KEY`   | Imágenes       | **Solo servidor.** Nunca exponer en cliente ni en el repo.         |
| `SUPABASE_STORAGE_BUCKET`     | No             | Bucket público de imágenes; por defecto `producto-imagenes`.       |
| `SESSION_SECRET`              | Recomendado | Secreto para firmar la cookie de sesión (`ita_session`, 30 días).  |
| `NEXT_PUBLIC_SITE_URL`        | Sí          | URL pública (SEO, sitemap, OG y enlaces de Supabase Auth).         |
| `RESEND_API_KEY` / `EMAIL_FROM` | No        | Correos transaccionales (solo modo `AUTH_MODE=local`).             |
| `PAYMENT_PROVIDER` / …        | No          | Pasarela online (futura FASE 6).                                   |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Semilla  | Cuenta admin inicial en modo local.                                |

Generar un `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 2. Modos de datos y autenticación

La capa de datos es **intercambiable** (`src/lib/data/`): el resto de la app
solo habla con la interfaz `DataProvider`. La autenticación se conmuta con
`AUTH_MODE` (`src/lib/auth/modo.ts`).

### Datos: modo local (por defecto, demo)

- Almacenamiento en `data/db.json` con escritura atómica y cola serializada.
- No requiere servicios externos ni credenciales.
- Los datos se **regeneran con la semilla** si borras `data/db.json`
  (está en `.gitignore`).
- Migraciones suaves en lectura (`normalizar()` en `src/lib/data/local/db.ts`):
  rellena campos nuevos de configuración y renombra métodos de envío antiguos.

### Datos: modo Neon (producción)

1. Crea un proyecto en [neon.tech](https://neon.tech).
2. Aplica en el SQL Editor de Neon, en este orden:
   - `db/migrations/001_esquema.sql` (esquema)
   - `db/migrations/002_seed.sql` (datos demo; se regenera con
     `node scripts/generar-seed.mjs`). Ejecútalo solo en una base vacía
     de desarrollo: también crea perfiles, pedidos y reseñas de ejemplo.
   - `db/migrations/005_actualizar_telefono_tienda.sql` (actualiza el
     teléfono de demostración sin sobrescribir cambios del administrador)
3. Pon `NEON_DATABASE_URL` (connection string **pooled**) en `.env.local`
   o en Vercel, y `DATA_PROVIDER=neon`.
4. Reinicia el servidor. **No hay que tocar código.**

La conexión de la app debe usar el rol `itadakimasu_runtime`, protegido por
RLS. La migración `db/migrations/006_neon_rls.sql` activa políticas por
cliente y administrador; ejecútala con la conexión propietaria de Neon.
Reserva esa conexión propietaria para migraciones y usa la conexión de
`itadakimasu_runtime` en Vercel.

> El provider `src/lib/data/neon/provider.ts` replica la lógica del local
> con SQL real: transacciones con `SELECT … FOR UPDATE` en stock/cupones y
> contador atómico para los números `ITD-YYYY-NNNNN`.

El catálogo comienza vacío. Agrega los productos y sus imágenes desde el
panel administrativo; no ejecutes las antiguas migraciones `003` y `004`,
que pertenecían al catálogo de demostración anterior.

### Autenticación: modo local (por defecto)

- scrypt (N=16384) + cookie httpOnly firmada HMAC-SHA256 (`ita_session`).

### Autenticación: modo Supabase (producción)

1. En Supabase → Authentication → Providers → Email: desactiva
   **"Confirm email"** (registro instantáneo, como en el modo local).
2. Supabase → Authentication → URL Configuration:
   - **Site URL** = `NEXT_PUBLIC_SITE_URL` (la de Vercel en producción).
   - Añade `https://<tu-app>.vercel.app/auth/callback` a **Redirect URLs**.
3. Pon `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y
   `AUTH_MODE=supabase`.
4. `src/proxy.ts` refresca las cookies de sesión en cada petición y
   `/auth/callback` intercambia el código PKCE (confirmaciones y
   recuperación de contraseña).

> Los usuarios viven en Supabase Auth; el **perfil** (nombre, rol, activo)
> se crea en la BD (Neon) en el primer acceso y el rol se lee siempre
> desde la BD, nunca del cliente.

## 3. Cuentas semilla (modo local)

| Rol     | Correo                    | Contraseña         |
| ------- | ------------------------- | ------------------ |
| Admin   | `admin@itadakimasu.pe`    | `Itadakimasu2026!` |
| Cliente | `dave.cliente@correo.com` | `Prueba2026!`      |

- El hash de contraseñas usa **scrypt** (N=16384) con salt por usuario.
- La sesión es una cookie httpOnly firmada (HMAC-SHA256), 30 días.
- Los roles (`customer`/`admin`) se verifican **siempre en servidor**
  (`exigirAdminAccion()` en las server actions del panel).
- En `AUTH_MODE=supabase` las cuentas viven en Supabase Auth: crea la
  cuenta admin desde la app (o el dashboard de Supabase) y promueve el
  rol con `UPDATE perfiles SET rol='admin' WHERE email='…';` en la BD.

## 4. Panel admin

Ruta independiente `/admin` (protegida; el cliente común ve 403):

- Dashboard, productos, inventario, pedidos, cupones, usuarios, configuración.
- Cada producto admite de 4 a 12 rutas de imagen distintas, una por línea.
- El formulario acepta archivos JPG, PNG y WebP de hasta 4 MB, seleccionados
  o arrastrados. Se guardan en Supabase Storage; el bucket público
  `producto-imagenes` se crea en la primera subida si no existe.
- Para subir imágenes, configura `NEXT_PUBLIC_SUPABASE_URL` y
  `SUPABASE_SERVICE_ROLE_KEY` en `.env.local` y en Vercel. El rol de servicio
  solo se usa en el servidor.
- Toda mutación pasa por server actions con: guard de admin + rate limit +
  registro de auditoría + `revalidatePath`.

## 5. Ámbito de la tienda

- **Zona:** delivery local en **Puerto Malabrigo y alrededores**
  (Rázuri, Ascope, La Libertad) + recojo en tienda.
- **Dirección (semilla):** Jr. Los Pescadores 123, Puerto Malabrigo, Rázuri,
  Ascope, La Libertad. Editable en Admin → Configuración.
- **Pagos manuales:** Yape, Plin, transferencia y contra entrega. El equipo
  verifica el comprobante y confirma el pedido. **Nunca se simulan pagos reales.**
- Costos de envío y umbral de envío gratis: Admin → Configuración.

## 6. Tests

```bash
npm test           # Vitest (unit) — format, slugify, validaciones Zod
npm run test:watch # watch
```

### Playwright (opcional, e2e)

No está instalado por defecto. Para habilitarlo:

```bash
npm install -D @playwright/test
npx playwright install chromium
npm run test:e2e
```

## 7. Scripts de verificación

Antes de cada entrega:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

## 8. Solución de problemas

| Problema                                                       | Solución                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------- |
| Error TS2344/TS2307 tras borrar rutas                          | Borra `.next/dev` y vuelve a compilar.                              |
| Tailwind no genera utilidades (`.btn-primary` ausente)         | Verifica `turbopack.rules` en `next.config.ts`.                     |
| Puerto 3000 ocupado (`EADDRINUSE`)                             | Detén el proceso previo (`Stop-Process -Id <pid>`) y relanza.       |
| Icono de lucide no existe                                      | Comprueba el nombre en `lucide-react@0.545` (p. ej. `TriangleAlert`). |
| Resetear la demo                                               | Borra `data/db.json` y reinicia (se regenera con la semilla).       |
