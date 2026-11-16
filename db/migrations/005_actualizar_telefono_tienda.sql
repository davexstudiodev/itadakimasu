-- Actualiza el teléfono de contacto solo si aún conserva el número de demo.
-- Así no sobrescribe un teléfono que el administrador haya cambiado después.
UPDATE configuracion
SET datos = jsonb_set(datos, '{telefono}', to_jsonb('+51 946 002 100'::text), true)
WHERE clave = 'tienda'
  AND datos->>'telefono' = '+51 987 654 321';

UPDATE configuracion
SET datos = jsonb_set(datos, '{redes,whatsapp}', to_jsonb('https://wa.me/51946002100'::text), true)
WHERE clave = 'tienda'
  AND datos #>> '{redes,whatsapp}' = 'https://wa.me/51987654321';
