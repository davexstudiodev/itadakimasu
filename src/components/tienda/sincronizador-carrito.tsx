"use client";

import { useEffect, useRef } from "react";
import { fusionarCarrito, sincronizarCarrito } from "@/server/actions/carrito";
import { itemsParaServidor, useCarrito } from "@/store/carrito";

/**
 * Mantiene el carrito local sincronizado con el servidor:
 * - Al montar con sesión: fusiona el carrito de invitado con el persistido.
 * - Después: envía cambios (debounce) para que sobrevivan a otros dispositivos.
 */
export function SincronizadorCarrito({ usuarioId }: { usuarioId: string | null }) {
  const items = useCarrito((s) => s.items);
  const respaldado = useCarrito((s) => s.respaldado);
  const reemplazar = useCarrito((s) => s.reemplazar);
  const marcarRespaldo = useCarrito((s) => s.marcarRespaldo);
  const primerMount = useRef(true);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fusión inicial al iniciar sesión
  useEffect(() => {
    if (!usuarioId) {
      marcarRespaldo(false);
      return;
    }
    let cancelado = false;
    (async () => {
      try {
        const resultado = await fusionarCarrito(itemsParaServidor(useCarrito.getState().items));
        if (!cancelado) {
          reemplazar(resultado);
          marcarRespaldo(true);
        }
      } catch {
        if (!cancelado) marcarRespaldo(false);
      }
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioId]);

  // Envío de cambios posteriores
  useEffect(() => {
    if (!usuarioId || !respaldado || primerMount.current) {
      primerMount.current = false;
      return;
    }
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      sincronizarCarrito(itemsParaServidor(useCarrito.getState().items)).catch(() => undefined);
    }, 600);
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, [items, usuarioId, respaldado]);

  return null;
}
