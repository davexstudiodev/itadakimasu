import Link from "next/link";
import { Flame, Sparkles, TrendingUp, Gift, Timer } from "lucide-react";
import { getProvider } from "@/lib/data";
import { Hero } from "@/components/tienda/hero";
import { TrustStrip } from "@/components/tienda/trust-strip";
import { SectionHeader } from "@/components/tienda/section-header";
import { CategoryCard } from "@/components/tienda/category-card";
import { ProductGrid } from "@/components/tienda/product-grid";
import { PromoBanner } from "@/components/tienda/promo-banner";
import { CountrySection } from "@/components/tienda/country-section";
import { Newsletter } from "@/components/tienda/newsletter";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const provider = getProvider();
  const [categorias, destacados, vendidos, nuevos, ofertas, coreanos, japoneses, catalogo, cfg, cupones] =
    await Promise.all([
      provider.getCategorias(),
      provider.getProductosDestacados(8),
      provider.getMasVendidos(8),
      provider.getProductosNuevos(4),
      provider.listarProductos({ soloOfertas: true, orden: "vendidos", porPagina: 4 }),
      provider.listarProductos({ pais: "corea", orden: "vendidos", porPagina: 4 }),
      provider.listarProductos({ pais: "japon", orden: "vendidos", porPagina: 4 }),
      provider.listarProductos({ porPagina: 1 }),
      provider.getConfiguracion(),
      provider.getCupones(),
    ]);

  const hoy = new Date().toISOString().slice(0, 10);
  const cuponInicio = cupones.find(
    (cupon) =>
      cupon.id === cfg.cuponInicioId &&
      cupon.activo &&
      (!cupon.fechaInicio || cupon.fechaInicio <= hoy) &&
      (!cupon.fechaFin || cupon.fechaFin >= hoy) &&
      (cupon.usosMaximos == null || cupon.usosActuales < cupon.usosMaximos)
  );

  return (
    <>
      <Hero cantidadProductos={catalogo.total} />
      <TrustStrip />

      {/* Categorias */}
      <section className="contenedor py-10 sm:py-14">
        <SectionHeader
          titulo="Explora por categoria"
          textoJp="カテゴリーから探す"
          subtitulo="Desde el picante buldak hasta el dulce mochi: encuentra tu proximo antojo."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categorias.map((c) => (
            <CategoryCard key={c.slug} categoria={c} />
          ))}
        </div>
      </section>

      {/* Destacados */}
      <section className="contenedor pb-4">
        <SectionHeader
          titulo="Productos destacados"
          textoJp="おすすめ"
          icono={Flame}
          subtitulo="Los favoritos de la casa, elegidos por nuestro equipo."
          hrefVer="/productos?destacados=1"
        />
        <ProductGrid productos={destacados} />
      </section>

      {/* Promocion */}
      <div className="py-10 sm:py-14">
        {cuponInicio ? (
          <PromoBanner
            codigo={cuponInicio.codigo}
            titulo={
              cuponInicio.tipo === "porcentaje"
                ? `${cuponInicio.valor}% de descuento`
                : `S/ ${cuponInicio.valor} de descuento`
            }
            texto={
              [
                cuponInicio.descripcion || "Ingresa el código en el checkout para aplicar el descuento.",
                cuponInicio.compraMinima != null
                  ? `Válido en compras desde S/ ${cuponInicio.compraMinima.toFixed(2)}.`
                  : null,
                cuponInicio.fechaFin ? `Válido hasta ${cuponInicio.fechaFin}.` : null,
              ]
                .filter(Boolean)
                .join(" ")
            }
          />
        ) : (
          <section className="contenedor">
            <div className="rounded-card border border-beige-dark/60 bg-white px-6 py-8 shadow-card sm:px-10 sm:py-10">
              <p className="text-xs font-bold uppercase tracking-wider text-tomate">Para descubrir</p>
              <h2 className="texto-marca mt-2 text-2xl font-black text-marron sm:text-3xl">
                Novedades con sabor a Asia
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-marron/70 sm:text-base">
                Explora ramen, dulces y bebidas de Japón y Corea. Revisa los precios y condiciones de envío antes de confirmar tu compra.
              </p>
              <Link href="/productos" className="btn-primary mt-5 px-6 py-2.5">
                Explorar catálogo
              </Link>
            </div>
          </section>
        )}
      </div>

      {/* Mas vendidos */}
      <section className="contenedor pb-4">
        <SectionHeader
          titulo="Los mas vendidos"
          textoJp="人気ランキング"
          icono={TrendingUp}
          subtitulo="Lo que mas se lleva la comunidad Itadakimasu."
          hrefVer="/productos?orden=vendidos"
        />
        <ProductGrid productos={vendidos} />
      </section>

      {/* Novedades */}
      <section className="contenedor py-10 sm:py-14">
        <SectionHeader
          titulo="Recien llegados"
          textoJp="新着"
          icono={Sparkles}
          subtitulo="Drops nuevos de Tokio y Seul, listos para despachar."
          hrefVer="/productos?nuevos=1"
        />
        <ProductGrid productos={nuevos} />
      </section>

      {/* Ofertas */}
      {ofertas.items.length > 0 && (
        <section className="bg-white/60 py-10 sm:py-14">
          <div className="contenedor">
            <SectionHeader
              titulo="Ofertas y promociones"
              textoJp="セール"
              icono={Timer}
              subtitulo="Precios rebajados por tiempo limitado."
              hrefVer="/productos?ofertas=1"
            />
            <ProductGrid productos={ofertas.items} />
          </div>
        </section>
      )}

      {/* Corea */}
      <section className="py-10 sm:py-14">
        <CountrySection
          pais="corea"
          titulo="Corea del Sur"
          textoJp="대한민국"
          frase="Buldak, ramyun, pepero y el street food de Seul."
          productos={coreanos.items}
        />
      </section>

      {/* Japon */}
      <section className="pb-10 sm:pb-14">
        <CountrySection
          pais="japon"
          titulo="Japon"
          textoJp="日本"
          frase="Ramen, pocky, matcha y ramune directo de Tokio."
          productos={japoneses.items}
        />
      </section>

      {/* Combos destacados */}
      <section className="contenedor pb-10 sm:pb-14">
        <div className="flex flex-col items-center gap-5 rounded-card bg-beige p-6 text-center sm:flex-row sm:justify-between sm:p-8 sm:text-left">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-tomate shadow-card">
              <Gift className="h-7 w-7" aria-hidden />
            </span>
            <div>
              <h2 className="titulo-seccion !text-xl sm:!text-2xl">Combos que ahorran</h2>
              <p className="mt-1 text-sm text-marron/70">
                Packs armados para el fin de semana, con descuento incluido.
              </p>
            </div>
          </div>
          <Link href="/productos?categoria=combos" className="btn-primary px-7 py-3">
            Ver combos
          </Link>
        </div>
      </section>

      {/* Newsletter */}
      <Newsletter />
    </>
  );
}
