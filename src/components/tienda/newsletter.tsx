"use client";

import { useActionState, useEffect } from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import { suscribirNewsletter } from "@/server/actions/newsletter";
import type { ResultadoAccion } from "@/types";
import { toast } from "@/components/ui/toaster";

const inicial: ResultadoAccion = { ok: false };

export function Newsletter() {
  const [estado, accion, pendiente] = useActionState(suscribirNewsletter, inicial);

  useEffect(() => {
    if (estado.ok && estado.datos?.mensaje) {
      toast.success(String(estado.datos.mensaje));
    } else if (!estado.ok && estado.error) {
      toast.error(estado.error);
    }
  }, [estado]);

  return (
    <section className="contenedor">
      <div className="relative overflow-hidden rounded-card bg-marron px-6 py-10 text-crema sm:px-10 sm:py-12">
        <div aria-hidden className="patron-olas absolute inset-0 opacity-30" />
        <div
          aria-hidden
          className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-tomate/40"
        />
        <div className="relative grid items-center gap-6 lg:grid-cols-2">
          <div>
            <p className="texto-jp text-sm font-bold text-naranja">ニュースレター · 뉴스레터</p>
            <h2 className="texto-marca mt-1.5 text-2xl font-black sm:text-3xl">
              Ofertas y novedades en tu correo
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-crema/75">
              Suscríbete y recibe un <strong className="text-naranja">10% de descuento</strong> en tu
              primera compra, más avisos de lanzamientos y drops limitados.
            </p>
          </div>

          <form action={accion} className="flex flex-col gap-2.5 sm:flex-row">
            <div className="relative flex-1">
              <Mail
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-marron/50"
                aria-hidden
              />
              <input
                type="email"
                name="email"
                required
                placeholder="tu@correo.com"
                aria-label="Correo electrónico"
                className="campo h-12 rounded-full border-0 bg-white pl-11 pr-4 text-marron"
              />
            </div>
            <button
              type="submit"
              disabled={pendiente}
              className="btn-primary h-12 shrink-0 px-7 disabled:opacity-70"
            >
              {pendiente ? "Enviando…" : "Suscribirme"}
              {!pendiente && <CheckCircle2 className="h-4 w-4" aria-hidden />}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
