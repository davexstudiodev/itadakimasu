# Tareas — ITADAKIMASU

Estado del proyecto por fases. ✅ completa · 🔄 en curso · ⬜ pendiente

Última actualización: 15 de noviembre de 2026.

## FASE 1 — Base del proyecto ✅

- [x] Scaffold Next.js 16 + TS + Tailwind v4 (vía `turbopack.rules`)
- [x] Configuración de diseño: paleta cálida (crema `#FFF5E9`, beige `#F3E4D2`,
      rojo `#D94B38`, naranja `#F4A261`, marrón `#382820`, rosa `#E9B8AD`)
- [x] Tipos de dominio (`src/types`) y esquemas Zod (`src/server/validations.ts`)
- [x] Semilla de datos: 28 productos demo en PEN, categorías, marcas, cupones
- [x] 28 SVGs de producto en `public/productos/`
- [x] Auth: registro/login/logout, scrypt, cookie de sesión firmada, roles
- [x] Stores de Zustand (carrito persistente + UI)
- [x] UI base: botones (`.btn` como `@utility`), campos, toast, empty states
- [x] Logo oficial copiado a `public/logo.png` (usa `Logos/1.png`)

## FASE 2 — Tienda pública ✅

- [x] Home (hero, trust strip, secciones, combos)
- [x] Catálogo `/productos` con filtros, búsqueda y SEO (metadata)
- [x] Ficha `/producto/[slug]` con reseñas y JSON-LD Product
- [x] Carrito y checkout (dirección, envío, pago, cupón)
- [x] Confirmación de pedido con JSON-LD Order + limpieza de carrito
- [x] Páginas de contenido: nosotros, contacto, FAQ, envíos y devoluciones,
      términos, privacidad
- [x] Cuenta: perfil, direcciones, pedidos, favoritos
- [x] `sitemap.ts` + `robots.ts` + metadata/OG en todas las rutas

## FASE 3 — Conexión de servicios (Neon + Supabase + GitHub + Vercel) 🔄

Arquitectura elegida por Dave: **Neon = base de datos**, **Supabase = Auth +
Storage**, **repo nuevo en GitHub**, **Vercel = producción** con deploy
automático por commit.

### Completado ✅ (código, sin credenciales)

- [x] Esquema SQL completo en `db/migrations/001_esquema.sql`
      (perfiles, categorías, marcas, productos, cupones, direcciones,
      pedidos + items snapshot, resenas, inventario, carrito, favoritos,
      configuración, newsletter, auditoría, contadores)
- [x] Seed idempotente `db/migrations/002_seed.sql` generado por
      `scripts/generar-seed.mjs` desde `data/db.json`
      (7 categorías, 16 marcas, 28 productos, 2 cupones, 4 reseñas, admin)
- [x] Driver `pg` + `@types/pg` instalados
- [x] **Provider Neon** `src/lib/data/neon/provider.ts`: los ~55 métodos de
      `DataProvider` en SQL, con transacciones y `SELECT … FOR UPDATE`
      (stock y cupones bloqueados), contador atómico de números de pedido
      (`ITD-YYYY-NNNNN`) y estadísticas en hora de Lima
- [x] Fáctory `DATA_PROVIDER=neon` en `src/lib/data/index.ts`
      (se eliminó el stub obsoleto `src/lib/data/supabase/`)
- [x] **Supabase Auth**:
      - `src/proxy.ts` (Next 16: middleware → proxy) que refresca sesiones
      - `src/app/auth/callback/route.ts` (intercambio PKCE de código)
      - `src/lib/auth/supabase.ts` (cliente servidor con cookies + cliente
        de solo lectura para verificar la contraseña actual)
      - `src/lib/auth/modo.ts` (`AUTH_MODE=local|supabase`)
      - actions `auth.ts` con ramas para ambos modos: registro, login,
        logout, cambiar contraseña, recuperar y restablecer
      - `getUsuarioActual()` con Supabase + reconciliación de perfiles
        (crea el perfil en la BD en el primer acceso)
      - página `/auth/restablecer` compatible con token (local) y con
        sesión de recuperación (Supabase)
- [x] `.env.example` con `DATA_PROVIDER`, `AUTH_MODE`, `NEON_DATABASE_URL`
      y claves Supabase
- [x] Verificación en verde: `typecheck` · `lint` (0 errores) ·
      **88 tests** · `build` (32 rutas + Proxy)
- [x] Regresión del modo local en navegador: login admin → dashboard →
      logout → `/admin` redirige a login, 0 errores de consola
- [x] **Validación del provider PostgreSQL sin credenciales**: PGlite
      (Postgres en memoria, WASM) + `@electric-sql/pglite-socket` sirve
      por TCP y el provider se conecta con el mismo driver `pg` que usará
      en Neon. Script: `scripts/probar-pglite.mjs`
- [x] **Suite de integración** `src/lib/data/neon/provider.test.ts`
      (35 tests): catálogo/filtros/paginación, productos, inventario,
      perfiles, carrito, favoritos, direcciones, cupones, configuración,
      `crearPedido` (cupón + stock + número + errores + rollback),
      estados de pedido, reseñas, newsletter, auditoría y estadísticas
- [x] Bugs reales detectados y corregidos por los tests:
      - `crearPedido` abría una **2ª conexión del pool dentro de su
        transacción** (deadlock potencial) → ahora lee la configuración
        con el mismo cliente de la transacción
      - `historial` (array) se pasaba como parámetro jsonb →
        `node-postgres` lo serializaba como literal de array de PG y el
        INSERT fallaba siempre → `JSON.stringify` explícito

### Pendiente ⬜ (requiere credenciales de Dave)

- [ ] Loguearse en Supabase, Neon, GitHub y Vercel (4 pestañas abiertas)
- [ ] Crear proyecto Supabase → claves en `.env.local`
      (desactivar "Confirm email" para registro instantáneo)
- [ ] Crear proyecto Neon → `NEON_DATABASE_URL` → aplicar
      `001_esquema.sql` y `002_seed.sql`
- [ ] Probar E2E con `DATA_PROVIDER=neon` + `AUTH_MODE=supabase`
      (crear cuenta, comprar, admin, pedidos)
- [ ] Crear cuenta admin en Supabase y promoverla:
      `UPDATE perfiles SET rol='admin' WHERE email='…'`
- [ ] Repo en GitHub (git init + push) y proyecto Vercel con las
      variables de entorno + deploy de producción
- [ ] Supabase Storage: bucket de imágenes y subida desde el admin
      (hoy las imágenes son SVG estáticos en `public/`, funcionan en
      Vercel sin Storage)
- [ ] Actualizar `docs/CONFIGURACION.md` y `README.md` con los valores
      finales (URLs de producción)

## FASE 4 — Panel admin ✅

- [x] Server actions de admin (`src/server/actions/admin/`) con
      `exigirAdminAccion()` + rate limit + auditoría + `revalidatePath`
- [x] 9 páginas `/admin`: dashboard, productos (lista/nuevo/edición),
      inventario, pedidos (lista/detalle), cupones, usuarios, configuración
- [x] Componentes: nav, tabla-productos, form-producto, form-inventario,
      acciones-pedido, gestion-cupones, fila-usuario, form-configuracion

## FASE 5 — Calidad y E2E ✅

- [x] E2E manual en navegador completo:
      login admin → dashboard → logout → registro cliente → carrito →
      checkout → cupón `BIENVENIDO10` → pedido creado → confirmación →
      admin confirma pago y cambia estado → cliente ve estado →
      dashboard en tiempo real → auditoría
- [x] 3 bugs corregidos durante E2E:
      1. `/` servía el template residual de create-next-app (archivo eliminado)
      2. el cupón no viajaba al servidor en el checkout (input oculto añadido)
      3. el carrito nunca se vaciaba (limpieza en servidor + cliente)
- [x] Vitest configurado: **53 tests** (`format`, `slugify`, `validations`)
- [x] `typecheck` + `lint` (0 errores) + `build` (31 rutas) en verde

## FASE 6 — Pagos y pendientes ⬜

- [ ] Playwright (e2e automatizado) — opcional; ver `docs/CONFIGURACION.md`
- [ ] Pasarela de pagos online (nunca simular pagos reales)
- [ ] Correos transaccionales (Resend, solo modo local; en Supabase los
      envía el propio Supabase)

## Cambio a modo local (Puerto Malabrigo) ✅

Petición de Dave: la tienda es **local en Puerto Malabrigo** (Puerto Chicama,
distrito Rázuri, provincia Ascope, La Libertad), no envíos a todo el Perú.

- [x] Copy: navbar, hero, trust strip, detalle de producto, home, footer
- [x] Páginas: envíos y devoluciones, FAQ, nosotros, contacto, términos,
      privacidad, productos (metadata + cierre)
- [x] Checkout: opciones `delivery_local` + `recojo_tienda` (se eliminó
      `envio_provincias`), textos de contra entrega
- [x] Dominio: `MetodoEnvio = "recojo_tienda" | "delivery_local"` y
      config `envioCostoLocal` (antes `envioCostoLima`/`envioCostoProvincias`)
- [x] Admin → Configuración: un solo campo de costo de envío
- [x] Migración suave de datos locales antiguos (`normalizar()` en `db.ts`)
- [x] Dirección de la tienda actualizada en `site.ts`, semilla y `db.json`
- [x] Tests actualizados; `typecheck` + `lint` + `test` + `build` en verde
- [x] Verificación en navegador: 10 rutas sin rastros de Lima/Barranco/
      "todo el Perú", 0 errores de consola

## Notas

- Dirección de jurisdicción en términos: tribunales de La Libertad.
- `data/db.json` está en `.gitignore`; se regenera con la semilla.
- Subagentes no disponibles por límite del plan gratuito: el asistente
  principal ejecuta todo el trabajo directamente.
