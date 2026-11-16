import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MessageSquare } from "lucide-react";
import { getProvider } from "@/lib/data";
import { getUsuarioActual } from "@/lib/auth";
import { DetalleProducto } from "@/components/tienda/detalle-producto";
import { FormResena } from "@/components/tienda/form-resena";
import { ProductCard } from "@/components/tienda/product-card";
import { Estrellas } from "@/components/ui/rating";
import { TextoFormateado, textoSinFormato } from "@/components/ui/texto-formateado";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const producto = await getProvider().getProductoPorSlug(slug);
  if (!producto) return { title: "Producto no encontrado — ITADAKIMASU" };
  return {
    title: `${producto.nombre} — ITADAKIMASU`,
    description: textoSinFormato(producto.descripcion),
    openGraph: {
      title: `${producto.nombre} | ITADAKIMASU`,
      description: textoSinFormato(producto.descripcion),
      images: producto.imagenes[0] ? [{ url: producto.imagenes[0] }] : undefined,
    },
  };
}

export default async function PaginaProducto({ params }: Props) {
  const { slug } = await params;
  const provider = getProvider();
  const producto = await provider.getProductoPorSlug(slug);
  if (!producto || !producto.activo) notFound();

  const [categorias, resenas, relacionados, usuario, cfg] = await Promise.all([
    provider.getCategorias(),
    provider.getResenas(producto.id),
    provider.getProductosRelacionados(slug, 4),
    getUsuarioActual(),
    provider.getConfiguracion(),
  ]);

  const categoria = categorias.find((c) => c.slug === producto.categoriaSlug);
  const promedio =
    resenas.length > 0 ? resenas.reduce((s, r) => s + r.calificacion, 0) / resenas.length : 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: producto.nombre,
    image: producto.imagenes,
    description: textoSinFormato(producto.descripcion),
    brand: { "@type": "Brand", name: producto.marcaSlug },
    sku: producto.id,
    offers: {
      "@type": "Offer",
      priceCurrency: "PEN",
      price: producto.precio,
      availability:
        producto.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(producto.numValoraciones > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: producto.valoracion,
            reviewCount: producto.numValoraciones,
          },
        }
      : {}),
  };

  return (
    <div className="contenedor py-6 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav aria-label="Migas de pan" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-marron/60">
        <Link href="/" className="transition-colors hover:text-tomate">
          Inicio
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <Link href="/productos" className="transition-colors hover:text-tomate">
          Productos
        </Link>
        {categoria && (
          <>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            <Link
              href={`/productos?categoria=${categoria.slug}`}
              className="transition-colors hover:text-tomate"
            >
              {categoria.nombre}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span aria-current="page" className="font-medium text-marron">
          {producto.nombre}
        </span>
      </nav>

      <DetalleProducto producto={producto} envioGratisDesde={cfg.envioGratisDesde} />

      {/* Descripción larga */}
      {(producto.descripcionLarga || producto.ingredientes || producto.preparacion) && (
        <section className="mt-12">
          <h2 className="titulo-seccion">Detalles del producto</h2>
          <div className="mt-4 grid gap-4 rounded-card border border-beige-dark/60 bg-white p-5 sm:grid-cols-2 sm:p-6">
            {producto.descripcionLarga && (
              <div className="sm:col-span-2">
                <h3 className="text-sm font-bold uppercase tracking-wide text-tomate">Descripción</h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-marron/75">
                  <TextoFormateado texto={producto.descripcionLarga} />
                </p>
              </div>
            )}
            {producto.ingredientes && producto.ingredientes.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-tomate">Ingredientes</h3>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-marron/75">
                  {producto.ingredientes.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            )}
            {producto.preparacion && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-tomate">Preparación</h3>
                <p className="mt-2 text-sm leading-relaxed text-marron/75">{producto.preparacion}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Reseñas */}
      <section className="mt-12" id="resenas">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="titulo-seccion">Opiniones</h2>
            <div className="mt-2 flex items-center gap-3">
              {resenas.length > 0 ? (
                <>
                  <span className="text-3xl font-black text-marron">{promedio.toFixed(1)}</span>
                  <div>
                    <Estrellas valor={promedio} tamano="h-5 w-5" />
                    <p className="text-xs text-marron/60">
                      {resenas.length} reseña{resenas.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </>
              ) : (
                <p className="flex items-center gap-2 text-sm text-marron/60">
                  <MessageSquare className="h-4 w-4" aria-hidden />
                  Aún no hay reseñas. ¡Sé el primero en opinar!
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <FormResena
            productoId={producto.id}
            logueado={!!usuario}
            nombreUsuario={usuario?.nombre}
          />

          <ul className="space-y-3">
            {resenas.length === 0 && (
              <li className="rounded-card border border-dashed border-beige-dark bg-white/60 px-5 py-8 text-center text-sm text-marron/60">
                Sé la primera persona en contar su experiencia con este producto.
              </li>
            )}
            {resenas.map((r) => (
              <li key={r.id} className="rounded-card border border-beige-dark/60 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-marron">{r.usuarioNombre}</span>
                  <Estrellas valor={r.calificacion} />
                </div>
                <p className="mt-1.5 text-sm font-semibold text-marron/85">{r.titulo}</p>
                <p className="mt-1 text-sm leading-relaxed text-marron/70">{r.comentario}</p>
                <time className="mt-2 block text-[11px] text-marron/45" dateTime={r.creadaEn}>
                  {new Date(r.creadaEn).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Relacionados */}
      {relacionados.length > 0 && (
        <section className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="titulo-seccion">También te puede gustar</h2>
              <p className="texto-jp mt-1 text-sm text-marron/50">おすすめ</p>
            </div>
            <Link href="/productos" className="btn-ghost shrink-0 px-4 py-2 text-sm">
              Ver todo
            </Link>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relacionados.map((p, i) => (
              <ProductCard key={p.id} producto={p} indice={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
