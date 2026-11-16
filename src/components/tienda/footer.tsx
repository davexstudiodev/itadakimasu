import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Phone, MapPin, Clock } from "lucide-react";
import { Instagram, Facebook, TikTok } from "@/components/ui/brand-icons";
import { siteConfig } from "@/lib/config/site";

interface Props {
  categorias: { slug: string; nombre: string }[];
}

const enlacesAyuda = [
  { href: "/envios-y-devoluciones", texto: "Envíos y devoluciones" },
  { href: "/preguntas-frecuentes", texto: "Preguntas frecuentes" },
  { href: "/contacto", texto: "Contacto" },
  { href: "/cuenta/pedidos", texto: "Seguir mi pedido" },
];

const enlacesLegal = [
  { href: "/terminos", texto: "Términos y condiciones" },
  { href: "/privacidad", texto: "Política de privacidad" },
  { href: "/nosotros", texto: "Nosotros" },
];

export function Footer({ categorias }: Props) {
  return (
    <footer className="mt-16 border-t border-beige-dark bg-beige/60">
      <div className="contenedor grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {/* Marca */}
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="flex items-center gap-3" aria-label="ITADAKIMASU — Inicio">
            <span className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-tomate/20 bg-white">
              <Image src="/logo.png" alt="" fill sizes="56px" className="object-cover" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="texto-marca text-xl font-black text-marron">Itadakimasu</span>
              <span className="text-xs tracking-[0.2em] text-tomate">いただきます</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-marron/70">
            Snacks, ramen, dulces y bebidas originales de Japón y Corea del Sur.
            <span className="mt-1 block font-semibold text-tomate">{siteConfig.tagline}</span>
          </p>
          <div className="mt-4 flex gap-2">
            {[
              { href: siteConfig.redes.instagram, icono: Instagram, etiqueta: "Instagram" },
              { href: siteConfig.redes.facebook, icono: Facebook, etiqueta: "Facebook" },
              { href: siteConfig.redes.whatsapp, icono: MessageCircle, etiqueta: "WhatsApp" },
              { href: siteConfig.redes.tiktok, icono: TikTok, etiqueta: "TikTok" },
            ].map(({ href, icono: Icono, etiqueta }) => (
              <a
                key={etiqueta}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={etiqueta}
                className="grid h-10 w-10 place-items-center rounded-full border border-beige-dark bg-white text-marron transition-colors hover:border-tomate hover:text-tomate"
              >
                <Icono className="h-4.5 w-4.5" />
              </a>
            ))}
          </div>
        </div>

        {/* Categorías */}
        <nav aria-label="Categorías del pie">
          <h3 className="titulo-seccion !text-base font-bold">Tienda</h3>
          <ul className="mt-4 space-y-2.5">
            {categorias.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/productos?categoria=${c.slug}`}
                  className="text-sm text-marron/70 transition-colors hover:text-tomate"
                >
                  {c.nombre}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/productos?ofertas=1" className="text-sm font-semibold text-tomate">
                Ofertas
              </Link>
            </li>
          </ul>
        </nav>

        {/* Ayuda */}
        <nav aria-label="Ayuda">
          <h3 className="titulo-seccion !text-base font-bold">Ayuda</h3>
          <ul className="mt-4 space-y-2.5">
            {enlacesAyuda.map((e) => (
              <li key={e.href}>
                <Link href={e.href} className="text-sm text-marron/70 transition-colors hover:text-tomate">
                  {e.texto}
                </Link>
              </li>
            ))}
            {enlacesLegal.map((e) => (
              <li key={e.href}>
                <Link href={e.href} className="text-sm text-marron/70 transition-colors hover:text-tomate">
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contacto */}
        <div>
          <h3 className="titulo-seccion !text-base font-bold">Contacto</h3>
          <ul className="mt-4 space-y-3 text-sm text-marron/70">
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-tomate" aria-hidden />
              <a href={`tel:${siteConfig.telefono.replace(/\s/g, "")}`} className="hover:text-tomate">
                {siteConfig.telefono}
              </a>
            </li>
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-tomate" aria-hidden />
              <span>{siteConfig.direccion}</span>
            </li>
            <li className="flex gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-tomate" aria-hidden />
              <span>{siteConfig.horario}</span>
            </li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {["Yape", "Comprobante por WhatsApp"].map((m) => (
              <span
                key={m}
                className="rounded-full border border-beige-dark bg-white px-2.5 py-1 text-[11px] font-semibold text-marron/70"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-beige-dark/70">
        <div className="contenedor flex flex-col items-center justify-between gap-2 py-5 text-center text-xs text-marron/60 sm:flex-row sm:text-left">
          <p>
            © {new Date().getFullYear()} {siteConfig.nombreJp} ITADAKIMASU. Todos los derechos
            reservados.
          </p>
          <p className="texto-jp">
            美味しい時間を、あなたに <span className="mx-1 text-tomate">·</span> 맛있는 시간을
          </p>
        </div>
      </div>
    </footer>
  );
}
