import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CircleCheck, Package, Truck, MapPin, Wallet, Receipt } from "lucide-react";
import { getProvider } from "@/lib/data";
import { getUsuarioActual } from "@/lib/auth";
import { formatPEN, formatFecha } from "@/lib/utils/format";
import { siteConfig } from "@/lib/config/site";
import { EstadoPedidoBadges } from "@/components/tienda/estado-pedido";
import { LimpiarCarrito } from "@/components/tienda/limpiar-carrito";
import type { EstadoPedido } from "@/types";

interface Props {
  params: Promise<{ numero: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { numero } = await params;
  return { title: `Pedido ${numero} — ITADAKIMASU` };
}

const PASOS: { estado: EstadoPedido; texto: string }[] = [
  { estado: "pago_pendiente", texto: "Pago por verificar" },
  { estado: "pago_confirmado", texto: "Pago confirmado" },
  { estado: "preparando", texto: "Preparando tu pedido" },
  { estado: "en_camino", texto: "En camino" },
  { estado: "entregado", texto: "Entregado" },
];

export default async function PaginaConfirmacion({ params }: Props) {
  const { numero } = await params;
  const usuario = await getUsuarioActual();
  const pedido = await getProvider().getPedidoPorNumero(numero);
  if (!pedido) notFound();
  if (!usuario || (pedido.usuarioId !== usuario.id && usuario.rol !== "admin")) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Order",
    orderNumber: pedido.numero,
    orderStatus: `https://schema.org/${pedido.estado === "entregado" ? "OrderDelivered" : "OrderProcessing"}`,
    priceCurrency: "PEN",
    price: pedido.total,
    dateCreated: pedido.creadoEn,
  };

  const idxPaso =
    pedido.estado === "cancelado" || pedido.estado === "reembolsado"
      ? -1
      : PASOS.findIndex(
          (p) =>
            (p.estado === "pago_pendiente" && pedido.estado === "pendiente") ||
            p.estado === pedido.estado
        );

  const porVerificar = pedido.estado === "pago_pendiente" || pedido.estado === "pendiente";

  return (
    <div className="contenedor max-w-4xl py-8 sm:py-12">
      <LimpiarCarrito />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Encabezado */}
      <div className="text-center">
        <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-hojita/15">
          <CircleCheck className="h-8 w-8 text-hojita" aria-hidden />
        </span>
        <h1 className="mt-4 font-display text-3xl font-black tracking-tight text-marron">
          ¡Gracias por tu pedido!
        </h1>
        <p className="mt-2 text-marron/70">
          Tu pedido <strong className="text-tomate">#{pedido.numero}</strong> fue recibido el{" "}
          {formatFecha(pedido.creadoEn)}.
        </p>
        <div className="mt-3 flex justify-center">
          <EstadoPedidoBadges estado={pedido.estado} />
        </div>
      </div>

      {/* Aviso de pago manual */}
      {porVerificar && (
        <div className="mt-6 rounded-card border border-naranja/40 bg-naranja/10 p-5 text-sm leading-relaxed text-marron/85">
          <p className="flex items-center gap-2 font-bold text-naranja-dark">
            <Wallet className="h-4 w-4" aria-hidden />
            {pedido.metodoPago === "contra_entrega"
              ? "Pagas contra entrega"
              : "Pago pendiente de verificación"}
          </p>

          {pedido.metodoPago === "yape" ? (
            <div className="mt-3 grid gap-4 sm:grid-cols-[150px_1fr] sm:items-center">
              <span className="mx-auto block w-full max-w-[150px] overflow-hidden rounded-xl border border-[#780699]/20 bg-white shadow-card sm:mx-0">
                <Image
                  src="/pagos/yape-qr.jpg"
                  alt="QR de Yape — Elias Josue David Casusol Leyva"
                  width={1131}
                  height={1599}
                  className="h-auto w-full"
                />
              </span>
              <div className="min-w-0">
                <p>
                  Escanea el QR con tu app Yape y transfiere{" "}
                  <strong>{formatPEN(pedido.total)}</strong> (monto exacto).
                </p>
                <p className="mt-2">
                  Luego envía la captura del comprobante por{" "}
                  <a
                    href={siteConfig.redes.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-tomate underline"
                  >
                    WhatsApp
                  </a>{" "}
                  indicando tu número de pedido. A nombre de{" "}
                  <strong>Elias Josue David Casusol Leyva</strong>. Tu pedido pasa a «pago confirmado»
                  en cuanto lo verifiquemos (normalmente en minutos).
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-2">
              {pedido.metodoPago === "plin" && (
                <>
                  Realiza la transferencia por <strong>Plin</strong> al <strong>{siteConfig.telefono}</strong>{" "}
                  (ITADAKIMASU) por <strong>{formatPEN(pedido.total)}</strong>.
                </>
              )}
              {pedido.metodoPago === "transferencia" && (
                <>
                  Realiza la <strong>transferencia bancaria</strong> por <strong>{formatPEN(pedido.total)}</strong>{" "}
                  y conserva tu comprobante.
                </>
              )}
              {pedido.metodoPago === "contra_entrega" && <>Ten listo el efectivo de {formatPEN(pedido.total)}.</>}
            </p>
          )}

          {pedido.metodoPago !== "yape" && (
            <p className="mt-2">
              Envía tu comprobante por{" "}
              <a
                href={siteConfig.redes.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-tomate underline"
              >
                WhatsApp
              </a>{" "}
              y confirmaremos tu pedido. También puedes ver su estado en{" "}
              <Link href="/cuenta/pedidos" className="font-semibold text-tomate underline">
                Mis pedidos
              </Link>
              .
            </p>
          )}
          {pedido.metodoPago === "yape" && (
            <p className="mt-3">
              También puedes ver el estado de tu pedido en{" "}
              <Link href="/cuenta/pedidos" className="font-semibold text-tomate underline">
                Mis pedidos
              </Link>
              .
            </p>
          )}
        </div>
      )}

      {/* Progreso */}
      {idxPaso >= 0 && (
        <ol className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {PASOS.map((p, i) => {
            const completado = i <= idxPaso;
            return (
              <li key={p.estado} className="text-center">
                <span
                  className={`mx-auto grid h-8 w-8 place-items-center rounded-full text-xs font-black ${
                    completado ? "bg-tomate text-crema" : "bg-beige text-marron/50"
                  }`}
                >
                  {i + 1}
                </span>
                <p className={`mt-1.5 text-[11px] font-semibold ${completado ? "text-marron" : "text-marron/45"}`}>
                  {p.texto}
                </p>
              </li>
            );
          })}
        </ol>
      )}

      {/* Detalle */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <section className="rounded-card border border-beige-dark/60 bg-white p-5">
          <h2 className="flex items-center gap-2 font-display font-bold text-marron">
            <Package className="h-4 w-4 text-tomate" aria-hidden /> Artículos
          </h2>
          <ul className="mt-4 space-y-3">
            {pedido.items.map((i) => (
              <li key={i.productoId} className="flex items-center gap-3">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-crema">
                  <Image src={i.imagen} alt={i.nombre} fill sizes="48px" className="object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  <Link href={`/producto/${i.slug}`} className="line-clamp-1 text-sm font-medium text-marron hover:text-tomate">
                    {i.nombre}
                  </Link>
                  <span className="text-xs text-marron/50">
                    {i.cantidad} x {formatPEN(i.precioUnitario)}
                  </span>
                </span>
                <span className="text-sm font-semibold text-marron">{formatPEN(i.subtotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-beige-dark pt-3 text-sm">
            <div className="flex justify-between text-marron/70"><dt>Subtotal</dt><dd>{formatPEN(pedido.subtotal)}</dd></div>
            {pedido.descuento > 0 && (
              <div className="flex justify-between text-hojita">
                <dt>Descuento {pedido.cuponCodigo && `(${pedido.cuponCodigo})`}</dt>
                <dd>−{formatPEN(pedido.descuento)}</dd>
              </div>
            )}
            <div className="flex justify-between text-marron/70"><dt>Envío</dt><dd>{pedido.envio === 0 ? "Gratis" : formatPEN(pedido.envio)}</dd></div>
            <div className="flex justify-between border-t border-beige-dark pt-1.5 text-base font-black text-tomate">
              <dt>Total</dt><dd>{formatPEN(pedido.total)}</dd>
            </div>
          </dl>
        </section>

        <div className="space-y-6">
          <section className="rounded-card border border-beige-dark/60 bg-white p-5">
            <h2 className="flex items-center gap-2 font-display font-bold text-marron">
              <MapPin className="h-4 w-4 text-tomate" aria-hidden /> Entrega
            </h2>
            <p className="mt-3 text-sm font-semibold text-marron">{pedido.direccion.nombreCompleto}</p>
            <p className="text-sm text-marron/70">
              {pedido.direccion.direccion}, {pedido.direccion.distrito}
            </p>
            <p className="text-sm text-marron/70">
              {pedido.direccion.provincia}, {pedido.direccion.departamento}
            </p>
            <p className="text-sm text-marron/70">{pedido.direccion.telefono}</p>
            {pedido.direccion.referencia && (
              <p className="mt-1 text-xs text-marron/55">Ref.: {pedido.direccion.referencia}</p>
            )}
            <p className="mt-3 flex items-center gap-2 text-xs font-medium text-marron/60">
              <Truck className="h-3.5 w-3.5" aria-hidden />
              {pedido.metodoEnvio === "recojo_tienda" ? "Recojo en tienda" : "Delivery en Puerto Malabrigo"}
              {" · "}
              {pedido.metodoPago === "contra_entrega"
                ? "Pago contra entrega"
                : `Pago: ${pedido.metodoPago === "yape" ? "Yape" : pedido.metodoPago === "plin" ? "Plin" : "Transferencia"}`}
            </p>
          </section>

          {pedido.historial.length > 0 && (
            <section className="rounded-card border border-beige-dark/60 bg-white p-5">
              <h2 className="flex items-center gap-2 font-display font-bold text-marron">
                <Receipt className="h-4 w-4 text-tomate" aria-hidden /> Historial
              </h2>
              <ol className="mt-3 space-y-3">
                {pedido.historial.map((h, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-tomate" aria-hidden />
                    <span>
                      <span className="font-semibold capitalize text-marron">{h.estado.replace(/_/g, " ")}</span>
                      <span className="block text-xs text-marron/55">{formatFecha(h.fecha)}</span>
                      {h.nota && <span className="block text-xs text-marron/65">{h.nota}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/cuenta/pedidos" className="btn-outline px-6 py-3">
          Ver mis pedidos
        </Link>
        <Link href="/productos" className="btn-primary px-6 py-3">
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
