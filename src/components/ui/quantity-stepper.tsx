"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Props {
  cantidad: number;
  max: number;
  onChange: (n: number) => void;
  compacto?: boolean;
  className?: string;
}

export function SelectorCantidad({ cantidad, max, onChange, compacto, className }: Props) {
  const desactivado = max <= 0;
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-beige-dark bg-white",
        compacto ? "h-10 sm:h-9" : "h-11",
        desactivado && "opacity-50",
        className
      )}
      role="group"
      aria-label="Cantidad"
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(1, cantidad - 1))}
        disabled={desactivado || cantidad <= 1}
        className={cn(
          "grid place-items-center rounded-full text-marron transition-colors hover:bg-beige disabled:opacity-30",
          compacto ? "h-10 w-10 sm:h-8 sm:w-8" : "h-10 w-10"
        )}
        aria-label="Disminuir cantidad"
      >
        <Minus className={compacto ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </button>
      <span
        className={cn(
          "min-w-8 text-center font-semibold tabular-nums text-marron",
          compacto ? "text-sm" : "text-base"
        )}
        aria-live="polite"
      >
        {max <= 0 ? 0 : cantidad}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, cantidad + 1))}
        disabled={desactivado || cantidad >= max}
        className={cn(
          "grid place-items-center rounded-full text-marron transition-colors hover:bg-beige disabled:opacity-30",
          compacto ? "h-10 w-10 sm:h-8 sm:w-8" : "h-10 w-10"
        )}
        aria-label="Aumentar cantidad"
      >
        <Plus className={compacto ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </button>
    </div>
  );
}
