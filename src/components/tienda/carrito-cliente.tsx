"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Trash2, ArrowRight, ShieldCheck } from "lucide-react";
import { useCarrito, subtotalDe, unidadesDe } from "@/store/carrito";
import { SelectorCantidad } from "@/components/ui/quantity-stepper";
import { EstadoVacio } from "@/components/ui/empty-state";
import { formatPEN, plural } from "@/lib/utils/format";
import { ConfirmarAccion } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toaster";
import { ImagenProducto } from "@/components/ui/imagen-producto";

/** Vista del carrito (estado local persistido). */
export function CarritoCliente() {
  const router = useRouter();
  const items = useCarrito((s) => s.items);
  const cambiarCantidad = useCarrito((s) => s.cambiarCantidad);
  const quitar = useCarrito((s) => s.quitar);
  const limpiar = useCarrito((s) => s.limpiar);

  if (items.length === 0) {
    return (
      <EstadoVacio
        icono={ShoppingBag}
        titulo="Tu carrito está vacío"
        descripcion="Añade tus favoritos ramen, snacks y bebidas japonesas y coreanas para empezar."
        accion={{ texto: "Explorar productos", href: "/productos" }}
      />
    );
  }

  const subtotal = subtotalDe(items);
  const unidades = unidadesDe(items);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      {/* Lista */}
      <div>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-marron/60">
            {unidades} {plural(unidades, "artículo", "artículos")}
          </h2>
          <ConfirmarAccion
            titulo="Vaciar carrito"
            descripcion="Se quitarán todos los artículos de tu carrito. Esta acción no se puede deshacer."
            textoConfirmar="Vaciar"
            onConfirmar={() => {
              limpiar();
              toast.success("Carrito vaciado");
              return { ok: true };
            }}
          >
            <button type="button" className="flex items-center gap-1.5 text-sm font-semibold text-tomate transition-colors hover:text-tomate-dark">
              <Trash2 className="h-4 w-4" aria-hidden />
              Vaciar
            </button>
          </ConfirmarAccion>
        </div>

        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li
              key={item.productoId}
              className="flex gap-4 rounded-card border border-beige-dark/60 bg-white p-3 sm:p-4"
            >
              <Link
                href={`/producto/${item.slug}`}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-crema sm:h-24 sm:w-24"
              >
                <ImagenProducto
                  src={item.imagen}
                  alt={item.nombre}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/producto/${item.slug}`}
                      className="line-clamp-2 text-sm font-semibold text-marron transition-colors hover:text-tomate sm:text-[15px]"
                    >
                      {item.nombre}
                    </Link>
                    <p className="mt-1 text-xs text-marron/50">
                      {formatPEN(item.precio)} c/u
                      {item.stock <= 5 && item.stock > 0 && (
                        <span className="ml-2 font-semibold text-naranja-dark">
                          Solo quedan {item.stock}
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      quitar(item.productoId);
                      toast.info("Artículo quitado del carrito");
                    }}
                    aria-label={`Quitar ${item.nombre} del carrito`}
                    className="rounded-full p-2 text-marron/45 transition-colors hover:bg-tomate/10 hover:text-tomate"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                  <SelectorCantidad
                    cantidad={item.cantidad}
                    max={Math.max(1, item.stock)}
                    onChange={(n) => cambiarCantidad(item.productoId, n)}
                    compacto
                  />
                  <span className="text-base font-black text-tomate">
                    {formatPEN(item.precio * item.cantidad)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <Link
          href="/productos"
          className="btn-ghost mt-4 inline-flex px-4 py-2 text-sm"
        >
          ← Seguir comprando
        </Link>
      </div>

      {/* Resumen */}
      <aside className="h-fit rounded-card border border-beige-dark/60 bg-white p-5 shadow-card lg:sticky lg:top-24">
        <h2 className="font-display text-lg font-bold text-marron">Resumen del pedido</h2>

        <dl className="mt-4 space-y-2.5 text-sm">
          <div className="flex justify-between text-marron/70">
            <dt>Subtotal</dt>
            <dd className="font-semibold text-marron">{formatPEN(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-marron/70">
            <dt>Envío</dt>
            <dd className="font-semibold text-marron/70">Se calcula en el checkout</dd>
          </div>
          <div className="flex justify-between border-t border-beige-dark pt-2.5 text-base">
            <dt className="font-bold text-marron">Total</dt>
            <dd className="font-black text-tomate">{formatPEN(subtotal)}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={() => router.push("/checkout")}
          className="btn-primary mt-5 w-full py-3.5 text-base"
        >
          Finalizar compra
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>

        <p className="mt-3 flex items-center gap-2 text-[11px] leading-relaxed text-marron/55">
          <ShieldCheck className="h-4 w-4 shrink-0 text-hojita" aria-hidden />
          Pago seguro con Yape: envías el comprobante y confirmamos tu pedido.
        </p>
      </aside>
    </div>
  );
}
