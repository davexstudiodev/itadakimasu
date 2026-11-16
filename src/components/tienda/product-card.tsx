"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Star, Check } from "lucide-react";
import { motion } from "framer-motion";
import type { Producto } from "@/types";
import { formatPEN, porcentajeDescuento } from "@/lib/utils/format";
import { useCarrito } from "@/store/carrito";
import { useFavoritos } from "@/store/favoritos";
import { toast } from "@/components/ui/toaster";
import { QuickViewProducto } from "@/components/tienda/quick-view";
import { ImagenProducto } from "@/components/ui/imagen-producto";
import { cn } from "@/lib/utils/cn";

interface Props {
  producto: Producto;
  indice?: number;
  compacto?: boolean;
}

export function ProductCard({ producto, indice = 0, compacto }: Props) {
  const agregar = useCarrito((s) => s.agregar);
  const favoritos = useFavoritos((s) => s.ids);
  const alternar = useFavoritos((s) => s.alternar);
  const esFavorito = favoritos.includes(producto.id);
  const descuento = porcentajeDescuento(producto.precio, producto.precioAnterior);
  const agotado = producto.stock <= 0;
  const [inspeccionando, setInspeccionando] = useState(false);

  const alCarrito = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
      imagen: producto.imagenes[0] ?? "/logo.png",
      cantidad: 1,
      stock: producto.stock,
    });
    toast.success(`${producto.nombre} añadido al carrito`);
  };

  const alFavorito = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    alternar(producto.id);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(indice * 0.05, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      <Link
        href={`/producto/${producto.slug}`}
        onClick={(e) => {
          e.preventDefault();
          setInspeccionando(true);
        }}
        className="flex h-full flex-col overflow-hidden rounded-card border border-beige-dark/60 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-tomate/30 hover:shadow-card-hover"
      >
        {/* Imagen */}
        <div className="relative aspect-square overflow-hidden bg-white">
          <ImagenProducto
            src={producto.imagenes[0] ?? "/logo.png"}
            alt={producto.nombre}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
          />

          {/* Insignias */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {descuento > 0 && (
              <span className="rounded-full bg-tomate px-2.5 py-1 text-[11px] font-bold text-crema shadow-sm">
                -{descuento}%
              </span>
            )}
            {producto.destacado && descuento === 0 && (
              <span className="rounded-full bg-marron px-2.5 py-1 text-[11px] font-bold text-crema shadow-sm">
                Destacado
              </span>
            )}
            {agotado && (
              <span className="rounded-full bg-marron/85 px-2.5 py-1 text-[11px] font-bold text-crema shadow-sm">
                Agotado
              </span>
            )}
          </div>

          {/* Favorito */}
          <button
            type="button"
            onClick={alFavorito}
            aria-label={esFavorito ? "Quitar de favoritos" : "Añadir a favoritos"}
            aria-pressed={esFavorito}
            className={cn(
              "absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border border-beige-dark/60 bg-white/90 backdrop-blur transition-all hover:scale-110 sm:h-9 sm:w-9",
              esFavorito ? "text-tomate" : "text-marron/50 hover:text-tomate"
            )}
          >
            <Heart className={cn("h-4 w-4", esFavorito && "fill-tomate")} />
          </button>

          {/* Añadir al carrito */}
          <div className="absolute inset-x-3 bottom-3 translate-y-0 opacity-100 transition-all duration-300 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
            <button
              type="button"
              onClick={alCarrito}
              disabled={agotado}
              className="btn-primary w-full py-2.5 disabled:bg-marron/50"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden />
              {agotado ? "Agotado" : "Añadir"}
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex flex-1 flex-col p-4">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wide text-tomate">
              {producto.pais === "japon" ? "🇯🇵 Japón" : "🇰🇷 Corea"}
            </span>
            {producto.numValoraciones > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-marron/60">
                <Star className="h-3 w-3 fill-naranja text-naranja" aria-hidden />
                {producto.valoracion.toFixed(1)}
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold leading-snug text-marron line-clamp-2 sm:text-[15px]">
            {producto.nombre}
          </h3>

          {producto.nombreOriginal && (
            <p className="texto-jp mt-0.5 text-xs text-marron/50">{producto.nombreOriginal}</p>
          )}

          <div className="mt-auto pt-3">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-lg font-black text-tomate">{formatPEN(producto.precio)}</span>
              {producto.precioAnterior && producto.precioAnterior > producto.precio && (
                <span className="text-xs font-medium text-marron/45 line-through">
                  {formatPEN(producto.precioAnterior)}
                </span>
              )}
            </div>
            {!compacto && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-marron/55">
                {agotado ? (
                  <span className="font-semibold text-tomate">Sin stock</span>
                ) : producto.stock <= producto.stockMinimo ? (
                  <span className="font-semibold text-naranja-dark">
                    Quedan {producto.stock} unidades
                  </span>
                ) : (
                  <>
                    <Check className="h-3 w-3 text-hojita" aria-hidden /> En stock · {producto.stock}{" "}
                    disponibles
                  </>
                )}
              </p>
            )}
          </div>
        </div>
      </Link>

      {/* Overlay de inspección (vista rápida) */}
      <QuickViewProducto
        producto={producto}
        abierto={inspeccionando}
        onCerrar={() => setInspeccionando(false)}
      />
    </motion.article>
  );
}
