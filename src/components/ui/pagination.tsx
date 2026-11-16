import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Props {
  pagina: number;
  paginas: number;
  hrefBuilder: (pagina: number) => string;
  className?: string;
}

export function Paginacion({ pagina, paginas, hrefBuilder, className }: Props) {
  if (paginas <= 1) return null;

  const numeros = new Set<number>();
  for (let i = 1; i <= paginas; i++) {
    if (i === 1 || i === paginas || Math.abs(i - pagina) <= 1) numeros.add(i);
  }
  const lista = [...numeros].sort((a, b) => a - b);

  return (
    <nav
      className={cn("flex max-w-full flex-wrap items-center justify-center gap-1.5", className)}
      aria-label="Paginación"
    >
      {pagina > 1 && (
        <Link
          href={hrefBuilder(pagina - 1)}
          className="grid h-10 w-10 place-items-center rounded-full border border-beige-dark bg-white text-marron transition-colors hover:border-tomate hover:text-tomate"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
      {lista.map((n, idx) => (
        <span key={n} className="flex items-center gap-1.5">
          {idx > 0 && lista[idx - 1] !== n - 1 && (
            <span className="px-1 text-marron/40" aria-hidden>
              …
            </span>
          )}
          <Link
            href={hrefBuilder(n)}
            aria-current={n === pagina ? "page" : undefined}
            className={cn(
              "grid h-10 min-w-10 place-items-center rounded-full px-2 text-sm font-semibold transition-colors",
              n === pagina
                ? "bg-tomate text-crema shadow-[0_8px_18px_-10px_rgba(217,75,56,0.9)]"
                : "border border-beige-dark bg-white text-marron hover:border-tomate hover:text-tomate"
            )}
          >
            {n}
          </Link>
        </span>
      ))}
      {pagina < paginas && (
        <Link
          href={hrefBuilder(pagina + 1)}
          className="grid h-10 w-10 place-items-center rounded-full border border-beige-dark bg-white text-marron transition-colors hover:border-tomate hover:text-tomate"
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
