"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Pencil, Trash, Eye, EyeOff } from "lucide-react";
import { alternarProducto, eliminarProducto } from "@/server/actions/admin/productos";
import { ConfirmarAccion } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toaster";
import { formatPEN } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Producto } from "@/types";

/* Tabla de gestión de productos (activar/desactivar, editar, borrar). */
export function TablaProductos({ productos }: { productos: Producto[] }) {
  const [pendiente, startTransition] = useTransition();
  const [ocupado, setOcupado] = useState<string | null>(null);

  const alternar = (p: Producto) => {
    setOcupado(p.id);
    startTransition(async () => {
      const r = await alternarProducto(p.id, !p.activo);
      if (r.ok) toast.success(r.datos?.mensaje as string);
      else toast.error(r.error ?? "No se pudo actualizar");
      setOcupado(null);
    });
  };

  const borrar = async (p: Producto) => {
    const r = await eliminarProducto(p.id);
    if (r.ok) toast.success(r.datos?.mensaje as string);
    else toast.error(r.error ?? "No se pudo desactivar");
    return r;
  };

  return (
    <div className="overflow-hidden rounded-card border border-beige-dark/60 bg-white shadow-card">
      {/* Cabecera (oculto en móvil) */}
      <div className="hidden gap-4 border-b border-beige-dark/60 bg-crema/70 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-marron/60 md:grid md:grid-cols-[1fr_110px_90px_90px_180px]">
        <span>Producto</span>
        <span>Precio</span>
        <span>Stock</span>
        <span>Estado</span>
        <span className="text-right">Acciones</span>
      </div>

      <ul className="divide-y divide-beige-dark/60">
        {productos.map((p) => (
          <li
            key={p.id}
            className={cn(
              "grid gap-3 px-4 py-3.5 md:grid-cols-[1fr_110px_90px_90px_180px] md:items-center",
              !p.activo && "bg-beige/30"
            )}
          >
            {/* Producto */}
            <div className="flex min-w-0 items-center gap-3">
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-crema">
                <Image
                  src={p.imagenes[0] ?? "/logo.png"}
                  alt={p.nombre}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </span>
              <span className="min-w-0">
                <Link
                  href={`/producto/${p.slug}`}
                  target="_blank"
                  className="block truncate text-sm font-bold text-marron hover:text-tomate"
                >
                  {p.nombre}
                </Link>
                <span className="block truncate text-xs text-marron/50">
                  /{p.slug} · {p.categoriaSlug} · {p.pais === "japon" ? "Japón" : "Corea"}
                </span>
              </span>
            </div>

            {/* Precio */}
            <div className="text-sm">
              <span className="font-black text-marron">{formatPEN(p.precio)}</span>
              {p.precioAnterior && p.precioAnterior > p.precio && (
                <span className="ml-1.5 text-xs text-marron/40 line-through">
                  {formatPEN(p.precioAnterior)}
                </span>
              )}
            </div>

            {/* Stock */}
            <span
              className={cn(
                "inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-bold",
                p.stock === 0
                  ? "bg-tomate/10 text-tomate"
                  : p.stock <= p.stockMinimo
                    ? "bg-naranja/15 text-naranja-dark"
                    : "bg-hojita/15 text-hojita"
              )}
            >
              {p.stock} u.
            </span>

            {/* Estado */}
            <button
              type="button"
              onClick={() => alternar(p)}
              disabled={pendiente && ocupado === p.id}
              aria-pressed={p.activo}
              aria-label={p.activo ? `Desactivar ${p.nombre}` : `Activar ${p.nombre}`}
              className={cn(
                "inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                p.activo
                  ? "bg-hojita/15 text-hojita hover:bg-hojita/25"
                  : "bg-beige-dark/60 text-marron/60 hover:bg-beige-dark"
              )}
            >
              {p.activo ? (
                <Eye className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <EyeOff className="h-3.5 w-3.5" aria-hidden />
              )}
              {p.activo ? "Activo" : "Oculto"}
            </button>

            {/* Acciones */}
            <div className="flex flex-wrap justify-start gap-2 md:justify-end">
              <Link
                href={`/admin/productos/${p.id}`}
                className="flex items-center gap-1.5 rounded-full border border-beige-dark px-3.5 py-1.5 text-xs font-semibold text-marron transition-colors hover:border-tomate hover:text-tomate"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden /> Editar
              </Link>
              <ConfirmarAccion
                titulo="Desactivar producto"
                descripcion={`«${p.nombre}» dejará de mostrarse en la tienda. Podrás volver a activarlo cuando quieras; los pedidos existentes no se modifican.`}
                textoConfirmar="Desactivar"
                onConfirmar={() => borrar(p)}
              >
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-full border border-tomate/25 px-3.5 py-1.5 text-xs font-semibold text-tomate transition-colors hover:bg-tomate/10"
                >
                  <Trash className="h-3.5 w-3.5" aria-hidden /> Desactivar
                </button>
              </ConfirmarAccion>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
