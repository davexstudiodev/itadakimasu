import type { EstadoPedido } from "@/types";
import { cn } from "@/lib/utils/cn";

/* Badge de estado de pedido (usable en servidor y cliente). */

const ESTILOS: Record<EstadoPedido, { texto: string; clase: string }> = {
  pendiente: { texto: "Pendiente", clase: "bg-beige text-marron" },
  pago_pendiente: { texto: "Pago por verificar", clase: "bg-naranja/15 text-naranja-dark" },
  pago_confirmado: { texto: "Pago confirmado", clase: "bg-tomate/10 text-tomate" },
  preparando: { texto: "Preparando", clase: "bg-naranja/15 text-naranja-dark" },
  en_camino: { texto: "En camino", clase: "bg-tomate/15 text-tomate" },
  entregado: { texto: "Entregado", clase: "bg-hojita/15 text-hojita" },
  cancelado: { texto: "Cancelado", clase: "bg-beige-dark/50 text-marron/70" },
  reembolsado: { texto: "Reembolsado", clase: "bg-beige-dark/50 text-marron/70" },
};

export function EstadoPedidoBadges({
  estado,
  className,
}: {
  estado: EstadoPedido;
  className?: string;
}) {
  const config = ESTILOS[estado];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide",
        config.clase,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {config.texto}
    </span>
  );
}
