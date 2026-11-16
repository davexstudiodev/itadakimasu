"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ItemCarrito } from "@/types";

/* ============================================================
   Estado global del carrito (persistido en localStorage).
   Cuando hay sesión, se sincroniza con el carrito del servidor.
   Los precios se validan siempre en el servidor al comprar.
   ============================================================ */

interface NuevoItem {
  productoId: string;
  slug: string;
  nombre: string;
  precio: number;
  precioAnterior?: number | null;
  imagen: string;
  cantidad: number;
  stock: number;
}

interface EstadoCarrito {
  items: ItemCarrito[];
  /** true cuando el carrito está respaldado en el servidor */
  respaldado: boolean;
  agregar: (item: NuevoItem) => void;
  quitar: (productoId: string) => void;
  cambiarCantidad: (productoId: string, cantidad: number) => void;
  limpiar: () => void;
  reemplazar: (items: ItemCarrito[]) => void;
  marcarRespaldo: (valor: boolean) => void;
}

export const useCarrito = create<EstadoCarrito>()(
  persist(
    (set) => ({
      items: [],
      respaldado: false,
      agregar: (item) =>
        set((s) => {
          const existente = s.items.find((i) => i.productoId === item.productoId);
          if (existente) {
            return {
              items: s.items.map((i) =>
                i.productoId === item.productoId
                  ? { ...i, cantidad: Math.min(i.stock, i.cantidad + item.cantidad) }
                  : i
              ),
            };
          }
          return { items: [...s.items, { ...item, cantidad: Math.min(item.cantidad, item.stock) }] };
        }),
      quitar: (productoId) =>
        set((s) => ({ items: s.items.filter((i) => i.productoId !== productoId) })),
      cambiarCantidad: (productoId, cantidad) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.productoId === productoId
              ? { ...i, cantidad: Math.max(1, Math.min(i.stock || 99, cantidad)) }
              : i
          ),
        })),
      limpiar: () => set({ items: [] }),
      reemplazar: (items) => set({ items }),
      marcarRespaldo: (valor) => set({ respaldado: valor }),
    }),
    {
      name: "ita-carrito-v1",
      partialize: (s) => ({ items: s.items }),
    }
  )
);

/** Subtotal de los items actuales. */
export function subtotalDe(items: ItemCarrito[]): number {
  return Math.round(items.reduce((s, i) => s + i.precio * i.cantidad, 0) * 100) / 100;
}

export function unidadesDe(items: ItemCarrito[]): number {
  return items.reduce((s, i) => s + i.cantidad, 0);
}

/** Obtiene items en formato de envío al servidor. */
export function itemsParaServidor(items: ItemCarrito[]) {
  return items.map((i) => ({
    productoId: i.productoId,
    slug: i.slug,
    nombre: i.nombre,
    precio: i.precio,
    precioAnterior: i.precioAnterior ?? null,
    imagen: i.imagen,
    cantidad: i.cantidad,
    stock: i.stock,
  }));
}
