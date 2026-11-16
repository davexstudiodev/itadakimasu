import type { Metadata } from "next";
import Link from "next/link";
import { Search, Receipt, ChevronRight } from "lucide-react";
import { getProvider } from "@/lib/data";
import { formatPEN, formatFecha } from "@/lib/utils/format";
import { EstadoPedidoBadges } from "@/components/tienda/estado-pedido";
import { EstadoVacio } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils/cn";
import type { EstadoPedido } from "@/types";

export const metadata: Metadata = { title: "Pedidos" };

interface Props {
  searchParams: Promise<{ estado?: string; q?: string }>;
}

const ESTADOS: { id: EstadoPedido | "todos"; texto: string }[] = [
  { id: "todos", texto: "Todos" },
  { id: "pago_pendiente", texto: "Pago por verificar" },
  { id: "pago_confirmado", texto: "Pago confirmado" },
  { id: "preparando", texto: "Preparando" },
  { id: "en_camino", texto: "En camino" },
  { id: "entregado", texto: "Entregado" },
  { id: "cancelado", texto: "Cancelado" },
];

const ES_ESTADO = new Set<string>(ESTADOS.map((e) => e.id));

function uno(v: string | string[] | undefined): string | undefined {
  const valor = Array.isArray(v) ? v[0] : v;
  return valor && valor.trim() !== "" ? valor.trim() : undefined;
}

export default async function PaginaPedidosAdmin({ searchParams }: Props) {
  const sp = await searchParams;
  const estadoRaw = uno(sp.estado);
  const estado: EstadoPedido | undefined =
    estadoRaw && estadoRaw !== "todos" && ES_ESTADO.has(estadoRaw)
      ? (estadoRaw as EstadoPedido)
      : undefined;
  const q = uno(sp.q);

  const pedidos = await getProvider().listarPedidosAdmin({ estado, q });

  const url = (nuevoEstado?: string, nuevaQ?: string): string => {
    const params = new URLSearchParams();
    if (nuevoEstado && nuevoEstado !== "todos") params.set("estado", nuevoEstado);
    if (nuevaQ) params.set("q", nuevaQ);
    const qs = params.toString();
    return qs ? `/admin/pedidos?${qs}` : "/admin/pedidos";
  };

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div>
        <p className="texto-jp text-sm text-tomate">注文管理</p>
        <h1 className="mt-1 font-display text-2xl font-black tracking-tight text-marron sm:text-3xl">
          Pedidos
        </h1>
        <p className="mt-1 text-sm text-marron/60">
          {pedidos.length} pedido{pedidos.length === 1 ? "" : "s"} con este filtro
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        {ESTADOS.map((e) => (
          <Link
            key={e.id}
            href={url(e.id, q)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
              (estadoRaw ?? "todos") === e.id
                ? "border-tomate bg-tomate text-crema"
                : "border-beige-dark bg-white text-marron hover:border-tomate hover:text-tomate"
            )}
          >
            {e.texto}
          </Link>
        ))}

        <form method="get" action="/admin/pedidos" className="ml-auto flex gap-2">
          {estadoRaw && estadoRaw !== "todos" && (
            <input type="hidden" name="estado" value={estadoRaw} />
          )}
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-marron/40"
              aria-hidden
            />
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="# número, cliente o teléfono"
              aria-label="Buscar pedidos"
              className="campo w-56 pl-9"
            />
          </div>
          <button type="submit" className="btn-outline px-4 py-2.5 text-sm">
            Buscar
          </button>
        </form>
      </div>

      {/* Lista */}
      {pedidos.length === 0 ? (
        <EstadoVacio
          icono={Receipt}
          titulo="No hay pedidos con este filtro"
          descripcion="Prueba con otro estado o borra la búsqueda."
          accion={{ texto: "Ver todos", href: "/admin/pedidos" }}
        />
      ) : (
        <div className="overflow-hidden rounded-card border border-beige-dark/60 bg-white shadow-card">
          <div className="hidden gap-4 border-b border-beige-dark/60 bg-crema/70 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-marron/60 lg:grid lg:grid-cols-[130px_1fr_150px_110px_110px_100px]">
            <span>Número</span>
            <span>Cliente</span>
            <span>Fecha</span>
            <span>Pago</span>
            <span>Total</span>
            <span className="text-right">Estado</span>
          </div>

          <ul className="divide-y divide-beige-dark/60">
            {pedidos.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/pedidos/${p.id}`}
                  className="grid gap-2 px-4 py-3.5 transition-colors hover:bg-crema/50 lg:grid-cols-[130px_1fr_150px_110px_110px_100px] lg:items-center"
                >
                  <span className="flex items-center gap-1 text-sm font-black text-marron">
                    #{p.numero}
                    <ChevronRight className="h-3.5 w-3.5 text-marron/35 lg:hidden" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-marron">
                      {p.direccion.nombreCompleto}
                    </span>
                    <span className="block truncate text-xs text-marron/50">
                      {p.direccion.telefono} · {p.items.reduce((s, i) => s + i.cantidad, 0)} artículo(s)
                    </span>
                  </span>
                  <span className="text-xs text-marron/60">{formatFecha(p.creadoEn)}</span>
                  <span className="text-xs font-semibold capitalize text-marron/70">
                    {p.metodoPago === "contra_entrega"
                      ? "Contra entrega"
                      : p.metodoPago === "transferencia"
                        ? "Transferencia"
                        : p.metodoPago}
                  </span>
                  <span className="text-sm font-black text-tomate">{formatPEN(p.total)}</span>
                  <span className="lg:text-right">
                    <EstadoPedidoBadges estado={p.estado} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
