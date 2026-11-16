import type { MetadataRoute } from "next";
import { getProvider } from "@/lib/data";
import { siteConfig } from "@/lib/config/site";

const ESTATICAS: { ruta: string; prioridad: number }[] = [
  { ruta: "/", prioridad: 1 },
  { ruta: "/productos", prioridad: 0.9 },
  { ruta: "/nosotros", prioridad: 0.5 },
  { ruta: "/preguntas-frecuentes", prioridad: 0.5 },
  { ruta: "/envios-y-devoluciones", prioridad: 0.5 },
  { ruta: "/contacto", prioridad: 0.5 },
  { ruta: "/terminos", prioridad: 0.3 },
  { ruta: "/privacidad", prioridad: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");
  const hoy = new Date();

  const paginas: MetadataRoute.Sitemap = ESTATICAS.map(({ ruta, prioridad }) => ({
    url: `${base}${ruta}`,
    lastModified: hoy,
    changeFrequency: ruta === "/" ? "daily" : "monthly",
    priority: prioridad,
  }));

  // Catálogo: paginamos hasta agotar (el provider limita por página)
  try {
    const provider = getProvider();
    let pagina = 1;
    let paginasTotales = 1;
    const productos: { slug: string; actualizadoEn?: string }[] = [];

    do {
      const r = await provider.listarProductos({ pagina, porPagina: 60 });
      productos.push(
        ...r.items.map((p) => ({ slug: p.slug, actualizadoEn: p.actualizadoEn }))
      );
      paginasTotales = r.paginas;
      pagina += 1;
    } while (pagina <= paginasTotales);

    for (const p of productos) {
      paginas.push({
        url: `${base}/producto/${p.slug}`,
        lastModified: p.actualizadoEn ? new Date(p.actualizadoEn) : hoy,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // Sin catálogo (p. ej. build sin datos): solo las páginas estáticas
  }

  return paginas;
}
