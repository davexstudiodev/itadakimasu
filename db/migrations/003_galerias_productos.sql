/* ============================================================
   ITADAKIMASU — Migración 003: galerías locales de producto
   Solo actualiza el valor original del seed; conserva imágenes
   que ya hayan sido personalizadas desde el panel admin.
   ============================================================ */

UPDATE productos
SET imagenes = ARRAY[
  '/productos/' || slug || '.svg',
  '/productos/' || slug || '-vista-2.svg',
  '/productos/' || slug || '-vista-3.svg',
  '/productos/' || slug || '-vista-4.svg'
]
WHERE slug = ANY (ARRAY[
  'asahi-super-dry',
  'boss-coffee',
  'buldak-2x-spicy',
  'buldak-carbonara',
  'buldak-cheese',
  'buldak-original',
  'chapagetti',
  'choco-pie-orion',
  'combo-buldak-lover',
  'combo-ramen-night',
  'combo-snack-japon',
  'dorayaki',
  'hi-chew-fresa',
  'kitkat-matcha',
  'koalas-march',
  'milkis',
  'mochi-fresa',
  'nissin-tonkotsu',
  'pepero-chocolate',
  'pocky-chocolate',
  'pocky-fresa',
  'pocky-matcha',
  'ramune-fresa',
  'ramune-original',
  'shin-ramyun',
  'soju-sin-alcohol',
  'tteokbokki-listo',
  'yakisoba-otoko-umami'
]::text[])
AND array_length(imagenes, 1) = 1
AND imagenes[1] = '/productos/' || slug || '.svg';
