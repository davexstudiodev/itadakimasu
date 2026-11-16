import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProvider } from "@/lib/data";
import { FormProducto } from "@/components/admin/form-producto";

export const metadata: Metadata = { title: "Editar producto" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PaginaEditarProducto({ params }: Props) {
  const { id } = await params;
  const provider = getProvider();
  const [producto, categorias, marcas] = await Promise.all([
    provider.getProductoPorId(id),
    provider.getCategorias(),
    provider.getMarcas(),
  ]);
  if (!producto) notFound();

  return (
    <div className="space-y-5">
      <div>
        <p className="texto-jp text-sm text-tomate">商品編集</p>
        <h1 className="mt-1 font-display text-2xl font-black tracking-tight text-marron sm:text-3xl">
          Editar producto
        </h1>
        <p className="mt-1 truncate text-sm text-marron/60">{producto.nombre}</p>
      </div>
      <FormProducto producto={producto} categorias={categorias} marcas={marcas} />
    </div>
  );
}
