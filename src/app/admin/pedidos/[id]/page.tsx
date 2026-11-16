import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Truck, Receipt, User, Clock } from "lucide-react";
import { getProvider } from "@/lib/data";
import { formatPEN, formatFecha } from "@/lib/utils/format";
import { EstadoPedidoBadges } from "@/components/tienda/estado-pedido";
import { AccionesPedido } from "@/components/admin/acciones-pedido";
import { ImagenProducto } from "@/components/ui/imagen-producto";

export const metadata: Metadata = { title: "Detalle de pedido" };

interface Props {
  params: Promise<{ id: string }>;
}

const ETIQUETAS_PAGO: Record<string, string> = {
  yape: "Yape",
  plin: "Plin",
  transferencia: "Transferencia bancaria",
  contra_entrega: "Contra entrega",
  pasarela: "Pasarela",
};

const ETIQUETAS_ENVIO: Record<string, string> = {
  recojo_tienda: "Recojo en tienda",
  delivery_local: "Delivery en Puerto Malabrigo",
};

export default async function PaginaDetallePedidoAdmin({ params }: Props) {
  const { id } = await params;
  const provider = getProvider();
  const pedido = await provider.getPedido(id);
  if (!pedido) notFound();

  const cliente = await provider.getPerfil(pedido.usuarioId);

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/pedidos"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-tomate hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Volver a pedidos
          </Link>
          <p className="texto-jp mt-2 text-sm text-tomate">注文詳細</p>
          <h1 className="mt-1 flex flex-wrap items-center gap-3 font-display text-2xl font-black tracking-tight text-marron sm:text-3xl">
            Pedido #{pedido.numero}
            <EstadoPedidoBadges estado={pedido.estado} />
          </h1>
          <p className="mt-1 text-sm text-marron/60">
            Creado el {formatFecha(pedido.creadoEn)} · {pedido.items.length} producto(s)
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Artículos */}
          <section className="rounded-card border border-beige-dark/60 bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-marron">
              <Receipt className="h-4 w-4 text-tomate" aria-hidden /> Artículos
            </h2>
            <ul className="mt-4 divide-y divide-beige-dark/60">
              {pedido.items.map((i) => (
                <li key={i.productoId} className="flex items-center gap-3 py-3 first:pt-0">
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-crema">
                    <ImagenProducto src={i.imagen || "/logo.png"} alt={i.nombre} fill sizes="48px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <Link
                      href={`/producto/${i.slug}`}
                      target="_blank"
                      className="line-clamp-1 text-sm font-bold text-marron hover:text-tomate"
                    >
                      {i.nombre}
                    </Link>
                    <span className="text-xs text-marron/50">
                      {i.cantidad} × {formatPEN(i.precioUnitario)}
                    </span>
                  </span>
                  <span className="text-sm font-black text-marron">{formatPEN(i.subtotal)}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-beige-dark pt-4 text-sm">
              <div className="flex justify-between text-marron/70">
                <dt>Subtotal</dt>
                <dd className="font-semibold text-marron">{formatPEN(pedido.subtotal)}</dd>
              </div>
              {pedido.descuento > 0 && (
                <div className="flex justify-between text-hojita">
                  <dt>Descuento {pedido.cuponCodigo && `(${pedido.cuponCodigo})`}</dt>
                  <dd className="font-semibold">−{formatPEN(pedido.descuento)}</dd>
                </div>
              )}
              <div className="flex justify-between text-marron/70">
                <dt>Envío</dt>
                <dd className="font-semibold text-marron">
                  {pedido.envio === 0 ? "Gratis" : formatPEN(pedido.envio)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-beige-dark pt-2 text-base">
                <dt className="font-bold text-marron">Total</dt>
                <dd className="font-black text-tomate">{formatPEN(pedido.total)}</dd>
              </div>
            </dl>

            {pedido.notas && (
              <p className="mt-4 rounded-xl bg-crema px-4 py-3 text-xs leading-relaxed text-marron/75">
                <strong className="text-marron">Notas del cliente:</strong> {pedido.notas}
              </p>
            )}
          </section>

          {/* Historial */}
          <section className="rounded-card border border-beige-dark/60 bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-marron">
              <Clock className="h-4 w-4 text-tomate" aria-hidden /> Historial
            </h2>
            <ol className="mt-4 space-y-3.5">
              {pedido.historial.map((h, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-tomate" aria-hidden />
                  <span>
                    <span className="font-semibold capitalize text-marron">
                      {h.estado.replace(/_/g, " ")}
                    </span>
                    <span className="block text-xs text-marron/50">{formatFecha(h.fecha)}</span>
                    {h.nota && <span className="block text-xs text-marron/65">{h.nota}</span>}
                  </span>
                </li>
              ))}
              {pedido.historial.length === 0 && (
                <li className="text-sm text-marron/55">Sin movimientos registrados.</li>
              )}
            </ol>
          </section>
        </div>

        {/* Lateral */}
        <aside className="space-y-6">
          <AccionesPedido pedido={pedido} />

          <section className="rounded-card border border-beige-dark/60 bg-white p-5">
            <h2 className="flex items-center gap-2 font-display font-bold text-marron">
              <User className="h-4 w-4 text-tomate" aria-hidden /> Cliente
            </h2>
            <p className="mt-3 text-sm font-bold text-marron">{pedido.direccion.nombreCompleto}</p>
            <p className="text-sm text-marron/70">{cliente?.email ?? "—"}</p>
            <p className="text-sm text-marron/70">{pedido.direccion.telefono}</p>
            <p className="mt-1 text-xs text-marron/50">
              {cliente
                ? `Cuenta ${cliente.rol === "admin" ? "administrador" : "cliente"} · ${
                    cliente.activo ? "activa" : "desactivada"
                  }`
                : "Cuenta no encontrada"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={`https://wa.me/51${pedido.direccion.telefono.replace(/\D/g, "").replace(/^51/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline px-4 py-2 text-xs"
              >
                WhatsApp
              </a>
              <a
                href={`mailto:${cliente?.email ?? ""}`}
                className="btn-ghost px-4 py-2 text-xs"
              >
                Correo
              </a>
            </div>
          </section>

          <section className="rounded-card border border-beige-dark/60 bg-white p-5">
            <h2 className="flex items-center gap-2 font-display font-bold text-marron">
              <MapPin className="h-4 w-4 text-tomate" aria-hidden /> Entrega
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-marron/75">
              {pedido.direccion.direccion}
              <br />
              {pedido.direccion.distrito}, {pedido.direccion.provincia} — {pedido.direccion.departamento}
            </p>
            {pedido.direccion.referencia && (
              <p className="mt-1 text-xs text-marron/55">Ref.: {pedido.direccion.referencia}</p>
            )}
            {pedido.direccion.indicaciones && (
              <p className="mt-1 text-xs text-marron/55">
                Indicaciones: {pedido.direccion.indicaciones}
              </p>
            )}
            <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-marron/65">
              <Truck className="h-3.5 w-3.5" aria-hidden />
              {ETIQUETAS_ENVIO[pedido.metodoEnvio] ?? pedido.metodoEnvio} ·{" "}
              {ETIQUETAS_PAGO[pedido.metodoPago] ?? pedido.metodoPago}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
