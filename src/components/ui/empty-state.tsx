import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface VacioProps {
  icono: LucideIcon;
  titulo: string;
  descripcion: string;
  accion?: { texto: string; href: string };
  className?: string;
}

export function EstadoVacio({ icono: Icono, titulo, descripcion, accion, className }: VacioProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-beige-dark bg-white/60 px-6 py-14 text-center",
        className
      )}
    >
      <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-beige text-marron/60">
        <Icono className="h-7 w-7" aria-hidden />
      </span>
      <h3 className="font-display text-lg font-bold text-marron">{titulo}</h3>
      <p className="mt-1 max-w-sm text-sm text-marron/60">{descripcion}</p>
      {accion && (
        <Link href={accion.href} className="btn-primary mt-5 px-6 py-2.5">
          {accion.texto}
        </Link>
      )}
    </div>
  );
}
