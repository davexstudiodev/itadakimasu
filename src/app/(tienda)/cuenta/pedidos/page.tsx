import type { Metadata } from "next";
import Link from "next/link";
import { Receipt, ChevronRight } from "lucide-react";
import { getUsuarioActual } from "@/lib/auth";
import { getProvider } from "@/lib/data";
import { formatPEN, formatFecha } from "@/lib/utils/format";
import { EstadoPedidoBadges } from "@/components/tienda/estado-pedido";
import { EstadoVacio } from "@/components/ui/empty-state";
import { ImagenProducto } from "@/components/ui/imagen-producto";

export const metadata: Metadata = {
  title: "Mis pedidos — ITADAKIMASU",
  description: "Sigue el estado de todos tus pedidos.",
};

const ETIQUETAS_PAGO: Record<string, string> = {
  yape: "Yape",
  plin: "Plin",
  transferencia: "Transferencia",
  contra_entrega: "Contra entrega",
  pasarela: "Pasarela",
};

const ETIQUETAS_ENVIO: Record<string, string> = {
  recojo_tienda: "Recojo en tienda",
  delivery_local: "Delivery en Puerto Malabrigo",
};

export default async function PaginaPedidos() {
  const usuario = await getUsuarioActual();
  if (!usuario) return null;
  const pedidos = await getProvider().listarPedidosUsuario(usuario.id);

  if (pedidos.length === 0) {
    return (
      <EstadoVacio
        icono={Receipt}
        titulo="Aún no tienes pedidos"
        descripcion="Cuando hagas tu primer pedido, podrás seguirlo aquí paso a paso."
        accion={{ texto: "Ver productos", href: "/productos" }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-marron/60">
        {pedidos.length} pedido{pedidos.length === 1 ? "" : "s"} en total
      </p>

      {pedidos.map((p) => (
        <Link
          key={p.id}
          href={`/confirmacion/${p.numero}`}
          className="group block rounded-card border border-beige-dark/60 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-tomate/40 hover:shadow-card sm:p-5"
        >
          <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div>
              <p className="flex items-center gap-2 font-display font-bold text-marron">
                #{p.numero}
                <ChevronRight className="h-4 w-4 text-marron/40 transition-transform group-hover:translate-x-0.5 group-hover:text-tomate" aria-hidden />
              </p>
              <p className="text-xs text-marron/55">{formatFecha(p.creadoEn)}</p>
            </div>
            <EstadoPedidoBadges estado={p.estado} />
          </div>

          {/* Items */}
          <ul className="mt-3 flex flex-wrap gap-2">
            {p.items.slice(0, 5).map((i) => (
              <li key={i.productoId} className="relative h-14 w-14 overflow-hidden rounded-lg bg-crema" title={i.nombre}>
                <ImagenProducto src={i.imagen} alt={i.nombre} fill sizes="56px" className="object-cover" />
              </li>
            ))}
            {p.items.length > 5 && (
              <li className="grid h-14 w-14 place-items-center rounded-lg bg-beige text-xs font-bold text-marron/70">
                +{p.items.length - 5}
              </li>
            )}
          </ul>

          <div className="mt-3 flex flex-col gap-2 border-t border-beige-dark/60 pt-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <p className="break-words text-marron/65">
              {p.items.reduce((s, i) => s + i.cantidad, 0)} artículo{p.items.reduce((s, i) => s + i.cantidad, 0) === 1 ? "" : "s"}
              {" · "}
              {ETIQUETAS_PAGO[p.metodoPago] ?? p.metodoPago}
              {" · "}
              {ETIQUETAS_ENVIO[p.metodoEnvio] ?? p.metodoEnvio}
            </p>
            <p className="self-end font-black text-tomate sm:self-auto">{formatPEN(p.total)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
