import "server-only";

/* ============================================================
   Límite de peticiones en memoria (rate limiting).
   Ventana deslizante por clave (IP o usuario). Evita abuso de
   endpoints sensibles (login, registro, checkout).
   ============================================================ */

interface Ventana {
  tiempos: number[];
}

const ventanas = new Map<string, Ventana>();
const VENTANA_MS = 60_000;

export function limitar(
  clave: string,
  maximo: number,
  ventanaMs: number = VENTANA_MS
): boolean {
  const ahora = Date.now();
  const v = ventanas.get(clave) ?? { tiempos: [] };
  v.tiempos = v.tiempos.filter((t) => ahora - t < ventanaMs);
  if (v.tiempos.length >= maximo) {
    ventanas.set(clave, v);
    return false;
  }
  v.tiempos.push(ahora);
  ventanas.set(clave, v);
  return true;
}

/** Limpia registros antiguos para evitar fugas de memoria. */
export function limpiarVentanas(): void {
  const ahora = Date.now();
  for (const [clave, v] of ventanas) {
    v.tiempos = v.tiempos.filter((t) => ahora - t < VENTANA_MS);
    if (v.tiempos.length === 0) ventanas.delete(clave);
  }
}
