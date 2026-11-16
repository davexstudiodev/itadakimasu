export function formatPEN(valor: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(valor);
}

/** Precio sin simbolo (para inputs) */
export function formatNumero(valor: number): string {
  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

export function formatFecha(iso: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatFechaCorta(iso: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatCantidad(n: number): string {
  return new Intl.NumberFormat("es-PE").format(n);
}

/** Porcentaje de descuento redondeado (0 si no hay descuento) */
export function porcentajeDescuento(
  precio: number,
  precioAnterior?: number | null
): number {
  if (!precioAnterior || precioAnterior <= precio) return 0;
  return Math.round(((precioAnterior - precio) / precioAnterior) * 100);
}

export function plural(n: number, uno: string, muchos: string): string {
  return n === 1 ? uno : muchos;
}
