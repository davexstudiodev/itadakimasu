"use server";

import { getProvider } from "@/lib/data";
import type { Producto } from "@/types";

/** Sugerencias de búsqueda para el buscador del navbar. */
export async function buscarSugerencias(q: string): Promise<Producto[]> {
  const texto = q.trim();
  if (texto.length < 2) return [];
  return getProvider().getSugerencias(texto, 6);
}
