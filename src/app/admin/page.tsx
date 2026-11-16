import type { Metadata } from "next";
import Link from "next/link";
import {
  Wallet,
  Receipt,
  Package,
  Users,
  Gauge,
  PackageCheck,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { getProvider } from "@/lib/data";
import { formatPEN, formatFecha } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Dashboard" };

export default async function PaginaDashboard() {
  const provider = getProvider();
  const [estadisticas, pedidosPendientes] = await Promise.all([
    provider.getEstadisticas(),
    provider.listarPedidosAdmin({ estado: "pago_pendiente" }),
  ]);

  const tarjetas = [
    {
      titulo: "Ventas del mes",
      valor: formatPEN(estadisticas.ventasMes),
      detalle: `Total histórico: ${formatPEN(estadisticas.ventasTotales)}`,
      icono: Wallet,
      color: "bg-tomate/10 text-tomate",
    },
    {
      titulo: "Pedidos pendientes de pago",
      valor: String(estadisticas.pedidosPendientes),
      detalle: `${pedidosPendientes.length} esperan verificación de comprobante`,
      icono: Receipt,
      color: "bg-naranja/15 text-naranja-dark",
    },
    {
      titulo: "Pedidos completados",
      valor: `${estadisticas.pedidosCompletados} / ${estadisticas.pedidosTotales}`,
      detalle: `Ticket promedio ${formatPEN(estadisticas.ticketPromedio)}`,
      icono: PackageCheck,
      color: "bg-hojita/15 text-hojita",
    },
    {
      titulo: "Productos",
      valor: String(estadisticas.productosDisponibles),
      detalle: `${estadisticas.productosAgotados} agotados · ${estadisticas.productosBajos} con stock bajo`,
      icono: Package,
      color: "bg-beige text-marron",
    },
    {
      titulo: "Clientes",
      valor: String(estadisticas.clientes),
      detalle: "Cuentas registradas",
      icono: Users,
      color: "bg-tomate/10 text-tomate",
    },
    {
      titulo: "Ventas de hoy",
      valor: formatPEN(estadisticas.ventasHoy),
      detalle: "Acumulado del día",
      icono: Gauge,
      color: "bg-naranja/15 text-naranja-dark",
    },
  ];

  const maxSerie = Math.max(1, ...estadisticas.serieVentas.map((d) => d.total));

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="texto-jp text-sm text-tomate">ダッシュボード</p>
          <h1 className="mt-1 font-display text-2xl font-black tracking-tight text-marron sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-marron/60">
            Resumen general de la tienda en tiempo real.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/pedidos" className="btn-outline px-4 py-2.5 text-sm">
            <Receipt className="h-4 w-4" aria-hidden /> Ver pedidos
          </Link>
          <Link href="/admin/productos/nuevo" className="btn-primary px-4 py-2.5 text-sm">
            Nuevo producto <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>

      {/* Tarjetas */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tarjetas.map(({ titulo, valor, detalle, icono: Icono, color }) => (
          <section
            key={titulo}
            className="rounded-card border border-beige-dark/60 bg-white p-5 shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wide text-marron/55">{titulo}</p>
              <span className={cn("grid h-9 w-9 place-items-center rounded-xl", color)}>
                <Icono className="h-4.5 w-4.5" aria-hidden />
              </span>
            </div>
            <p className="mt-2 font-display text-2xl font-black text-marron">{valor}</p>
            <p className="mt-1 text-xs text-marron/55">{detalle}</p>
          </section>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Serie de ventas */}
        <section className="rounded-card border border-beige-dark/60 bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-marron">
            <TrendingUp className="h-4 w-4 text-tomate" aria-hidden />
            Ventas de los últimos días
          </h2>
          {estadisticas.serieVentas.length === 0 ? (
            <p className="mt-4 text-sm text-marron/55">Aún no hay ventas registradas.</p>
          ) : (
            <div className="mt-5 flex h-44 items-end gap-2">
              {estadisticas.serieVentas.map((d) => {
                const alto = Math.max(4, Math.round((d.total / maxSerie) * 100));
                return (
                  <div key={d.fecha} className="group flex min-w-0 flex-1 flex-col items-center gap-2">
                    <span className="w-full truncate text-center text-[10px] font-bold text-marron/60 opacity-0 transition-opacity group-hover:opacity-100">
                      {formatPEN(d.total)}
                    </span>
                    <div
                      className="w-full rounded-t-lg bg-tomate/85 transition-all group-hover:bg-tomate"
                      style={{ height: `${alto}%` }}
                      title={`${d.fecha}: ${formatPEN(d.total)}`}
                    />
                    <span className="w-full truncate text-center text-[10px] text-marron/50">
                      {d.fecha.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Top productos */}
        <section className="rounded-card border border-beige-dark/60 bg-white p-5 shadow-card">
          <h2 className="font-display text-lg font-bold text-marron">Productos más vendidos</h2>
          {estadisticas.topProductos.length === 0 ? (
            <p className="mt-4 text-sm text-marron/55">Todavía no hay ventas.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {estadisticas.topProductos.map((p, i) => (
                <li key={p.slug} className="flex items-center gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-tomate text-[11px] font-black text-crema">
                    {i + 1}
                  </span>
                  <Link
                    href={`/producto/${p.slug}`}
                    className="min-w-0 flex-1 truncate text-sm font-semibold text-marron hover:text-tomate"
                    target="_blank"
                  >
                    {p.nombre}
                  </Link>
                  <span className="shrink-0 text-xs text-marron/55">{p.unidades} u.</span>
                  <span className="shrink-0 text-sm font-bold text-tomate">
                    {formatPEN(p.ingresos)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pedidos por verificar */}
        <section className="rounded-card border border-beige-dark/60 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-marron">
              Pagos por verificar
            </h2>
            <Link href="/admin/pedidos?estado=pago_pendiente" className="text-xs font-bold text-tomate hover:underline">
              Ver todos
            </Link>
          </div>
          {pedidosPendientes.length === 0 ? (
            <p className="mt-4 text-sm text-marron/55">No hay pagos pendientes. ¡Todo al día!</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {pedidosPendientes.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/pedidos/${p.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-beige-dark/60 px-3.5 py-3 transition-colors hover:border-tomate/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-marron">#{p.numero}</span>
                      <span className="block truncate text-xs text-marron/55">
                        {p.direccion.nombreCompleto} · {formatFecha(p.creadoEn)}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-black text-tomate">
                      {formatPEN(p.total)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Actividad reciente */}
        <section className="rounded-card border border-beige-dark/60 bg-white p-5 shadow-card">
          <h2 className="font-display text-lg font-bold text-marron">Actividad reciente</h2>
          {estadisticas.actividadReciente.length === 0 ? (
            <p className="mt-4 text-sm text-marron/55">Sin actividad registrada todavía.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {estadisticas.actividadReciente.slice(0, 8).map((a, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      a.tipo === "pedido"
                        ? "bg-tomate"
                        : a.tipo === "pago"
                          ? "bg-hojita"
                          : "bg-naranja"
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="block text-marron/80">{a.texto}</span>
                    <span className="block text-xs text-marron/45">{formatFecha(a.fecha)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
