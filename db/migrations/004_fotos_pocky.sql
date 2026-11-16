/* ============================================================
   ITADAKIMASU — Migración 004: fotos licenciadas de Pocky
   Añade fotos de Open Food Facts sin reemplazar galerías admin.
   ============================================================ */

UPDATE productos
SET imagenes = array_append(imagenes, '/productos/pocky-chocolate-foto.jpg')
WHERE slug = 'pocky-chocolate'
  AND imagenes = ARRAY[
    '/productos/pocky-chocolate.svg',
    '/productos/pocky-chocolate-vista-2.svg',
    '/productos/pocky-chocolate-vista-3.svg',
    '/productos/pocky-chocolate-vista-4.svg'
  ]::text[];

UPDATE productos
SET imagenes = array_append(imagenes, '/productos/pocky-fresa-foto.jpg')
WHERE slug = 'pocky-fresa'
  AND imagenes = ARRAY[
    '/productos/pocky-fresa.svg',
    '/productos/pocky-fresa-vista-2.svg',
    '/productos/pocky-fresa-vista-3.svg',
    '/productos/pocky-fresa-vista-4.svg'
  ]::text[];

UPDATE productos
SET imagenes = array_append(imagenes, '/productos/pocky-matcha-foto.jpg')
WHERE slug = 'pocky-matcha'
  AND imagenes = ARRAY[
    '/productos/pocky-matcha.svg',
    '/productos/pocky-matcha-vista-2.svg',
    '/productos/pocky-matcha-vista-3.svg',
    '/productos/pocky-matcha-vista-4.svg'
  ]::text[];
