import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { GeneradorAnuncios } from "@/components/admin/generador-anuncios";
import { getProvider } from "@/lib/data";

export const metadata: Metadata = { title: "Generar anuncios" };

export default async function PaginaAnuncios() {
  const { items } = await getProvider().listarProductosAdmin({ porPagina: 60 });
  const productos = items
    .filter((producto) => producto.activo && producto.imagenes.length > 0)
    .map(({ id, slug, nombre, marcaSlug, pais, precio, descripcion, imagenes }) => ({
      id,
      slug,
      nombre,
      marcaSlug,
      pais,
      precio,
      descripcion,
      imagenes,
    }));

  return (
    <div className="space-y-5">
      <div>
        <p className="texto-jp text-sm text-tomate">広告を作る</p>
        <h1 className="mt-1 flex items-center gap-2 font-display text-2xl font-black tracking-tight text-marron sm:text-3xl">
          <Sparkles className="h-6 w-6 text-tomate" aria-hidden="true" />
          Generar anuncios
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-marron/60">
          Crea imágenes promocionales y textos sugeridos con las fotos reales de tus productos.
        </p>
      </div>

      {productos.length ? (
        <GeneradorAnuncios productos={productos} />
      ) : (
        <div className="rounded-card border border-dashed border-beige-dark bg-white p-8 text-center">
          <p className="font-semibold text-marron">No hay productos activos con foto.</p>
          <p className="mt-1 text-sm text-marron/60">Agrega una foto a un producto activo y vuelve aquí.</p>
        </div>
      )}
    </div>
  );
}
