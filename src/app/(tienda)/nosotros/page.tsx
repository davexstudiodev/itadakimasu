import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, UtensilsCrossed, PackageCheck, Heart, ArrowRight } from "lucide-react";
import { DocPage, DocSeccion, DocLista } from "@/components/tienda/doc-page";

export const metadata: Metadata = {
  title: "Nosotros — ITADAKIMASU",
  description: "La historia de ITADAKIMASU: traemos el auténtico sabor de Japón y Corea a Perú.",
};

export default function PaginaNosotros() {
  const valores = [
    {
      icono: PackageCheck,
      titulo: "Importación directa",
      texto: "Trabajamos con distribuidores oficiales: cada paquete llega con sello original y fecha de caducidad verificada.",
    },
    {
      icono: UtensilsCrossed,
      titulo: "Curaduría real",
      texto: "Probamos antes de vender. Solo entra al catálogo lo que nos comeríamos en casa dos veces.",
    },
    {
      icono: Heart,
      titulo: "Comunidad",
      texto: "Más de 20 mil antojos satisfechos, recetas en redes y un equipo que responde por WhatsApp como amigo.",
    },
  ];

  return (
    <DocPage
      titulo="La historia de ITADAKIMASU"
      subtitulo="Traemos el auténtico sabor de Japón y Corea a la mesa peruana."
      textoJp="私たちについて"
    >
      <DocSeccion titulo="De Tokio y Seul, a tu mesa en Puerto Malabrigo">
        <p>
          ITADAKIMASU nació de una obsesión simple: <strong>un buen ramen a cualquier hora</strong>. Después de probar
          empaques en tiendas de Tokio y mercados de Seul, supimos que Perú merecía esos mismos sabores — sin escalas,
          sin precios abusivos y con el cariño de quien también es antojo.
        </p>
        <p>
          <strong>いただきます</strong> (<em>itadakimasu</em>) es la gratitud que decimos antes de comer. Para nosotros
          también es la promesa de quien prepara el plato: elegir bien, cuidar el producto y servirlo como si fuera para
          nosotros mismos.
        </p>
        <p>
          Hoy importamos <strong>ramen instantáneo, snacks, dulces, bebidas y combos</strong> de Japón y Corea, con
          delivery en Puerto Malabrigo y alrededores, y recojo en nuestro local.
        </p>
      </DocSeccion>

      <DocSeccion titulo="Qué nos mueve">
        <ul className="grid gap-4 sm:grid-cols-3">
          {valores.map(({ icono: Icono, titulo, texto }) => (
            <li key={titulo} className="rounded-xl border border-beige-dark/60 bg-crema/50 p-4">
              <Icono className="h-5 w-5 text-tomate" aria-hidden />
              <p className="mt-2 text-sm font-bold text-marron">{titulo}</p>
              <p className="mt-1 text-xs leading-relaxed text-marron/70">{texto}</p>
            </li>
          ))}
        </ul>
      </DocSeccion>

      <DocSeccion titulo="Cómo elegimos los productos">
        <DocLista
          items={[
            <>Solo <strong>importación oficial</strong>: nada de imitaciones ni reenvases.</>,
            <>Revisamos <strong>fechas de caducidad</strong> antes de cada ingreso; nada sale con menos de 4 meses.</>,
            <>Probamos cada sabor: si no nos convence, no llega al catálogo.</>,
            <>Publicamos <strong>ingredientes y alérgenos</strong> en cada ficha de producto.</>,
          ]}
        />
      </DocSeccion>

      <DocSeccion titulo="Nuestro compromiso">
        <p>
          Precios claros en soles con IGV incluido, pago fácil con Yape desde tu celular y
          soporte humano antes y después de tu compra. Si algo no sale bien, lo hacemos bien: revisa nuestra{" "}
          <Link href="/envios-y-devoluciones" className="font-semibold text-tomate underline">
            política de envíos y devoluciones
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link href="/productos" className="btn-primary px-6 py-3">
            Ver productos <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link href="/contacto" className="btn-outline px-6 py-3">
            <Sparkles className="h-4 w-4" aria-hidden /> Escríbenos
          </Link>
        </div>
      </DocSeccion>
    </DocPage>
  );
}
