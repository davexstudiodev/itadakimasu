# いただきます · ITADAKIMASU

E-commerce de comida japonesa y coreana con delivery local en **Puerto Malabrigo**
(Puerto Chicama, distrito Rázuri, provincia Ascope, La Libertad, Perú).

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (vía `turbopack.rules` en `next.config.ts`)
- **Server Actions / Route Handlers** + **Zod** (validación server-side)
- **Zustand** (carrito persistente), **Framer Motion**, **Lucide + SVG inline**
- **Vitest** (unit tests) · Playwright opcional (e2e)
- **Capa de datos intercambiable**: modo local (JSON, demo) hoy → Supabase activable sin tocar código

## Arranque rápido

```bash
npm install
npm run dev        # http://localhost:3000
```

Modo demo por defecto (`DATA_PROVIDER=local`): no requiere servicios externos.
Los datos se guardan en `data/db.json` (regenerables con la semilla).

```bash
npm run build      # build de producción
npm run start      # sirve el build
npm run lint       # ESLint (Next 16 ya no incluye `next lint`)
npm run typecheck  # tsc --noEmit
npm test           # Vitest (unit)
npm run test:watch # Vitest en watch
npm run test:e2e   # Playwright (requiere instalación previa, ver docs/CONFIGURACION.md)
```

## Cuentas de prueba (modo local)

| Rol     | Correo                     | Contraseña        |
| ------- | -------------------------- | ----------------- |
| Admin   | `admin@itadakimasu.pe`     | `Itadakimasu2026!` |
| Cliente | `dave.cliente@correo.com`  | `Prueba2026!`     |

También se pueden crear cuentas nuevas desde `/auth/registro`.

## Estructura

```
src/
  app/
    (tienda)/        # tienda pública: home, productos, checkout, FAQ, etc.
    admin/           # panel admin independiente (solo rol admin)
    auth/            # login, registro, recuperar contraseña
  components/
    tienda/          # componentes de la tienda (navbar, checkout, …)
    admin/           # tablas, formularios y acciones del panel
    ui/              # primitivas compartidas
  server/
    actions/         # Server Actions (con guard de admin + rate limit)
    validations.ts   # esquemas Zod compartidos
  lib/
    data/            # capa de datos: local/ (JSON) y supabase/
    config/site.ts   # configuración estática del sitio
  store/             # stores de Zustand (carrito, UI)
  types/             # tipos de dominio
public/logo.png      # logo oficial (Logos/1.png)
```

## Documentación

- **[docs/CONFIGURACION.md](docs/CONFIGURACION.md)** — variables de entorno, modos de datos, semilla admin, Supabase, Playwright.
- **[docs/TAREAS.md](docs/TAREAS.md)** — estado del proyecto por fases.

## Ámbito actual

- Tienda **local en Puerto Malabrigo**: delivery en la zona y recojo en tienda.
- Pagos **manuales** (Yape, Plin, transferencia, contra entrega) con verificación
  manual por el equipo — **nunca se simulan pagos reales**.
- Pedidos con snapshot de precio y descuento de stock atómico en servidor.
