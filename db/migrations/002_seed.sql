/* ============================================================
   ITADAKIMASU — Migración 002: seed de datos demo
   Generado automáticamente por scripts/generar-seed.mjs
   desde data/db.json. NO editar a mano (regenerar si hace falta).
   Idempotente: seguro de re-ejecutar.
   ============================================================ */

-- Categorías
INSERT INTO categorias (slug, nombre, descripcion, icono, orden) VALUES ('buldak', 'Buldak', 'El picante coreano que encendió el mundo: 불닭볶음면 en todos sus sabores.', 'flame', 1) ON CONFLICT (slug) DO NOTHING;
INSERT INTO categorias (slug, nombre, descripcion, icono, orden) VALUES ('ramen', 'Ramen', 'Fideos instantáneos de Japón y Corea para un caldo lleno de umami.', 'bowl', 2) ON CONFLICT (slug) DO NOTHING;
INSERT INTO categorias (slug, nombre, descripcion, icono, orden) VALUES ('snacks', 'Snacks', 'Botanas crujientes de Tokio, Seúl y todo lo que queda en el camino.', 'cookie', 3) ON CONFLICT (slug) DO NOTHING;
INSERT INTO categorias (slug, nombre, descripcion, icono, orden) VALUES ('dulces', 'Dulces', 'Mochis, galletas y golosinas con el toque kawaii que endulza el día.', 'candy', 4) ON CONFLICT (slug) DO NOTHING;
INSERT INTO categorias (slug, nombre, descripcion, icono, orden) VALUES ('bebidas', 'Bebidas', 'Ramune, soju sin alcohol y refrescos que no encuentras en cualquier lado.', 'cup', 5) ON CONFLICT (slug) DO NOTHING;
INSERT INTO categorias (slug, nombre, descripcion, icono, orden) VALUES ('comida', 'Comida', 'Platos coreanos listos para preparar en minutos.', 'utensils', 6) ON CONFLICT (slug) DO NOTHING;
INSERT INTO categorias (slug, nombre, descripcion, icono, orden) VALUES ('combos', 'Combos', 'Arma tu antojo con packs especiales y ahorra en cada pedido.', 'package', 7) ON CONFLICT (slug) DO NOTHING;

-- Marcas
INSERT INTO marcas (slug, nombre, pais) VALUES ('samyang', 'Samyang', 'corea') ON CONFLICT (slug) DO NOTHING;
INSERT INTO marcas (slug, nombre, pais) VALUES ('nongshim', 'Nongshim', 'corea') ON CONFLICT (slug) DO NOTHING;
INSERT INTO marcas (slug, nombre, pais) VALUES ('lotte', 'Lotte', 'corea') ON CONFLICT (slug) DO NOTHING;
INSERT INTO marcas (slug, nombre, pais) VALUES ('orion', 'Orion', 'corea') ON CONFLICT (slug) DO NOTHING;
INSERT INTO marcas (slug, nombre, pais) VALUES ('jinro', 'HiteJinro', 'corea') ON CONFLICT (slug) DO NOTHING;
INSERT INTO marcas (slug, nombre, pais) VALUES ('sempio', 'Sempio', 'corea') ON CONFLICT (slug) DO NOTHING;
INSERT INTO marcas (slug, nombre, pais) VALUES ('nissin', 'Nissin', 'japon') ON CONFLICT (slug) DO NOTHING;
INSERT INTO marcas (slug, nombre, pais) VALUES ('glico', 'Glico', 'japon') ON CONFLICT (slug) DO NOTHING;
INSERT INTO marcas (slug, nombre, pais) VALUES ('maruchan', 'Maruchan', 'japon') ON CONFLICT (slug) DO NOTHING;
INSERT INTO marcas (slug, nombre, pais) VALUES ('sangaria', 'Sangaria', 'japon') ON CONFLICT (slug) DO NOTHING;
INSERT INTO marcas (slug, nombre, pais) VALUES ('fujiya', 'Fujiya', 'japon') ON CONFLICT (slug) DO NOTHING;
INSERT INTO marcas (slug, nombre, pais) VALUES ('nestle', 'Nestlé', 'japon') ON CONFLICT (slug) DO NOTHING;
INSERT INTO marcas (slug, nombre, pais) VALUES ('asahi', 'Asahi', 'japon') ON CONFLICT (slug) DO NOTHING;
INSERT INTO marcas (slug, nombre, pais) VALUES ('suntory', 'Suntory', 'japon') ON CONFLICT (slug) DO NOTHING;
INSERT INTO marcas (slug, nombre, pais) VALUES ('yamaya', 'Yamaya', 'japon') ON CONFLICT (slug) DO NOTHING;
INSERT INTO marcas (slug, nombre, pais) VALUES ('itadakimasu', 'ITADAKIMASU', 'japon') ON CONFLICT (slug) DO NOTHING;

-- El catálogo inicia vacío; el administrador agrega los productos.

-- Cupones
INSERT INTO cupones (id, codigo, tipo, valor, activo, fecha_inicio, fecha_fin, usos_maximos, usos_actuales, compra_minima, descripcion) VALUES ('cup-001', 'BIENVENIDO10', 'porcentaje', 10, TRUE, '2026-01-01T00:00:00.000Z'::timestamptz, NULL, 1000, 1, 30, '10% de descuento en tu primera compra desde S/ 30.') ON CONFLICT (id) DO NOTHING;
INSERT INTO cupones (id, codigo, tipo, valor, activo, fecha_inicio, fecha_fin, usos_maximos, usos_actuales, compra_minima, descripcion) VALUES ('cup-002', 'BULDAK5', 'fijo', 5, TRUE, '2026-01-01T00:00:00.000Z'::timestamptz, NULL, 500, 0, 40, 'S/ 5 de descuento en pedidos desde S/ 40.') ON CONFLICT (id) DO NOTHING;

-- Configuración de la tienda
INSERT INTO configuracion (clave, datos) VALUES ('tienda', '{"nombre":"ITADAKIMASU","lema":"Tu antojo asiático comienza aquí.","telefono":"+51 946 002 100","correo":"hola@itadakimasu.pe","direccion":"Jr. Los Pescadores 123, Puerto Malabrigo, Rázuri, Ascope, La Libertad","horario":"Lun a Sáb · 10:00 – 20:00","redes":{"instagram":"https://instagram.com/itadakimasu.pe","tiktok":"https://tiktok.com/@itadakimasu.pe","facebook":"https://facebook.com/itadakimasu.pe","whatsapp":"https://wa.me/51946002100"},"envioCostoLocal":0,"envioGratisDesde":0,"recojoGratuito":true,"metodosPago":{"yape":true,"plin":true,"transferencia":true,"contraEntrega":false,"pasarela":false},"mensajeBoasvindas":"¡Bienvenido a ITADAKIMASU! Envío gratis en todos los pedidos."}'::jsonb) ON CONFLICT (clave) DO NOTHING;

-- Usuario administrador (id fijo: usr-admin-001)
INSERT INTO perfiles (id, email, nombre, apellidos, telefono, rol, activo, password_hash, creado_en) VALUES ('usr-admin-001', 'admin@itadakimasu.pe', 'Admin', 'ITADAKIMASU', NULL, 'admin', TRUE, 'scrypt$16384$0c6a96af7429ccc95748cb5e4636480b$ceb667ed77e26805d9815a47bc7f6335c36067e4159cda9353041eaf5807241c950a27b8c595481b3028a20f0ff2b240b8eeaa9073d0b3730805a8e3eaeea752', '2026-01-01T00:00:00.000Z'::timestamptz) ON CONFLICT (id) DO NOTHING;

-- No hay reseñas iniciales; se crean con compras y reseñas reales.

-- Nota: pedidos, carritos, favoritos, movimientos y auditoría
-- inician vacíos en producción (los datos demo del modo local no se migran).


