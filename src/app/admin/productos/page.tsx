import type { Metadata } from "next";
import Link from "next/link";
import { Search, Plus, Package } from "lucide-react";
import { getProvider } from "@/lib/data";
import { TablaProductos } from "@/components/admin/tabla-productos";
import { EstadoVacio } from "@/components/ui/empty-state";
import { Paginacion } from "@/components/ui/pagination";

export const metadata: Metadata = { title: "Productos" };

interface Props {
  searchParams: Promise<{ q?: string; pagina?: string }>;
}

function uno(v: string | string[] | undefined): string | undefined {
  const valor = Array.isArray(v) ? v[0] : v;
  return valor && valor.trim() !== "" ? valor.trim() : undefined;
}

export default async function PaginaProductosAdmin({ searchParams }: Props) {
  const sp = await searchParams;
  const q = uno(sp.q);
  const paginaRaw = Number(uno(sp.pagina) ?? "1");
  const pagina = Number.isFinite(paginaRaw) && paginaRaw >= 1 ? Math.floor(paginaRaw) : 1;

  const resultado = await getProvider().listarProductosAdmin({ q, pagina, porPagina: 15 });

  const url = (pag?: number): string => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (pag && pag > 1) params.set("pagina", String(pag));
    const qs = params.toString();
    return qs ? `/admin/productos?${qs}` : "/admin/productos";
  };

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="texto-jp text-sm text-tomate">商品管理</p>
          <h1 className="mt-1 font-display text-2xl font-black tracking-tight text-marron sm:text-3xl">
            Productos
          </h1>
          <p className="mt-1 text-sm text-marron/60">
            {resultado.total} producto{resultado.total === 1 ? "" : "s"} en el catálogo
          </p>
        </div>
        <Link href="/admin/productos/nuevo" className="btn-primary px-5 py-2.5 text-sm">
          <Plus className="h-4 w-4" aria-hidden /> Nuevo producto
        </Link>
      </div>

      {/* Búsqueda */}
      <form method="get" action="/admin/productos" className="flex max-w-md gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-marron/40"
            aria-hidden
          />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nombre, slug o marca…"
            aria-label="Buscar productos"
            className="campo pl-9"
          />
        </div>
        <button type="submit" className="btn-outline px-5 py-2.5 text-sm">
          Buscar
        </button>
      </form>

      {/* Tabla */}
      {resultado.items.length === 0 ? (
        <EstadoVacio
          icono={Package}
          titulo={q ? "Sin resultados" : "Aún no hay productos"}
          descripcion={
            q
              ? `Ningún producto coincide con «${q}».`
              : "Crea tu primer producto para empezar a vender."
          }
          accion={
            q
              ? { texto: "Ver todos", href: "/admin/productos" }
              : { texto: "Crear producto", href: "/admin/productos/nuevo" }
          }
        />
      ) : (
        <>
          <TablaProductos productos={resultado.items} />
          <Paginacion
            pagina={resultado.pagina}
            paginas={resultado.paginas}
            hrefBuilder={(n) => url(n)}
          />
        </>
      )}
    </div>
  );
}
