import Link from "next/link";
import {
  Flame,
  Soup,
  Cookie,
  Candy,
  CupSoda,
  UtensilsCrossed,
  Package,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import type { Categoria } from "@/types";

const iconos: Record<string, LucideIcon> = {
  flame: Flame,
  bowl: Soup,
  cookie: Cookie,
  candy: Candy,
  cup: CupSoda,
  utensils: UtensilsCrossed,
  package: Package,
};

const acentos: Record<string, string> = {
  flame: "bg-tomate/10 text-tomate",
  bowl: "bg-naranja/15 text-naranja-dark",
  cookie: "bg-rosa/30 text-tomate-dark",
  candy: "bg-rosa/40 text-tomate",
  cup: "bg-hojita/15 text-hojita",
  utensils: "bg-beige text-marron",
  package: "bg-tomate/10 text-tomate",
};

export function CategoryCard({ categoria }: { categoria: Categoria }) {
  const Icono = iconos[categoria.icono] ?? Package;
  return (
    <Link
      href={`/productos?categoria=${categoria.slug}`}
      className="group flex items-center gap-4 rounded-card border border-beige-dark/60 bg-white p-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-tomate/30 hover:shadow-card-hover sm:p-5"
    >
      <span
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition-transform group-hover:scale-110 ${
          acentos[categoria.icono] ?? "bg-beige text-marron"
        }`}
      >
        <Icono className="h-6 w-6" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-display font-bold text-marron">
          {categoria.nombre}
          <ArrowRight
            className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
            aria-hidden
          />
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-marron/60">
          {categoria.descripcion}
        </span>
      </span>
    </Link>
  );
}
