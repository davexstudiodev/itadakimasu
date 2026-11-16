import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, MessageCircle, Mail } from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { DocPage } from "@/components/tienda/doc-page";

export const metadata: Metadata = {
  title: "Preguntas frecuentes — ITADAKIMASU",
  description: "Resolvemos tus dudas sobre pedidos, envíos, pagos, cuentas y productos.",
};

interface Pregunta {
  q: string;
  a: ReactNode;
}

const GRUPOS: { titulo: string; textoJp: string; preguntas: Pregunta[] }[] = [
  {
    titulo: "Pedidos y seguimiento",
    textoJp: "注文",
    preguntas: [
      {
        q: "¿Cómo sé el estado de mi pedido?",
        a: (
          <>
            Inicia sesión y entra a <Link href="/cuenta/pedidos" className="font-semibold text-tomate underline">Mis pedidos</Link>.
            Allí verás cada paso: pago por verificar, pago confirmado, preparación, envío y entrega. También te avisamos por
            WhatsApp.
          </>
        ),
      },
      {
        q: "¿Puedo modificar o cancelar mi pedido?",
        a: (
          <>
            Si aún no fue despachado, sí. Escríbenos por{" "}
            <a href={siteConfig.redes.whatsapp} target="_blank" rel="noopener noreferrer" className="font-semibold text-tomate underline">
              WhatsApp
            </a>{" "}
            con tu número de pedido y te ayudamos.
          </>
        ),
      },
      {
        q: "¿Emiten boleta de venta?",
        a: <>Sí. Emitimos boleta de venta con tu RUC o DNI al correo registrado en tu cuenta. Solo indícanoslo al confirmar.</>,
      },
    ],
  },
  {
    titulo: "Envíos",
    textoJp: "配送",
    preguntas: [
      {
        q: "¿Cuánto demora mi pedido?",
        a: (
          <>
            En Puerto Malabrigo entre <strong>24 y 48 horas</strong>; en zonas alrededor, hasta{" "}
            <strong>3 días hábiles</strong>.{" "}
            <Link href="/envios-y-devoluciones" className="font-semibold text-tomate underline">Ver costos y plazos</Link>.
          </>
        ),
      },
      {
        q: "¿Hay envío gratis?",
        a: (
          <>
            Sí, siempre es gratis: entregamos en todo Puerto Malabrigo sin costo. También puedes recoger gratis en
            nuestra tienda de Puerto Malabrigo.
          </>
        ),
      },
      {
        q: "¿Llevan a mi zona?",
        a: (
          <>
            Hacemos delivery en <strong>Puerto Malabrigo y alrededores</strong>. Si tu zona no aparece en el checkout,{" "}
            <Link href="/contacto" className="font-semibold text-tomate underline">contáctanos</Link> y lo vemos.
          </>
        ),
      },
    ],
  },
  {
    titulo: "Pagos",
    textoJp: "支払い",
    preguntas: [
      {
        q: "¿Qué medios de pago aceptan?",
        a: (
          <>
            Aceptamos <strong>Yape</strong> como único medio de pago: escaneas el QR del checkout, transfieres el monto
            exacto y nos envías el comprobante por WhatsApp para confirmar tu pedido.
          </>
        ),
      },
      {
        q: "Hice la transferencia, ¿y ahora qué?",
        a: (
          <>
            Envía tu comprobante por{" "}
            <a href={siteConfig.redes.whatsapp} target="_blank" rel="noopener noreferrer" className="font-semibold text-tomate underline">
              WhatsApp
            </a>{" "}
            indicando tu número de pedido. Verificamos el pago (normalmente en minutos) y tu pedido pasa a «pago
            confirmado».
          </>
        ),
      },
      {
        q: "¿Es segura la compra?",
        a: (
          <>
            Sí. Nunca pedimos datos de tarjetas ni simulamos pagos automáticos: todo se hace por medios de pago que
            conoces y con verificación manual por nuestro equipo. Tu contraseña se guarda cifrada.
          </>
        ),
      },
    ],
  },
  {
    titulo: "Cuenta y seguridad",
    textoJp: "アカウント",
    preguntas: [
      {
        q: "¿Necesito cuenta para comprar?",
        a: (
          <>
            Sí, así podemos guardar tus datos, darte seguimiento y avisarte del estado del pedido.{" "}
            <Link href="/auth/registro" className="font-semibold text-tomate underline">Crear cuenta</Link> toma un minuto.
          </>
        ),
      },
      {
        q: "Olvidé mi contraseña",
        a: (
          <>
            Entra a <Link href="/auth/recuperar" className="font-semibold text-tomate underline">Recuperar contraseña</Link> y
            te enviaremos un enlace válido por 30 minutos.
          </>
        ),
      },
      {
        q: "¿Cómo elimino mis datos?",
        a: (
          <>
            Escríbenos a <a href={`mailto:${siteConfig.email}`} className="font-semibold text-tomate underline">{siteConfig.email}</a>{" "}
            solicitando la cancelación de tu cuenta; atendemos según la Ley 29733 de Protección de Datos Personales.
          </>
        ),
      },
    ],
  },
  {
    titulo: "Productos",
    textoJp: "商品",
    preguntas: [
      {
        q: "¿Los productos son originales?",
        a: (
          <>
            Sí, importamos de distribuidores oficiales de Japón y Corea. Los empaques llegan con su sello original y en
            español cuando el fabricante lo incluye.
          </>
        ),
      },
      {
        q: "¿Tienen información de alérgenos?",
        a: (
          <>
            Cada ficha de producto muestra ingredientes, alérgenos y peso. Si necesitas más detalle, revisa el empaque o{" "}
            <Link href="/contacto" className="font-semibold text-tomate underline">pregúntanos</Link>.
          </>
        ),
      },
      {
        q: "¿Qué pasa si un producto está agotado?",
        a: <>Lo reponemos cada 2–3 semanas. Escríbenos y te avisamos cuando vuelva.</>,
      },
    ],
  },
];

export default function PaginaFaq() {
  return (
    <DocPage
      titulo="Preguntas frecuentes"
      subtitulo="Respuestas rápidas a lo que más nos preguntan."
      textoJp="よくある質問"
    >
      <div className="space-y-6">
        {GRUPOS.map((g) => (
          <section key={g.titulo}>
            <h2 className="flex items-baseline gap-2 font-display text-lg font-bold text-marron sm:text-xl">
              {g.titulo}
              <span className="texto-jp text-xs font-normal text-tomate">{g.textoJp}</span>
            </h2>
            <div className="mt-3 space-y-2.5">
              {g.preguntas.map((p) => (
                <details
                  key={p.q}
                  className="group rounded-card border border-beige-dark/60 bg-white transition-colors hover:border-tomate/30"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-marron sm:text-[15px] [&::-webkit-details-marker]:hidden">
                    {p.q}
                    <ChevronDown
                      className="h-4 w-4 shrink-0 text-tomate transition-transform group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <div className="px-5 pb-4 text-sm leading-relaxed text-marron/75">{p.a}</div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="rounded-card border border-dashed border-beige-dark bg-crema/70 p-6 text-center">
        <p className="font-display text-base font-bold text-marron">¿No encontraste tu respuesta?</p>
        <p className="mt-1 text-sm text-marron/65">Nuestro equipo responde en menos de 24 horas hábiles.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <a
            href={siteConfig.redes.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary px-5 py-2.5"
          >
            <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
          </a>
          <a href={`mailto:${siteConfig.email}`} className="btn-outline px-5 py-2.5">
            <Mail className="h-4 w-4" aria-hidden /> Correo
          </a>
        </div>
      </div>
    </DocPage>
  );
}
