import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Estrellas({
  valor,
  tamano = "h-4 w-4",
  className,
}: {
  valor: number;
  tamano?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`Valoración ${valor} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={cn(
            tamano,
            i <= Math.round(valor)
              ? "fill-naranja text-naranja"
              : "fill-beige-dark/60 text-beige-dark"
          )}
        />
      ))}
    </span>
  );
}
