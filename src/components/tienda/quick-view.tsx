"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ShoppingBag, Star } from "lucide-react";
import type { Producto } from "@/types";
import { formatPEN, porcentajeDescuento } from "@/lib/utils/format";
import { useCarrito } from "@/store/carrito";
import { toast } from "@/components/ui/toaster";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils/cn";

interface Props {
  producto: Producto;
  abierto: boolean;
  onCerrar: () => void;
}

/**
 * Overlay de inspección (vista rápida): se abre al presionar una tarjeta
 * de producto y muestra la galería, datos clave y acciones sin salir
 * de la página actual.
 */
export function QuickViewProducto({ producto, abierto, onCerrar }: Props) {
  const agregar = useCarrito((s) => s.agregar);
  // Portal a <body> vía inicializador (solo en cliente; en SSR queda null):
  // evita que el fixed del modal se relativice a los transforms de framer-motion.
  const [nodo] = useState<HTMLElement | null>(() =>
    typeof document === "undefined" ? null : document.body
  );
  const [imagenActiva, setImagenActiva] = useState(0);

  // Reinicia la galería al abrir (ajuste durante render, sin useEffect).
  const [abiertoPrevio, setAbiertoPrevio] = useState(abierto);
  if (abierto !== abiertoPrevio) {
    setAbiertoPrevio(abierto);
    if (abierto) setImagenActiva(0);
  }

  const descuento = porcentajeDescuento(producto.precio, producto.precioAnterior);
  const agotado = producto.stock <= 0;
  const imagenes = producto.imagenes.length > 0 ? producto.imagenes : ["/logo.png"];

  const alCarrito = () => {
    if (agotado) {
      toast.error("Este producto está agotado");
      return;
    }
    agregar({
      productoId: producto.id,
      slug: producto.slug,
      nombre: producto.nombre,
      precio: producto.precio,
      precioAnterior: producto.precioAnterior ?? null,
      imagen: imagenes[0],
      cantidad: 1,
      stock: producto.stock,
    });
    toast.success(`${producto.nombre} añadido al carrito`);
    onCerrar();
  };

  if (!nodo) return null;

  return createPortal(
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={producto.nombre}
      descripcion="Vista rápida · inspecciona el producto"
      ancho="max-w-3xl"
    >
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
        {/* Galería */}
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-beige-dark/60 bg-crema sm:aspect-square sm:bg-white">
            <Image
              src={imagenes[imagenActiva] ?? imagenes[0]}
              alt={producto.nombre}
              fill
              sizes="(max-width: 640px) 100vw, 45vw"
              className="object-contain sm:object-cover"
            />
            {descuento > 0 && !agotado && (
              <span className="absolute left-3 top-3 rounded-full bg-tomate px-2.5 py-1 text-[11px] font-bold text-crema shadow-sm">
                -{descuento}%
              </span>
            )}
            {agotado && (
              <span className="absolute left-3 top-3 rounded-full bg-marron/85 px-2.5 py-1 text-[11px] font-bold text-crema shadow-sm">
                Agotado
              </span>
            )}
          </div>

          {imagenes.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {imagenes.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => setImagenActiva(i)}
                  aria-label={`Ver imagen ${i + 1} de ${imagenes.length}`}
                  aria-pressed={i === imagenActiva}
                  className={cn(
                    "relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                    i === imagenActiva
                      ? "border-tomate opacity-100"
                      : "border-beige-dark/60 opacity-60 hover:opacity-100"
                  )}
                >
                  <Image src={src} alt="" fill sizes="56px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Información */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-tomate">
              {producto.pais === "japon" ? "🇯🇵 Japón" : "🇰🇷 Corea"}
            </span>
            {producto.numValoraciones > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-marron/60">
                <Star className="h-3 w-3 fill-naranja text-naranja" aria-hidden />
                {producto.valoracion.toFixed(1)} ({producto.numValoraciones})
              </span>
            )}
          </div>

          {producto.nombreOriginal && (
            <p className="texto-jp mt-1 text-sm text-marron/50">{producto.nombreOriginal}</p>
          )}

          <p className="mt-2 text-sm leading-relaxed text-marron/70">{producto.descripcion}</p>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-tomate">{formatPEN(producto.precio)}</span>
            {producto.precioAnterior && producto.precioAnterior > producto.precio && (
              <span className="text-sm font-medium text-marron/45 line-through">
                {formatPEN(producto.precioAnterior)}
              </span>
            )}
          </div>

          <p className="mt-2 text-xs text-marron/55">
            {agotado ? (
              <span className="font-semibold text-tomate">Sin stock</span>
            ) : producto.stock <= producto.stockMinimo ? (
              <span className="font-semibold text-naranja-dark">Quedan {producto.stock} unidades</span>
            ) : (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3 text-hojita" aria-hidden /> En stock · {producto.stock} disponibles
              </span>
            )}
          </p>

          {producto.etiquetas.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {producto.etiquetas.slice(0, 5).map((etiqueta) => (
                <span
                  key={etiqueta}
                  className="rounded-full border border-beige-dark/60 bg-white px-2.5 py-1 text-[11px] font-semibold text-marron/60"
                >
                  {etiqueta}
                </span>
              ))}
            </div>
          )}

          <div className="mt-auto space-y-1.5 pt-4 sm:space-y-2 sm:pt-5">
            <button
              type="button"
              onClick={alCarrito}
              disabled={agotado}
              className="btn-primary w-full py-2 disabled:bg-marron/50 sm:py-3"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden />
              {agotado ? "Agotado" : "Añadir al carrito"}
            </button>
            <Link
              href={`/producto/${producto.slug}`}
              onClick={onCerrar}
              className="btn-outline w-full py-2 sm:py-3"
            >
              Ver detalle completo
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </Modal>,
    nodo
  );
}
