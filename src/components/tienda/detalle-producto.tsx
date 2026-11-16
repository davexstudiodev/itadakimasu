"use client";

import { useState } from "react";
import { Heart, ShoppingBag, Check, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import type { Producto } from "@/types";
import { formatPEN, porcentajeDescuento } from "@/lib/utils/format";
import { useCarrito } from "@/store/carrito";
import { useFavoritos } from "@/store/favoritos";
import { toast } from "@/components/ui/toaster";
import { SelectorCantidad } from "@/components/ui/quantity-stepper";
import { Estrellas } from "@/components/ui/rating";
import { ImagenProducto } from "@/components/ui/imagen-producto";
import { TextoFormateado } from "@/components/ui/texto-formateado";
import { cn } from "@/lib/utils/cn";

interface Props {
  producto: Producto;
  envioGratisDesde: number;
}

/** Bloque de compra: galería, precio, cantidad y añadir al carrito. */
export function DetalleProducto({ producto, envioGratisDesde }: Props) {
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);
  const [imagenActiva, setImagenActiva] = useState(0);
  const agregar = useCarrito((s) => s.agregar);
  const favoritos = useFavoritos((s) => s.ids);
  const alternar = useFavoritos((s) => s.alternar);
  const esFavorito = favoritos.includes(producto.id);

  const descuento = porcentajeDescuento(producto.precio, producto.precioAnterior);
  const agotado = producto.stock <= 0;
  const imagenes = producto.imagenes.length > 0 ? producto.imagenes : ["/logo.png"];

  const alCarrito = () => {
    if (agotado) return;
    agregar({
      productoId: producto.id,
      slug: producto.slug,
      nombre: producto.nombre,
      precio: producto.precio,
      precioAnterior: producto.precioAnterior ?? null,
      imagen: imagenes[0],
      cantidad,
      stock: producto.stock,
    });
    setAgregado(true);
    toast.success(`${producto.nombre} añadido al carrito`);
    setTimeout(() => setAgregado(false), 1800);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      {/* ---------- Galería ---------- */}
      <div className="space-y-3">
        <div className="relative aspect-square overflow-hidden rounded-card border border-beige-dark/60 bg-white shadow-card">
          <ImagenProducto
            src={imagenes[imagenActiva]}
            alt={producto.nombre}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain p-4"
          />
          {descuento > 0 && (
            <span className="absolute left-4 top-4 rounded-full bg-tomate px-3 py-1.5 text-xs font-bold text-crema shadow-sm">
              -{descuento}%
            </span>
          )}
          {agotado && (
            <span className="absolute left-4 top-4 rounded-full bg-marron px-3 py-1.5 text-xs font-bold text-crema shadow-sm">
              Agotado
            </span>
          )}
        </div>

        {imagenes.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-1 sm:pb-0">
            {imagenes.map((img, i) => (
              <button
                key={img}
                type="button"
                onClick={() => setImagenActiva(i)}
                aria-label={`Ver imagen ${i + 1}`}
                className={cn(
                  "relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition-all",
                  i === imagenActiva ? "border-tomate" : "border-transparent hover:border-beige-dark"
                )}
              >
                <ImagenProducto src={img} alt="" fill sizes="80px" className="object-contain p-1" />
              </button>
            ))}
          </div>
        )}
        <p className="text-center text-[11px] text-marron/50">
          Imágenes de referencia; la presentación real puede variar.
        </p>
      </div>

      {/* ---------- Información ---------- */}
      <div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-tomate/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-tomate">
            {producto.pais === "japon" ? "Japón" : "Corea"}
          </span>
          {producto.destacado && (
            <span className="rounded-full bg-marron/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-marron">
              Destacado
            </span>
          )}
          <span className="text-[11px] font-semibold uppercase tracking-wide text-marron/50">
            {producto.vendidos > 0 ? `${producto.vendidos} vendidos` : "Nuevo"}
          </span>
        </div>

        <h1 className="mt-3 font-display text-2xl font-black leading-tight tracking-tight text-marron sm:text-3xl">
          {producto.nombre}
        </h1>
        {producto.nombreOriginal && (
          <p className="texto-jp mt-1 text-base text-marron/60">{producto.nombreOriginal}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Estrellas valor={producto.valoracion} />
          <span className="text-sm font-semibold text-marron">
            {producto.numValoraciones > 0
              ? `${producto.valoracion.toFixed(1)} (${producto.numValoraciones})`
              : "Sin valoraciones aún"}
          </span>
        </div>

        {/* Precio */}
        <div className="mt-5 flex flex-wrap items-end gap-3 rounded-card border border-beige-dark/60 bg-white p-4">
          <span className="text-3xl font-black text-tomate">{formatPEN(producto.precio)}</span>
          {producto.precioAnterior && producto.precioAnterior > producto.precio && (
            <span className="pb-1 text-base font-medium text-marron/45 line-through">
              {formatPEN(producto.precioAnterior)}
            </span>
          )}
          <span className="ml-auto rounded-full bg-hojita/15 px-3 py-1 text-xs font-bold text-hojita">
            {agotado
              ? "Sin stock"
              : producto.stock <= producto.stockMinimo
                ? `¡Solo quedan ${producto.stock}!`
                : `${producto.stock} disponibles`}
          </span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-marron/75">
          <TextoFormateado texto={producto.descripcion} />
        </p>

        {/* Añadir */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <SelectorCantidad cantidad={cantidad} max={Math.max(1, producto.stock)} onChange={setCantidad} />
          <button
            type="button"
            onClick={alCarrito}
            disabled={agotado}
            className="btn-primary flex-1 px-7 py-3.5 text-base disabled:bg-marron/40"
          >
            {agotado ? (
              "Agotado"
            ) : agregado ? (
              <>
                <Check className="h-5 w-5" aria-hidden /> Añadido
              </>
            ) : (
              <>
                <ShoppingBag className="h-5 w-5" aria-hidden /> Añadir al carrito
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => alternar(producto.id)}
            aria-pressed={esFavorito}
            aria-label={esFavorito ? "Quitar de favoritos" : "Guardar en favoritos"}
            className={cn(
              "grid h-[54px] w-[54px] place-items-center rounded-full border transition-all hover:scale-105",
              esFavorito
                ? "border-tomate bg-tomate/10 text-tomate"
                : "border-beige-dark bg-white text-marron/50 hover:text-tomate"
            )}
          >
            <Heart className={cn("h-5 w-5", esFavorito && "fill-tomate")} />
          </button>
        </div>

        <p className="mt-3 text-xs text-marron/55">
          {agotado
            ? "Estamos agotados por ahora. Vuelve pronto."
            : envioGratisDesde > 0
              ? `Envío gratis en compras desde ${formatPEN(envioGratisDesde)}`
              : "Envío gratis"}
        </p>

        {/* Beneficios */}
        <ul className="mt-5 grid gap-2 rounded-card border border-beige-dark/60 bg-crema/70 p-4 text-xs font-medium text-marron/75 sm:grid-cols-3">
          <li className="flex items-center gap-2">
            <Truck className="h-4 w-4 shrink-0 text-tomate" aria-hidden /> Puerto Malabrigo en 24–48 h
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-tomate" aria-hidden /> Importación oficial
          </li>
          <li className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 shrink-0 text-tomate" aria-hidden /> Cambios fáciles
          </li>
        </ul>

        {/* Detalles rápidos */}
        <dl className="mt-5 divide-y divide-beige-dark/60 rounded-card border border-beige-dark/60 bg-white text-sm">
          <div className="flex gap-4 px-4 py-3">
            <dt className="w-28 shrink-0 font-semibold text-marron/60">Marca</dt>
            <dd className="capitalize text-marron">{producto.marcaSlug.replace(/-/g, " ")}</dd>
          </div>
          {producto.peso && (
            <div className="flex gap-4 px-4 py-3">
              <dt className="w-28 shrink-0 font-semibold text-marron/60">Peso</dt>
              <dd className="text-marron">{producto.peso}</dd>
            </div>
          )}
          {producto.alergenos && producto.alergenos.length > 0 && (
            <div className="flex gap-4 px-4 py-3">
              <dt className="w-28 shrink-0 font-semibold text-marron/60">Alérgenos</dt>
              <dd className="text-marron">{producto.alergenos.join(", ")}</dd>
            </div>
          )}
          <div className="flex gap-4 px-4 py-3">
            <dt className="w-28 shrink-0 font-semibold text-marron/60">Categoría</dt>
            <dd className="capitalize text-marron">{producto.categoriaSlug.replace(/-/g, " ")}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
