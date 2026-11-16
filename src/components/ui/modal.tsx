"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
  ancho?: string;
  descripcion?: string;
}

export function Modal({ abierto, onCerrar, titulo, children, ancho = "max-w-lg", descripcion }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [abierto, onCerrar]);

  return (
    <AnimatePresence>
      {abierto && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-marron/45 backdrop-blur-[2px]"
            onClick={onCerrar}
            aria-hidden
          />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-beige-dark bg-crema shadow-[0_40px_80px_-40px_rgba(56,40,32,0.6)] sm:rounded-3xl",
              ancho
            )}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-beige-dark bg-crema/95 px-4 py-4 backdrop-blur sm:gap-4 sm:px-5">
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-display text-lg font-bold text-marron sm:overflow-visible sm:whitespace-normal">
                  {titulo}
                </h2>
                {descripcion && (
                  <p className="mt-0.5 truncate text-xs text-marron/60 sm:overflow-visible sm:whitespace-normal">
                    {descripcion}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onCerrar}
                className="shrink-0 rounded-full p-2 text-marron/60 transition-colors hover:bg-beige hover:text-marron"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-4 py-4 sm:px-5 sm:py-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
