"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash, Trash2, Eye, EyeOff } from "lucide-react";
import { alternarProducto, eliminarProducto, eliminarProductosDefinitivamente } from "@/server/actions/admin/productos";
import { ConfirmarAccion } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toaster";
import { ImagenProducto } from "@/components/ui/imagen-producto";
import { formatPEN } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Producto } from "@/types";

/* Tabla de gestión de productos (activar/desactivar, editar, borrar). */
export function TablaProductos({ productos }: { productos: Producto[] }) {
  const [pendiente, startTransition] = useTransition();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(() => new Set());
  const seleccionadosVisibles = useMemo(
    () => productos.filter((p) => seleccionados.has(p.id)).map((p) => p.id),
    [productos, seleccionados]
  );
  const idsSeleccionados = useMemo(() => [...seleccionados], [seleccionados]);
  const todosSeleccionados = productos.length > 0 && seleccionadosVisibles.length === productos.length;

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

  const borrarPermanente = async (ids: string[]) => {
    const r = await eliminarProductosDefinitivamente(ids);
    if (r.ok) {
      toast.success(r.datos?.mensaje as string);
      setSeleccionados((actuales) => {
        const nuevos = new Set(actuales);
        ids.forEach((id) => nuevos.delete(id));
        return nuevos;
      });
    }
    return r;
  };

  const alternarSeleccion = (id: string) => {
    setSeleccionados((actuales) => {
      const nuevos = new Set(actuales);
      if (nuevos.has(id)) nuevos.delete(id);
      else nuevos.add(id);
      return nuevos;
    });
  };

  const alternarTodosVisibles = () => {
    setSeleccionados((actuales) => {
      const nuevos = new Set(actuales);
      if (todosSeleccionados) productos.forEach((p) => nuevos.delete(p.id));
      else productos.forEach((p) => nuevos.add(p.id));
      return nuevos;
    });
  };

  return (
    <div className="overflow-hidden rounded-card border border-beige-dark/60 bg-white shadow-card">
      {idsSeleccionados.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-beige-dark/60 bg-tomate/5 px-4 py-3">
          <p className="text-sm font-semibold text-marron">
            {idsSeleccionados.length} producto{idsSeleccionados.length === 1 ? "" : "s"} seleccionado{idsSeleccionados.length === 1 ? "" : "s"} en el catálogo
          </p>
          <ConfirmarAccion
            titulo="Eliminar productos permanentemente"
            descripcion={`Se eliminarán ${idsSeleccionados.length} producto${idsSeleccionados.length === 1 ? "" : "s"} seleccionados, incluso los elegidos en otras páginas. También se borrarán sus reseñas, movimientos de inventario, favoritos y carritos. Los artículos de pedidos anteriores se conservarán como historial.`}
            textoConfirmar="Eliminar permanentemente"
            onConfirmar={() => borrarPermanente(idsSeleccionados)}
          >
            <button type="button" className="flex items-center gap-1.5 rounded-full bg-tomate px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-tomate-dark">
              <Trash2 className="h-3.5 w-3.5" aria-hidden /> Eliminar seleccionados
            </button>
          </ConfirmarAccion>
          <button
            type="button"
            onClick={() => setSeleccionados(new Set())}
            className="text-xs font-semibold text-marron/65 underline underline-offset-2 hover:text-marron"
          >
            Limpiar selección
          </button>
        </div>
      )}
      <label className="flex items-center gap-2 border-b border-beige-dark/60 bg-crema/70 px-4 py-3 text-xs font-bold uppercase tracking-wide text-marron/60 md:hidden">
        <input type="checkbox" checked={todosSeleccionados} onChange={alternarTodosVisibles} aria-label={todosSeleccionados ? "Quitar selección de productos visibles" : "Seleccionar todos los productos visibles"} className="h-4 w-4 accent-tomate" />
        Seleccionar todos los productos de esta página
      </label>
      {/* Cabecera (oculto en móvil) */}
      <div className="hidden gap-4 border-b border-beige-dark/60 bg-crema/70 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-marron/60 md:grid md:grid-cols-[1fr_110px_90px_90px_180px]">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={todosSeleccionados}
            onChange={alternarTodosVisibles}
            aria-label={todosSeleccionados ? "Quitar selección de productos visibles" : "Seleccionar todos los productos visibles"}
            className="h-4 w-4 accent-tomate"
          />
          Producto
        </label>
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
              <input
                type="checkbox"
                checked={seleccionados.has(p.id)}
                onChange={() => alternarSeleccion(p.id)}
                aria-label={`Seleccionar ${p.nombre}`}
                className="h-4 w-4 shrink-0 accent-tomate"
              />
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-crema">
                <ImagenProducto
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
              <ConfirmarAccion
                titulo="Eliminar producto permanentemente"
                descripcion={`Se eliminará «${p.nombre}» de forma permanente. Sus reseñas, movimientos de inventario, favoritos y carritos se borrarán. Los pedidos anteriores conservarán la copia histórica del producto.`}
                textoConfirmar="Eliminar permanentemente"
                onConfirmar={() => borrarPermanente([p.id])}
              >
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-full border border-tomate/25 px-3.5 py-1.5 text-xs font-semibold text-tomate transition-colors hover:bg-tomate/10"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden /> Eliminar
                </button>
              </ConfirmarAccion>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
