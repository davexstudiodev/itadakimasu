import type { Metadata } from "next";
import Link from "next/link";
import { Truck, Store, RotateCcw, Clock, PackageCheck } from "lucide-react";
import { getProvider } from "@/lib/data";
import { formatPEN } from "@/lib/utils/format";
import { siteConfig } from "@/lib/config/site";
import { DocPage, DocSeccion, DocLista } from "@/components/tienda/doc-page";

export const metadata: Metadata = {
  title: "Envíos y devoluciones — ITADAKIMASU",
  description:
    "Costos de delivery en Puerto Malabrigo, plazos de entrega y política de cambios y devoluciones.",
};

export default async function PaginaEnvios() {
  const cfg = await getProvider().getConfiguracion();

  return (
    <DocPage
      titulo="Envíos y devoluciones"
      subtitulo="Todo lo que necesitas saber sobre entregas, cambios y devoluciones."
      textoJp="配送と返品"
      actualizado="noviembre 2026"
    >
      {/* Envíos */}
      <DocSeccion titulo="Costos de envío">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-beige-dark/60 bg-crema/60 p-4 text-center">
            <Truck className="mx-auto h-6 w-6 text-tomate" aria-hidden />
            <p className="mt-2 text-xs font-bold uppercase tracking-wide text-marron/60">Delivery local</p>
            <p className="mt-1 text-lg font-black text-marron">
              {cfg.envioCostoLocal === 0 ? "Gratis" : formatPEN(cfg.envioCostoLocal)}
            </p>
            <p className="text-[11px] text-marron/55">Puerto Malabrigo y alrededores · 24–48 h</p>
          </div>
          <div className="rounded-xl border border-beige-dark/60 bg-crema/60 p-4 text-center">
            <Store className="mx-auto h-6 w-6 text-tomate" aria-hidden />
            <p className="mt-2 text-xs font-bold uppercase tracking-wide text-marron/60">Recojo</p>
            <p className="mt-1 text-lg font-black text-marron">{cfg.recojoGratuito ? "Gratis" : "Consultar"}</p>
            <p className="text-[11px] text-marron/55">Puerto Malabrigo, Rázuri</p>
          </div>
        </div>

        <p className="flex items-center gap-2 rounded-xl border border-hojita/30 bg-hojita/10 px-4 py-3 text-xs font-semibold text-marron/80">
          <PackageCheck className="h-4 w-4 shrink-0 text-hojita" aria-hidden />
          {cfg.envioGratisDesde > 0
            ? `Envío gratis en compras desde ${formatPEN(cfg.envioGratisDesde)}`
            : "Envío gratis en todas las compras"}
        </p>

        <DocLista
          items={[
            <>Los pedidos se despachan de <strong>lunes a sábado</strong> (no incluimos feriados).</>,
            <>Los pedidos confirmados <strong>antes de las 2:00 p. m.</strong> salen el mismo día.</>,
            <>Al despachar te enviamos la confirmación por WhatsApp con el seguimiento.</>,
            <>El horario de entrega del delivery es de <strong>10:00 a. m. a 8:00 p. m.</strong></>,
          ]}
        />
      </DocSeccion>

      <DocSeccion titulo="Recojo en tienda">
        <p>
          Selecciona «Recojo en tienda» en el checkout y te avisaremos cuando tu pedido esté listo en{" "}
          <strong>{siteConfig.direccion}</strong> ({siteConfig.horario}).
        </p>
        <p>Trae tu número de pedido o el correo de confirmación al recoger.</p>
      </DocSeccion>

      <DocSeccion titulo="Cambios y devoluciones">
        <p>
          Queremos que disfrutes tu compra. Si algo salió mal, escríbenos dentro de las{" "}
          <strong>48 horas</strong> siguientes a la entrega con fotos del producto y tu número de pedido.
        </p>
        <DocLista
          items={[
            <>Producto dañado, vencido o incorrecto: lo reemplazamos o devolvemos tu dinero.</>,
            <>Error nuestro en el despacho: asumimos el costo del reenvío.</>,
            <>Cambios de preferencia: aceptamos cambios por productos de igual o mayor valor (diferencia a cargo del cliente).</>,
            <>
              Por razones de <strong>higiene y manipulación de alimentos</strong>, no aceptamos devoluciones de productos abiertos
              o sin falla.
            </>,
          ]}
        />
        <p className="mt-4">
          <strong>Si tu pedido llegó en mal estado,</strong> contáctanos de inmediato con fotos: lo reponemos sin costo.
        </p>
      </DocSeccion>

      <DocSeccion titulo="¿Cómo solicitar un cambio?">
        <ol className="space-y-2.5">
          {[
            "Escríbenos por WhatsApp o al correo con tu número de pedido.",
            "Adjunta fotos claras del producto y del paquete.",
            "Te respondemos en menos de 24 horas hábiles con la solución.",
            "Coordinamos el recojo o reenvío sin costo para ti cuando la culpa es nuestra.",
          ].map((paso, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-tomate text-xs font-black text-crema">
                {i + 1}
              </span>
              <span className="text-sm text-marron/75">{paso}</span>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/contacto" className="btn-primary px-5 py-2.5">
            <RotateCcw className="h-4 w-4" aria-hidden /> Solicitar cambio
          </Link>
          <Link href="/preguntas-frecuentes" className="btn-outline px-5 py-2.5">
            <Clock className="h-4 w-4" aria-hidden /> Ver preguntas frecuentes
          </Link>
        </div>
      </DocSeccion>
    </DocPage>
  );
}
