import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { getUsuarioActual } from "@/lib/auth";
import { getProvider } from "@/lib/data";
import { ProductCard } from "@/components/tienda/product-card";
import { EstadoVacio } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Mis favoritos — ITADAKIMASU",
  description: "Los productos que guardaste para más tarde.",
};

export default async function PaginaFavoritos() {
  const usuario = await getUsuarioActual();
  if (!usuario) return null;

  const provider = getProvider();
  const ids = await provider.getFavoritos(usuario.id);
  const productos = await provider.getProductosPorIds(ids);

  if (productos.length === 0) {
    return (
      <EstadoVacio
        icono={Heart}
        titulo="No tienes favoritos aún"
        descripcion="Toca el corazón de cualquier producto para guardarlo aquí y encontrarlo cuando quieras."
        accion={{ texto: "Explorar productos", href: "/productos" }}
      />
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-marron/60">
        {productos.length} producto{productos.length === 1 ? "" : "s"} guardado{productos.length === 1 ? "" : "s"}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        {productos.map((p, i) => (
          <ProductCard key={p.id} producto={p} indice={i} />
        ))}
      </div>
    </div>
  );
}
