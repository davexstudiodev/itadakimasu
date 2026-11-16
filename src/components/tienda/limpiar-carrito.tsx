"use client";

import { useEffect } from "react";
import { useCarrito } from "@/store/carrito";

/**
 * Vacía el carrito local (localStorage) al mostrar la confirmación de un pedido.
 * El servidor ya limpió su copia en crearPedido; esto evita que el
 * sincronizador vuelva a subir los artículos comprados.
 */
export function LimpiarCarrito() {
  const limpiar = useCarrito((s) => s.limpiar);

  useEffect(() => {
    limpiar();
  }, [limpiar]);

  return null;
}
