import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone, MessageCircle, MapPin, Clock, HelpCircle, Truck } from "lucide-react";
import { Instagram, Facebook, TikTok } from "@/components/ui/brand-icons";
import { siteConfig } from "@/lib/config/site";
import { DocPage, DocSeccion } from "@/components/tienda/doc-page";

export const metadata: Metadata = {
  title: "Contacto — ITADAKIMASU",
  description: "Escríbenos por WhatsApp, correo o visítanos en Puerto Malabrigo. Respondemos en menos de 24 horas.",
};

export default function PaginaContacto() {
  const tarjetas = [
    {
      titulo: "WhatsApp",
      valor: siteConfig.telefono,
      detalle: "La vía más rápida · respuesta en minutos",
      href: siteConfig.redes.whatsapp,
      externo: true,
      icono: MessageCircle,
    },
    {
      titulo: "Correo",
      valor: siteConfig.email,
      detalle: "Pedidos, boletas y soporte",
      href: `mailto:${siteConfig.email}`,
      externo: false,
      icono: Mail,
    },
    {
      titulo: "Teléfono",
      valor: siteConfig.telefono,
      detalle: "Lunes a sábado, en horario de atención",
      href: `tel:${siteConfig.telefono.replace(/[^0-9+]/g, "")}`,
      externo: false,
      icono: Phone,
    },
  ];

  return (
    <DocPage
      titulo="Contáctanos"
      subtitulo="Estamos para ayudarte con tu pedido, productos o cualquier duda."
      textoJp="お問い合わせ"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {tarjetas.map(({ titulo, valor, detalle, href, externo, icono: Icono }) => (
          <a
            key={titulo}
            href={href}
            {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="group rounded-card border border-beige-dark/60 bg-white p-5 text-center transition-all hover:-translate-y-1 hover:border-tomate/40 hover:shadow-card"
          >
            <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-tomate/10">
              <Icono className="h-5 w-5 text-tomate" aria-hidden />
            </span>
            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-marron/55">{titulo}</p>
            <p className="mt-0.5 break-words text-sm font-black text-marron group-hover:text-tomate">{valor}</p>
            <p className="mt-1 text-[11px] text-marron/55">{detalle}</p>
          </a>
        ))}
      </div>

      <DocSeccion titulo="Visítanos">
        <div className="flex gap-4">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-beige">
            <MapPin className="h-5 w-5 text-marron" aria-hidden />
          </span>
          <div>
            <p className="font-semibold text-marron">{siteConfig.direccion}</p>
            <p className="mt-1 text-marron/70">
              Recojo de pedidos sin costo. Te avisamos por WhatsApp cuando esté listo para recoger.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-beige">
            <Clock className="h-5 w-5 text-marron" aria-hidden />
          </span>
          <div>
            <p className="font-semibold text-marron">{siteConfig.horario}</p>
            <p className="mt-1 text-marron/70">Despachos de lunes a sábado. Domingos y feriados cerrado.</p>
          </div>
        </div>
      </DocSeccion>

      <DocSeccion titulo="Redes sociales">
        <p>Síguenos para enterarte de los nuevos ingresos, promociones y recetas:</p>
        <div className="flex flex-wrap gap-3">
          <a href={siteConfig.redes.instagram} target="_blank" rel="noopener noreferrer" className="btn-outline px-5 py-2.5">
            <Instagram className="h-4 w-4" aria-hidden /> Instagram
          </a>
          <a href={siteConfig.redes.tiktok} target="_blank" rel="noopener noreferrer" className="btn-outline px-5 py-2.5">
            <TikTok className="h-4 w-4" aria-hidden /> TikTok
          </a>
          <a href={siteConfig.redes.facebook} target="_blank" rel="noopener noreferrer" className="btn-outline px-5 py-2.5">
            <Facebook className="h-4 w-4" aria-hidden /> Facebook
          </a>
        </div>
      </DocSeccion>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/preguntas-frecuentes"
          className="group rounded-card border border-beige-dark/60 bg-white p-5 transition-all hover:border-tomate/40"
        >
          <HelpCircle className="h-5 w-5 text-tomate" aria-hidden />
          <p className="mt-2 text-sm font-bold text-marron group-hover:text-tomate">Preguntas frecuentes</p>
          <p className="text-xs text-marron/60">Respuestas rápidas sobre pedidos, pagos y envíos.</p>
        </Link>
        <Link
          href="/envios-y-devoluciones"
          className="group rounded-card border border-beige-dark/60 bg-white p-5 transition-all hover:border-tomate/40"
        >
          <Truck className="h-5 w-5 text-tomate" aria-hidden />
          <p className="mt-2 text-sm font-bold text-marron group-hover:text-tomate">Envíos y devoluciones</p>
          <p className="text-xs text-marron/60">Costos, plazos y política de cambios.</p>
        </Link>
      </div>
    </DocPage>
  );
}
