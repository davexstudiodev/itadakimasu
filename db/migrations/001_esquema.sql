/* ============================================================
   ITADAKIMASU — Migración 001: esquema de base de datos
   PostgreSQL (Neon) — refleja los tipos de src/types/index.ts
   Ejecutar en orden: 001_esquema.sql → 002_seed.sql
   ============================================================ */

-- ---------- Usuarios (perfiles) ----------
-- En modo Supabase Auth, id = auth.users.id (uuid como texto).
-- En modo local, id = usr-... generado por la aplicación.
-- password_hash / reset_* solo se usan en modo local.
CREATE TABLE IF NOT EXISTS perfiles (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  nombre        TEXT NOT NULL DEFAULT '',
  apellidos     TEXT NOT NULL DEFAULT '',
  telefono      TEXT,
  rol           TEXT NOT NULL DEFAULT 'customer' CHECK (rol IN ('customer','admin')),
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  password_hash TEXT,
  reset_token   TEXT,
  reset_expires TIMESTAMPTZ,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_perfiles_email ON perfiles (lower(email));
CREATE INDEX IF NOT EXISTS idx_perfiles_rol ON perfiles (rol);

-- ---------- Catálogo ----------
CREATE TABLE IF NOT EXISTS categorias (
  slug        TEXT PRIMARY KEY,
  nombre      TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  icono       TEXT NOT NULL DEFAULT '',
  orden       INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS marcas (
  slug   TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  pais   TEXT NOT NULL CHECK (pais IN ('japon','corea'))
);

CREATE TABLE IF NOT EXISTS productos (
  id               TEXT PRIMARY KEY,
  slug             TEXT NOT NULL UNIQUE,
  nombre           TEXT NOT NULL,
  nombre_original  TEXT,
  descripcion       TEXT NOT NULL DEFAULT '',
  descripcion_larga TEXT,
  precio           DOUBLE PRECISION NOT NULL DEFAULT 0,
  precio_anterior   DOUBLE PRECISION,
  categoria_slug   TEXT NOT NULL REFERENCES categorias(slug),
  marca_slug       TEXT NOT NULL REFERENCES marcas(slug),
  pais             TEXT NOT NULL CHECK (pais IN ('japon','corea')),
  imagenes         TEXT[] NOT NULL DEFAULT '{}',
  ingredientes     TEXT[],
  alergenos        TEXT[],
  preparacion      TEXT,
  peso             TEXT,
  stock            INT NOT NULL DEFAULT 0,
  stock_minimo     INT NOT NULL DEFAULT 5,
  destacado        BOOLEAN NOT NULL DEFAULT FALSE,
  activo           BOOLEAN NOT NULL DEFAULT TRUE,
  etiquetas        TEXT[] NOT NULL DEFAULT '{}',
  valoracion       DOUBLE PRECISION NOT NULL DEFAULT 0,
  num_valoraciones INT NOT NULL DEFAULT 0,
  vendidos         INT NOT NULL DEFAULT 0,
  es_demo          BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos (categoria_slug);
CREATE INDEX IF NOT EXISTS idx_productos_marca ON productos (marca_slug);
CREATE INDEX IF NOT EXISTS idx_productos_pais ON productos (pais);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos (activo);
CREATE INDEX IF NOT EXISTS idx_productos_creado ON productos (creado_en DESC);

-- ---------- Cupones ----------
CREATE TABLE IF NOT EXISTS cupones (
  id             TEXT PRIMARY KEY,
  codigo         TEXT NOT NULL UNIQUE,
  tipo           TEXT NOT NULL CHECK (tipo IN ('porcentaje','fijo')),
  valor          DOUBLE PRECISION NOT NULL,
  activo         BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_inicio   TIMESTAMPTZ,
  fecha_fin      TIMESTAMPTZ,
  usos_maximos   INT,
  usos_actuales  INT NOT NULL DEFAULT 0,
  compra_minima  DOUBLE PRECISION,
  descripcion    TEXT,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cupones_usos (
  id         TEXT PRIMARY KEY,
  cupon_id   TEXT NOT NULL REFERENCES cupones(id) ON DELETE CASCADE,
  codigo     TEXT NOT NULL,
  usuario_id TEXT NOT NULL,
  pedido_id  TEXT NOT NULL,
  fecha      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Direcciones ----------
CREATE TABLE IF NOT EXISTS direcciones (
  id              TEXT PRIMARY KEY,
  usuario_id      TEXT NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  telefono        TEXT NOT NULL,
  departamento    TEXT NOT NULL,
  provincia       TEXT NOT NULL,
  distrito        TEXT NOT NULL,
  direccion       TEXT NOT NULL,
  referencia      TEXT,
  indicaciones    TEXT,
  por_defecto     BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_direcciones_usuario ON direcciones (usuario_id);

-- ---------- Pedidos ----------
-- dirección e historial se guardan como snapshot (jsonb).
CREATE TABLE IF NOT EXISTS pedidos (
  id            TEXT PRIMARY KEY,
  numero        TEXT NOT NULL UNIQUE,
  usuario_id    TEXT NOT NULL REFERENCES perfiles(id),
  estado        TEXT NOT NULL CHECK (estado IN (
                  'pendiente','pago_pendiente','pago_confirmado','preparando',
                  'en_camino','entregado','cancelado','reembolsado')),
  metodo_pago   TEXT NOT NULL CHECK (metodo_pago IN (
                  'yape','plin','transferencia','contra_entrega','pasarela')),
  metodo_envio  TEXT NOT NULL CHECK (metodo_envio IN ('recojo_tienda','delivery_local')),
  subtotal      DOUBLE PRECISION NOT NULL,
  descuento     DOUBLE PRECISION NOT NULL DEFAULT 0,
  cupon_codigo  TEXT,
  envio         DOUBLE PRECISION NOT NULL DEFAULT 0,
  total         DOUBLE PRECISION NOT NULL,
  direccion     JSONB NOT NULL,
  notas         TEXT,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  historial     JSONB NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos (usuario_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos (estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_creado ON pedidos (creado_en DESC);

-- Snapshot de los items (sin FK a productos: el historial debe sobrevivir
-- a cualquier baja futura de un producto).
CREATE TABLE IF NOT EXISTS pedido_items (
  pedido_id       TEXT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id     TEXT NOT NULL,
  slug            TEXT NOT NULL,
  nombre          TEXT NOT NULL,
  imagen          TEXT NOT NULL DEFAULT '',
  cantidad        INT NOT NULL,
  precio_unitario DOUBLE PRECISION NOT NULL,
  subtotal        DOUBLE PRECISION NOT NULL,
  posicion        INT NOT NULL DEFAULT 0,
  PRIMARY KEY (pedido_id, producto_id)
);

CREATE INDEX IF NOT EXISTS idx_pedido_items_producto ON pedido_items (producto_id);

-- ---------- Contadores (números de pedido únicos y sin carreras) ----------
CREATE TABLE IF NOT EXISTS contadores (
  clave TEXT PRIMARY KEY,
  valor BIGINT NOT NULL DEFAULT 0
);

-- ---------- Reseñas ----------
CREATE TABLE IF NOT EXISTS resenas (
  id             TEXT PRIMARY KEY,
  producto_id    TEXT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  usuario_id     TEXT NOT NULL,
  usuario_nombre TEXT NOT NULL,
  calificacion   INT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  titulo         TEXT NOT NULL,
  comentario     TEXT NOT NULL,
  creada_en      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resenas_producto ON resenas (producto_id, creada_en DESC);

-- ---------- Inventario ----------
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id                TEXT PRIMARY KEY,
  producto_id       TEXT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  producto_nombre   TEXT NOT NULL,
  tipo              TEXT NOT NULL CHECK (tipo IN ('entrada','salida','ajuste','venta')),
  cantidad          INT NOT NULL,
  stock_resultante  INT NOT NULL,
  motivo            TEXT NOT NULL,
  fecha             TIMESTAMPTZ NOT NULL DEFAULT now(),
  autor             TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON movimientos_inventario (producto_id, fecha DESC);

-- ---------- Carrito persistente ----------
CREATE TABLE IF NOT EXISTS carrito_items (
  usuario_id  TEXT NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  producto_id TEXT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad    INT NOT NULL,
  posicion    INT NOT NULL DEFAULT 0,
  PRIMARY KEY (usuario_id, producto_id)
);

-- ---------- Favoritos ----------
CREATE TABLE IF NOT EXISTS favoritos (
  usuario_id  TEXT NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  producto_id TEXT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, producto_id)
);

-- ---------- Configuración de la tienda (una sola fila jsonb) ----------
CREATE TABLE IF NOT EXISTS configuracion (
  clave TEXT PRIMARY KEY DEFAULT 'tienda',
  datos JSONB NOT NULL
);

-- ---------- Newsletter ----------
CREATE TABLE IF NOT EXISTS newsletter (
  email  TEXT PRIMARY KEY,
  fecha  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Auditoría ----------
CREATE TABLE IF NOT EXISTS auditoria (
  id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fecha   TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor   TEXT NOT NULL,
  accion  TEXT NOT NULL,
  detalle TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria (fecha DESC, id DESC);
