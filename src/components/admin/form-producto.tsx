"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Save, LoaderCircle, ArrowLeft, Sparkles } from "lucide-react";
import { guardarProducto } from "@/server/actions/admin/productos";
import { toast } from "@/components/ui/toaster";
import type { Categoria, Marca, Producto, ResultadoAccion } from "@/types";
import { cn } from "@/lib/utils/cn";

const ESTADO_INICIAL: ResultadoAccion = { ok: false };

function slugDe(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

interface Props {
  producto?: Producto;
  categorias: Categoria[];
  marcas: Marca[];
}

export function FormProducto({ producto, categorias, marcas }: Props) {
  const [estado, action, pendiente] = useActionState(guardarProducto, ESTADO_INICIAL);
  const router = useRouter();

  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [slug, setSlug] = useState(producto?.slug ?? "");
  const [slugTocado, setSlugTocado] = useState(!!producto);
  const [imagen, setImagen] = useState(producto?.imagenes[0] ?? "");
  const [precioAnterior, setPrecioAnterior] = useState(
    producto?.precioAnterior != null ? String(producto.precioAnterior) : ""
  );

  useEffect(() => {
    if (estado.ok) {
      toast.success((estado.datos?.mensaje as string) ?? "Producto guardado");
      router.push("/admin/productos");
      router.refresh();
    }
  }, [estado, router]);

  const errorDe = (campo: string) => (estado.campo === campo ? estado.error : undefined);
  const listas = (v: string[] | null | undefined) => (v ?? []).join(", ");

  const precioActual = producto?.precio ?? 0;
  const previewPrecio = Number(precioAnterior);
  const enOferta =
    precioAnterior !== "" &&
    Number.isFinite(previewPrecio) &&
    previewPrecio > precioActual;

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {producto && <input type="hidden" name="id" value={producto.id} />}

      <div className="space-y-6">
        {estado.error && !estado.campo && (
          <p className="rounded-xl border border-tomate/20 bg-tomate/10 px-4 py-3 text-sm font-medium text-tomate" role="alert">
            {estado.error}
          </p>
        )}

        {/* Información básica */}
        <section className="rounded-card border border-beige-dark/60 bg-white p-5">
          <h2 className="font-display text-lg font-bold text-marron">Información básica</h2>
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="nombre" className="etiqueta">Nombre *</label>
                <input
                  id="nombre"
                  name="nombre"
                  required
                  maxLength={120}
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    if (!slugTocado) setSlug(slugDe(e.target.value));
                  }}
                  placeholder="Ramen instantáneo Tonkotsu"
                  className={cn("campo", errorDe("nombre") && "campo-error")}
                />
                {errorDe("nombre") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
              </div>
              <div>
                <label htmlFor="nombreOriginal" className="etiqueta">Nombre original (JP/KR)</label>
                <input
                  id="nombreOriginal"
                  name="nombreOriginal"
                  maxLength={60}
                  defaultValue={producto?.nombreOriginal ?? ""}
                  placeholder="豚骨ラーメン"
                  className="campo texto-jp"
                />
              </div>
            </div>

            <div>
              <label htmlFor="slug" className="etiqueta">Slug (URL) *</label>
              <div className="flex gap-2">
                <input
                  id="slug"
                  name="slug"
                  required
                  maxLength={120}
                  value={slug}
                  onChange={(e) => {
                    setSlugTocado(true);
                    setSlug(e.target.value.toLowerCase());
                  }}
                  placeholder="ramen-instantaneo-tonkotsu"
                  className={cn("campo", errorDe("slug") && "campo-error")}
                />
                <button
                  type="button"
                  onClick={() => {
                    setSlug(slugDe(nombre));
                    setSlugTocado(true);
                  }}
                  className="btn-outline shrink-0 px-4 py-2 text-xs"
                  title="Generar desde el nombre"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden /> Generar
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-marron/50">
                URL pública: /producto/{slug || "…"}
              </p>
              {errorDe("slug") && <p className="mt-1 text-xs font-medium text-tomate">{estado.error}</p>}
            </div>

            <div>
              <label htmlFor="descripcion" className="etiqueta">Descripción corta *</label>
              <textarea
                id="descripcion"
                name="descripcion"
                rows={2}
                required
                maxLength={400}
                defaultValue={producto?.descripcion ?? ""}
                placeholder="Una frase que aparece en las tarjetas del catálogo."
                className={cn("campo min-h-16 resize-y", errorDe("descripcion") && "campo-error")}
              />
              {errorDe("descripcion") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
            </div>

            <div>
              <label htmlFor="descripcionLarga" className="etiqueta">Descripción larga</label>
              <textarea
                id="descripcionLarga"
                name="descripcionLarga"
                rows={4}
                maxLength={2000}
                defaultValue={producto?.descripcionLarga ?? ""}
                placeholder="Historia del producto, cómo se come, maridajes…"
                className="campo min-h-28 resize-y"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="categoriaSlug" className="etiqueta">Categoría *</label>
                <select
                  id="categoriaSlug"
                  name="categoriaSlug"
                  required
                  defaultValue={producto?.categoriaSlug ?? ""}
                  className={cn("campo appearance-none", errorDe("categoriaSlug") && "campo-error")}
                >
                  <option value="">Selecciona…</option>
                  {categorias.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="marcaSlug" className="etiqueta">Marca *</label>
                <select
                  id="marcaSlug"
                  name="marcaSlug"
                  required
                  defaultValue={producto?.marcaSlug ?? ""}
                  className={cn("campo appearance-none", errorDe("marcaSlug") && "campo-error")}
                >
                  <option value="">Selecciona…</option>
                  {marcas.map((m) => (
                    <option key={m.slug} value={m.slug}>{m.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="pais" className="etiqueta">País *</label>
                <select
                  id="pais"
                  name="pais"
                  required
                  defaultValue={producto?.pais ?? "japon"}
                  className={cn("campo appearance-none", errorDe("pais") && "campo-error")}
                >
                  <option value="japon">Japón</option>
                  <option value="corea">Corea</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Detalles */}
        <section className="rounded-card border border-beige-dark/60 bg-white p-5">
          <h2 className="font-display text-lg font-bold text-marron">Detalles del producto</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="ingredientes" className="etiqueta">Ingredientes (separados por coma)</label>
              <input
                id="ingredientes"
                name="ingredientes"
                maxLength={1000}
                defaultValue={listas(producto?.ingredientes)}
                placeholder="harina de trigo, aceite de palma, sal…"
                className="campo"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="alergenos" className="etiqueta">Alérgenos (separados por coma)</label>
              <input
                id="alergenos"
                name="alergenos"
                maxLength={300}
                defaultValue={listas(producto?.alergenos)}
                placeholder="soya, trigo, mariscos…"
                className="campo"
              />
            </div>
            <div>
              <label htmlFor="peso" className="etiqueta">Peso / volumen</label>
              <input
                id="peso"
                name="peso"
                maxLength={30}
                defaultValue={producto?.peso ?? ""}
                placeholder="100 g"
                className="campo"
              />
            </div>
            <div>
              <label htmlFor="preparacion" className="etiqueta">Preparación</label>
              <input
                id="preparacion"
                name="preparacion"
                maxLength={400}
                defaultValue={producto?.preparacion ?? ""}
                placeholder="Hervir 3 min y servir caliente"
                className="campo"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="etiquetas" className="etiqueta">Etiquetas (separadas por coma)</label>
              <input
                id="etiquetas"
                name="etiquetas"
                maxLength={200}
                defaultValue={listas(producto?.etiquetas)}
                placeholder="picante, vegetariano, nuevo"
                className="campo"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Columna lateral */}
      <aside className="space-y-6">
        {/* Publicación */}
        <section className="rounded-card border border-beige-dark/60 bg-white p-5">
          <h2 className="font-display text-lg font-bold text-marron">Publicación</h2>
          <div className="mt-4 space-y-3 text-sm text-marron/80">
            <label className="flex items-center gap-2.5">
              <input
                type="checkbox"
                name="activo"
                defaultChecked={producto?.activo ?? true}
                className="h-4 w-4 accent-[#D94B38]"
              />
              Visible en la tienda
            </label>
            <label className="flex items-center gap-2.5">
              <input
                type="checkbox"
                name="destacado"
                defaultChecked={producto?.destacado ?? false}
                className="h-4 w-4 accent-[#D94B38]"
              />
              Destacado en el inicio
            </label>
          </div>
        </section>

        {/* Precio y stock */}
        <section className="rounded-card border border-beige-dark/60 bg-white p-5">
          <h2 className="font-display text-lg font-bold text-marron">Precio y stock</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="precio" className="etiqueta">Precio (S/) *</label>
              <input
                id="precio"
                name="precio"
                type="number"
                min={0.5}
                max={9999}
                step="0.01"
                required
                defaultValue={producto?.precio ?? ""}
                placeholder="19.90"
                className={cn("campo", errorDe("precio") && "campo-error")}
              />
              {errorDe("precio") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
            </div>
            <div>
              <label htmlFor="precioAnterior" className="etiqueta">Precio anterior (oferta)</label>
              <input
                id="precioAnterior"
                name="precioAnterior"
                type="number"
                min={0}
                max={9999}
                step="0.01"
                value={precioAnterior}
                onChange={(e) => setPrecioAnterior(e.target.value)}
                placeholder="Vacío = sin oferta"
                className={cn("campo", errorDe("precioAnterior") && "campo-error")}
              />
              <p className="mt-1.5 text-[11px] text-marron/50">
                {enOferta ? "Se mostrará como oferta con descuento." : "Vacío si no hay oferta."}
              </p>
              {errorDe("precioAnterior") && <p className="mt-1 text-xs font-medium text-tomate">{estado.error}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="stock" className="etiqueta">Stock *</label>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min={0}
                  max={99999}
                  required
                  defaultValue={producto?.stock ?? 0}
                  className={cn("campo", errorDe("stock") && "campo-error")}
                />
              </div>
              <div>
                <label htmlFor="stockMinimo" className="etiqueta">Stock mínimo</label>
                <input
                  id="stockMinimo"
                  name="stockMinimo"
                  type="number"
                  min={0}
                  max={9999}
                  defaultValue={producto?.stockMinimo ?? 5}
                  className="campo"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Imagen */}
        <section className="rounded-card border border-beige-dark/60 bg-white p-5">
          <h2 className="font-display text-lg font-bold text-marron">Imagen</h2>
          <div className="mt-4">
            <span className="relative mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border border-beige-dark/60 bg-crema">
              <Image
                src={imagen || "/logo.png"}
                alt="Vista previa"
                fill
                sizes="128px"
                className="object-contain p-2"
              />
            </span>
            <input
              id="imagen"
              name="imagen"
              maxLength={300}
              value={imagen}
              onChange={(e) => setImagen(e.target.value)}
              placeholder="/productos/ramen-tonkotsu.svg"
              className="campo mt-3 text-xs"
            />
            <p className="mt-1.5 text-[11px] text-marron/50">
              Ruta pública (p. ej. /productos/xxx.svg). Vacío usa el logo.
            </p>
          </div>
        </section>

        {/* Acciones */}
        <div className="flex flex-col gap-2">
          <button type="submit" disabled={pendiente} className="btn-primary w-full py-3">
            {pendiente ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Save className="h-4 w-4" aria-hidden />
            )}
            {pendiente ? "Guardando…" : producto ? "Guardar cambios" : "Crear producto"}
          </button>
          <Link href="/admin/productos" className="btn-outline w-full py-3 text-center">
            <ArrowLeft className="mr-1 inline h-4 w-4" aria-hidden /> Volver
          </Link>
        </div>
      </aside>
    </form>
  );
}
