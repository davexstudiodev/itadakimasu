import type { Metadata } from "next";
import Link from "next/link";
import { Search, SlidersHorizontal, Tag, X, ChevronRight, Sparkles, Flame, Clock } from "lucide-react";
import { getProvider } from "@/lib/data";
import { ProductCard } from "@/components/tienda/product-card";
import { EstadoVacio } from "@/components/ui/empty-state";
import { Paginacion } from "@/components/ui/pagination";
import { cn } from "@/lib/utils/cn";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const ORDENES = [
  { id: "vendidos", texto: "Más vendidos" },
  { id: "recientes", texto: "Más recientes" },
  { id: "precio_asc", texto: "Precio ↑" },
  { id: "precio_desc", texto: "Precio ↓" },
  { id: "valorados", texto: "Mejor valorados" },
] as const;

type OrdenId = (typeof ORDENES)[number]["id"];
const VALORES_ORDEN: readonly string[] = ORDENES.map((o) => o.id);

function esOrden(v: string | undefined): v is OrdenId {
  return !!v && VALORES_ORDEN.includes(v);
}

function uno(v: string | string[] | undefined): string | undefined {
  const valor = Array.isArray(v) ? v[0] : v;
  return valor && valor.trim() !== "" ? valor : undefined;
}

export const metadata: Metadata = {
  title: "Productos — ITADAKIMASU",
  description: "Ramen, snacks, dulces y bebidas japonesas y coreanas con delivery en Puerto Malabrigo.",
};

export default async function PaginaProductos({ searchParams }: Props) {
  const sp = await searchParams;

  const q = uno(sp.q);
  const categoria = uno(sp.categoria);
  const pais = uno(sp.pais) === "corea" ? "corea" : uno(sp.pais) === "japon" ? "japon" : undefined;
  const marca = uno(sp.marca);
  const ofertas = uno(sp.ofertas) === "1";
  const nuevos = uno(sp.nuevos) === "1";
  const destacados = uno(sp.destacados) === "1";
  const ordenRaw = uno(sp.orden);
  const orden: OrdenId = esOrden(ordenRaw) ? ordenRaw : "vendidos";
  const minRaw = uno(sp.min);
  const maxRaw = uno(sp.max);
  const minPrecio = minRaw && !Number.isNaN(Number(minRaw)) && Number(minRaw) >= 0 ? Number(minRaw) : undefined;
  const maxPrecio = maxRaw && !Number.isNaN(Number(maxRaw)) && Number(maxRaw) >= 0 ? Number(maxRaw) : undefined;
  const paginaRaw = Number(uno(sp.pagina) ?? "1");
  const pagina = Number.isFinite(paginaRaw) && paginaRaw >= 1 ? Math.floor(paginaRaw) : 1;

  const provider = getProvider();
  const [categorias, marcas, resultado] = await Promise.all([
    provider.getCategorias(),
    provider.getMarcas(),
    provider.listarProductos({
      q,
      categoria,
      pais,
      marca,
      soloOfertas: ofertas,
      soloNuevos: nuevos,
      soloDestacados: destacados,
      minPrecio,
      maxPrecio,
      orden,
      pagina,
      porPagina: 12,
    }),
  ]);

  /* Construcción de URLs preservando los filtros activos */
  const base: Record<string, string> = {
    q: q ?? "",
    categoria: categoria ?? "",
    pais: pais ?? "",
    marca: marca ?? "",
    ofertas: ofertas ? "1" : "",
    nuevos: nuevos ? "1" : "",
    destacados: destacados ? "1" : "",
    orden: orden === "vendidos" ? "" : orden,
    min: minPrecio != null ? String(minPrecio) : "",
    max: maxPrecio != null ? String(maxPrecio) : "",
  };

  const url = (pag?: number, cambios?: Record<string, string>): string => {
    const params = new URLSearchParams({ ...base, ...cambios });
    if (pag && pag > 1) params.set("pagina", String(pag));
    const qs = params.toString();
    return qs ? `/productos?${qs}` : "/productos";
  };

  const hayFiltros =
    !!(q || categoria || pais || marca || ofertas || nuevos || destacados || minPrecio != null || maxPrecio != null);

  const categoriaActiva = categorias.find((c) => c.slug === categoria);
  const titulo = q
    ? `Resultados para «${q}»`
    : categoriaActiva
      ? categoriaActiva.nombre
      : ofertas
        ? "Ofertas y promociones"
        : nuevos
          ? "Recién llegados"
          : destacados
            ? "Destacados"
            : pais === "japon"
              ? "Productos de Japón"
              : pais === "corea"
                ? "Productos de Corea"
                : "Todos los productos";

  const filtros = (
    <div className="space-y-6">
      {/* Categorías */}
      <fieldset>
        <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-tomate">Categorías</legend>
        <ul className="space-y-1">
          <li>
            <Link
              href={url(undefined, { categoria: "" })}
              className={cn(
                "block rounded-lg px-3 py-2 text-sm transition-colors",
                !categoria ? "bg-tomate/10 font-bold text-tomate" : "text-marron/75 hover:bg-beige"
              )}
            >
              Todas
            </Link>
          </li>
          {categorias.map((c) => (
            <li key={c.slug}>
              <Link
                href={url(undefined, { categoria: c.slug })}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm transition-colors",
                  categoria === c.slug ? "bg-tomate/10 font-bold text-tomate" : "text-marron/75 hover:bg-beige"
                )}
              >
                {c.nombre}
              </Link>
            </li>
          ))}
        </ul>
      </fieldset>

      {/* País */}
      <fieldset>
        <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-tomate">País</legend>
        <div className="flex flex-wrap gap-2">
          {[
            { valor: "", texto: "Todos" },
            { valor: "japon", texto: "Japón" },
            { valor: "corea", texto: "Corea" },
          ].map((p) => (
            <Link
              key={p.valor}
              href={url(undefined, { pais: p.valor })}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                (pais ?? "") === p.valor
                  ? "border-tomate bg-tomate text-crema"
                  : "border-beige-dark bg-white text-marron hover:border-tomate hover:text-tomate"
              )}
            >
              {p.texto}
            </Link>
          ))}
        </div>
      </fieldset>

      {/* Etiquetas rápidas */}
      <fieldset>
        <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-tomate">Filtrar por</legend>
        <ul className="space-y-1">
          {[
            { valor: "ofertas", texto: "Solo ofertas", icono: Tag, activo: ofertas },
            { valor: "nuevos", texto: "Recién llegados", icono: Sparkles, activo: nuevos },
            { valor: "destacados", texto: "Destacados", icono: Flame, activo: destacados },
          ].map(({ valor, texto, icono: Icono, activo }) => (
            <li key={valor}>
              <Link
                href={url(undefined, { [valor]: activo ? "" : "1" })}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  activo ? "bg-tomate/10 font-bold text-tomate" : "text-marron/75 hover:bg-beige"
                )}
              >
                <Icono className="h-4 w-4" aria-hidden />
                {texto}
                {activo && <X className="ml-auto h-3.5 w-3.5" aria-hidden />}
              </Link>
            </li>
          ))}
        </ul>
      </fieldset>

      {/* Marcas */}
      <fieldset>
        <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-tomate">Marcas</legend>
        <ul className="flex flex-wrap gap-1.5">
          <li>
            <Link
              href={url(undefined, { marca: "" })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition-colors",
                !marca ? "border-tomate bg-tomate text-crema" : "border-beige-dark bg-white text-marron hover:border-tomate"
              )}
            >
              Todas
            </Link>
          </li>
          {marcas.map((m) => (
            <li key={m.slug}>
              <Link
                href={url(undefined, { marca: m.slug })}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition-colors",
                  marca === m.slug ? "border-tomate bg-tomate text-crema" : "border-beige-dark bg-white text-marron hover:border-tomate"
                )}
              >
                {m.nombre}
              </Link>
            </li>
          ))}
        </ul>
      </fieldset>

      {/* Precio */}
      <fieldset>
        <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-tomate">Precio (S/)</legend>
        <form
          method="get"
          action="/productos"
          className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:flex"
        >
          {Object.entries(base)
            .filter(([k]) => k !== "min" && k !== "max")
            .map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
          <input
            type="number"
            name="min"
            min={0}
            defaultValue={minPrecio ?? ""}
            placeholder="Mín."
            aria-label="Precio mínimo"
            className="campo min-w-0 px-3 py-2 text-base sm:text-sm"
          />
          <span className="text-marron/40" aria-hidden>–</span>
          <input
            type="number"
            name="max"
            min={0}
            defaultValue={maxPrecio ?? ""}
            placeholder="Máx."
            aria-label="Precio máximo"
            className="campo min-w-0 px-3 py-2 text-base sm:text-sm"
          />
          <button type="submit" className="btn-outline col-span-3 w-full px-4 py-2 text-xs sm:w-auto">
            Ir
          </button>
        </form>
      </fieldset>

      {hayFiltros && (
        <Link href="/productos" className="btn-ghost block w-full px-4 py-2.5 text-center text-sm">
          <X className="mr-1 inline h-3.5 w-3.5" aria-hidden />
          Limpiar filtros
        </Link>
      )}
    </div>
  );

  return (
    <div className="contenedor py-6 sm:py-10">
      {/* Breadcrumb */}
      <nav aria-label="Migas de pan" className="mb-5 flex flex-wrap items-center gap-1.5 text-sm text-marron/60">
        <Link href="/" className="transition-colors hover:text-tomate">Inicio</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <Link href="/productos" className="transition-colors hover:text-tomate">Productos</Link>
        {categoriaActiva && (
          <>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            <span aria-current="page" className="font-medium text-marron">{categoriaActiva.nombre}</span>
          </>
        )}
        {q && (
          <>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            <span aria-current="page" className="font-medium text-marron">«{q}»</span>
          </>
        )}
      </nav>

      {/* Cabecera */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="texto-jp text-sm text-tomate">商品一覧</p>
          <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-marron sm:text-4xl">
            {titulo}
          </h1>
          <p className="mt-1 text-sm text-marron/60">
            {resultado.total} producto{resultado.total === 1 ? "" : "s"}
          </p>
        </div>

        {/* Orden (chips) */}
        <div className="flex flex-wrap gap-2">
          {ORDENES.map((o) => (
            <Link
              key={o.id}
              href={url(undefined, { orden: o.id })}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                orden === o.id
                  ? "border-tomate bg-tomate text-crema shadow-[0_8px_18px_-10px_rgba(217,75,56,0.9)]"
                  : "border-beige-dark bg-white text-marron hover:border-tomate hover:text-tomate"
              )}
            >
              {o.texto}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[250px_1fr]">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-card border border-beige-dark/60 bg-white p-4">
            <p className="mb-4 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-marron">
              <SlidersHorizontal className="h-4 w-4 text-tomate" aria-hidden />
              Filtros
            </p>
            {filtros}
          </div>
        </aside>

        {/* Panel móvil */}
        <details className="group rounded-card border border-beige-dark/60 bg-white lg:hidden">
          <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-bold text-marron marker:hidden">
            <SlidersHorizontal className="h-4 w-4 text-tomate" aria-hidden />
            Filtros y categorías
            <span className="ml-auto text-xs font-medium text-tomate">Ver</span>
          </summary>
          <div className="border-t border-beige-dark/60 px-4 py-4">{filtros}</div>
        </details>

        {/* Resultados */}
        <div>
          {resultado.items.length === 0 ? (
            <EstadoVacio
              icono={Search}
              titulo="No encontramos nada"
              descripcion={
                q
                  ? `No hay productos que coincidan con «${q}». Prueba con otra búsqueda.`
                  : "Prueba a quitar algún filtro para ver más resultados."
              }
              accion={{ texto: "Ver todos los productos", href: "/productos" }}
            />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {resultado.items.map((p, i) => (
                  <ProductCard key={p.id} producto={p} indice={i} />
                ))}
              </div>
              <Paginacion
                pagina={resultado.pagina}
                paginas={resultado.paginas}
                hrefBuilder={(n) => url(n)}
                className="mt-8"
              />
            </>
          )}
        </div>
      </div>

      {/* Nota de envío gratis */}
      <p className="mt-10 flex items-center justify-center gap-2 rounded-card border border-dashed border-beige-dark bg-crema/60 px-4 py-4 text-center text-xs font-medium text-marron/70">
        <Clock className="h-4 w-4 text-tomate" aria-hidden />
        Despachamos de lunes a sábado · Puerto Malabrigo en 24–48 h · Envío gratis
      </p>
    </div>
  );
}
