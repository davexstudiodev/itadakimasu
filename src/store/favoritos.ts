"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { alternarFavorito, leerFavoritos } from "@/server/actions/carrito";
import { toast } from "@/components/ui/toaster";

interface EstadoFavoritos {
  ids: string[];
  hidratado: boolean;
  alternar: (productoId: string) => void;
  sincronizar: () => Promise<void>;
  reemplazar: (ids: string[]) => void;
}

/** Favoritos: requieren sesión; se respaldan en el servidor. */
export const useFavoritos = create<EstadoFavoritos>()(
  persist(
    (set, get) => ({
      ids: [],
      hidratado: false,
      alternar: async (productoId) => {
        const actual = get().ids;
        const incluido = actual.includes(productoId);
        // Optimista
        set({
          ids: incluido
            ? actual.filter((id) => id !== productoId)
            : [...actual, productoId],
        });
        try {
          const resultado = await alternarFavorito(productoId);
          if (!resultado.ok) {
            set({ ids: actual });
            if (resultado.error === "inicia_sesion") {
              toast.info("Inicia sesión para guardar favoritos");
            } else {
              toast.error(resultado.error ?? "No se pudo actualizar");
            }
            return;
          }
          set({ ids: resultado.favoritos });
          toast.success(incluido ? "Quitado de favoritos" : "Guardado en favoritos");
        } catch {
          set({ ids: actual });
          toast.error("No se pudo actualizar favoritos");
        }
      },
      sincronizar: async () => {
        try {
          const ids = await leerFavoritos();
          set({ ids, hidratado: true });
        } catch {
          set({ hidratado: true });
        }
      },
      reemplazar: (ids) => set({ ids }),
    }),
    { name: "ita-favoritos-v1", partialize: (s) => ({ ids: s.ids }) }
  )
);
