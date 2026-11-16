import type { Metadata } from "next";
import { getProvider } from "@/lib/data";
import { FormProducto } from "@/components/admin/form-producto";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function PaginaNuevoProducto() {
  const provider = getProvider();
  const [categorias, marcas] = await Promise.all([
    provider.getCategorias(),
    provider.getMarcas(),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <p className="texto-jp text-sm text-tomate">新規商品</p>
        <h1 className="mt-1 font-display text-2xl font-black tracking-tight text-marron sm:text-3xl">
          Nuevo producto
        </h1>
        <p className="mt-1 text-sm text-marron/60">
          Completa los datos; el producto se guarda con validación en el servidor.
        </p>
      </div>
      <FormProducto categorias={categorias} marcas={marcas} />
    </div>
  );
}
