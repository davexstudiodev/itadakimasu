"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type TipoToast = "success" | "error" | "info";

interface EntradaToast {
  id: number;
  tipo: TipoToast;
  mensaje: string;
}

interface EstadoToasts {
  toasts: EntradaToast[];
  push: (tipo: TipoToast, mensaje: string) => void;
  quitar: (id: number) => void;
}

let contador = 0;

export const useToasts = create<EstadoToasts>((set) => ({
  toasts: [],
  push: (tipo, mensaje) => {
    const id = ++contador;
    set((s) => ({ toasts: [...s.toasts, { id, tipo, mensaje }].slice(-4) }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4200);
  },
  quitar: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** API para usar desde cualquier cliente: toast.success("Listo") */
export const toast = {
  success: (mensaje: string) => useToasts.getState().push("success", mensaje),
  error: (mensaje: string) => useToasts.getState().push("error", mensaje),
  info: (mensaje: string) => useToasts.getState().push("info", mensaje),
};

const iconos = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const colores: Record<TipoToast, string> = {
  success: "border-hojita/40 bg-white text-marron",
  error: "border-tomate/40 bg-white text-marron",
  info: "border-beige-dark bg-white text-marron",
};

const acentos: Record<TipoToast, string> = {
  success: "text-hojita",
  error: "text-tomate",
  info: "text-naranja-dark",
};

export function Toaster() {
  const { toasts, quitar } = useToasts();

  useEffect(() => {
    // Evita parpadeos de hidratación: solo muestra tras montar
  }, []);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const Icono = iconos[t.tipo];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-[0_18px_40px_-20px_rgba(56,40,32,0.55)]",
                colores[t.tipo]
              )}
              role="status"
            >
              <Icono className={cn("mt-0.5 h-5 w-5 shrink-0", acentos[t.tipo])} />
              <p className="flex-1 text-sm font-medium leading-snug">{t.mensaje}</p>
              <button
                type="button"
                onClick={() => quitar(t.id)}
                className="rounded-full p-1 text-marron/50 transition-colors hover:bg-beige hover:text-marron"
                aria-label="Cerrar notificación"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
