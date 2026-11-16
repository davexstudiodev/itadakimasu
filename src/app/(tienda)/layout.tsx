import type { ReactNode } from "react";
import { getProvider } from "@/lib/data";
import { getUsuarioActual } from "@/lib/auth";
import { Navbar } from "@/components/tienda/navbar";
import { Footer } from "@/components/tienda/footer";
import { SincronizadorCarrito } from "@/components/tienda/sincronizador-carrito";

export default async function LayoutTienda({ children }: { children: ReactNode }) {
  const provider = getProvider();
  const [usuario, categorias, config] = await Promise.all([
    getUsuarioActual(),
    provider.getCategorias(),
    provider.getConfiguracion(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SincronizadorCarrito usuarioId={usuario?.id ?? null} />
      <Navbar
        usuario={usuario ? { nombre: usuario.nombre, rol: usuario.rol } : null}
        categorias={categorias.map((c) => ({ slug: c.slug, nombre: c.nombre }))}
        mensaje={config.mensajeBoasvindas}
      />
      <main className="flex-1">{children}</main>
      <Footer categorias={categorias.map((c) => ({ slug: c.slug, nombre: c.nombre }))} />
    </div>
  );
}
