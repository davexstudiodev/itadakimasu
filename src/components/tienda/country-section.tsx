import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Producto } from "@/types";
import { ProductGrid } from "./product-grid";

interface Props {
  pais: "japon" | "corea";
  titulo: string;
  frase: string;
  textoJp: string;
  productos: Producto[];
}

const banderas = { japon: "🇯🇵", corea: "🇰🇷" };
const fondos = {
  japon: "from-naranja/25 to-crema",
  corea: "from-tomate/20 to-crema",
};

export function CountrySection({ pais, titulo, frase, textoJp, productos }: Props) {
  if (productos.length === 0) return null;
  return (
    <section className="contenedor">
      <div className={`mb-5 rounded-card bg-gradient-to-r ${fondos[pais]} p-5 sm:mb-7 sm:p-7`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-3xl shadow-card">
              <span aria-hidden>{banderas[pais]}</span>
            </span>
            <div>
              <p className="texto-jp text-xs font-bold tracking-wider text-tomate">{textoJp}</p>
              <h2 className="titulo-seccion">{titulo}</h2>
              <p className="mt-1 text-sm text-marron/70">{frase}</p>
            </div>
          </div>
          <Link
            href={`/productos?pais=${pais}`}
            className="group inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-marron shadow-card transition-colors hover:text-tomate"
          >
            Ver todo de {pais === "japon" ? "Japón" : "Corea"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </div>
      <ProductGrid productos={productos} />
    </section>
  );
}
