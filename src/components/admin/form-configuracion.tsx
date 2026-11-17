"use client";

import { useActionState, useEffect } from "react";
import { Save, LoaderCircle, Truck, Wallet, Store, Share2 } from "lucide-react";
import { guardarConfiguracion } from "@/server/actions/admin/configuracion";
import { toast } from "@/components/ui/toaster";
import type { ConfiguracionTienda, Cupon, ResultadoAccion } from "@/types";
import { cn } from "@/lib/utils/cn";

const ESTADO_INICIAL: ResultadoAccion = { ok: false };

export function FormConfiguracion({ cfg, cupones }: { cfg: ConfiguracionTienda; cupones: Cupon[] }) {
  const [estado, action, pendiente] = useActionState(guardarConfiguracion, ESTADO_INICIAL);

  // Solo toast (sin setState): la página se refresca con router del servidor
  useEffect(() => {
    if (estado.ok) toast.success((estado.datos?.mensaje as string) ?? "Configuración guardada");
  }, [estado]);

  const errorDe = (campo: string) => (estado.campo === campo ? estado.error : undefined);

  return (
    <form action={action} className="space-y-6">
      {estado.error && !estado.campo && (
        <p className="rounded-xl border border-tomate/20 bg-tomate/10 px-4 py-3 text-sm font-medium text-tomate" role="alert">
          {estado.error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Datos de la tienda */}
        <section className="rounded-card border border-beige-dark/60 bg-white p-5 shadow-card">
          <h2 className="font-display text-lg font-bold text-marron">Datos de la tienda</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nombre" className="etiqueta">Nombre *</label>
              <input
                id="nombre"
                name="nombre"
                required
                maxLength={60}
                defaultValue={cfg.nombre}
                className={cn("campo", errorDe("nombre") && "campo-error")}
              />
              {errorDe("nombre") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
            </div>
            <div>
              <label htmlFor="lema" className="etiqueta">Lema</label>
              <input id="lema" name="lema" maxLength={120} defaultValue={cfg.lema} className="campo" />
            </div>
            <div>
              <label htmlFor="correo" className="etiqueta">Correo *</label>
              <input
                id="correo"
                name="correo"
                type="email"
                required
                defaultValue={cfg.correo}
                className={cn("campo", errorDe("correo") && "campo-error")}
              />
              {errorDe("correo") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
            </div>
            <div>
              <label htmlFor="telefono" className="etiqueta">Teléfono / WhatsApp</label>
              <input id="telefono" name="telefono" maxLength={30} defaultValue={cfg.telefono} className="campo" />
            </div>
            <div>
              <label htmlFor="direccion" className="etiqueta">Dirección</label>
              <input id="direccion" name="direccion" maxLength={160} defaultValue={cfg.direccion} className="campo" />
            </div>
            <div>
              <label htmlFor="horario" className="etiqueta">Horario</label>
              <input id="horario" name="horario" maxLength={120} defaultValue={cfg.horario} className="campo" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="mensajeBoasvindas" className="etiqueta">Mensaje de bienvenida</label>
              <input
                id="mensajeBoasvindas"
                name="mensajeBoasvindas"
                maxLength={200}
                defaultValue={cfg.mensajeBoasvindas}
                className={cn("campo", errorDe("mensajeBoasvindas") && "campo-error")}
              />
              {errorDe("mensajeBoasvindas") && (
                <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="cuponInicioId" className="etiqueta">Cupón destacado en el inicio</label>
              <select
                id="cuponInicioId"
                name="cuponInicioId"
                defaultValue={cfg.cuponInicioId ?? ""}
                className="campo"
              >
                <option value="">Sin cupón: mostrar aviso de novedades</option>
                {cupones.map((cupon) => (
                  <option key={cupon.id} value={cupon.id}>
                    {cupon.codigo} · {cupon.activo ? "activo" : "desactivado"}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs leading-relaxed text-marron/60">
                Solo se mostrará mientras el cupón esté activo y vigente. Al desactivarlo, el inicio cambia automáticamente al aviso informativo.
              </p>
            </div>
          </div>
        </section>

        {/* Redes sociales */}
        <section className="rounded-card border border-beige-dark/60 bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-marron">
            <Share2 className="h-4 w-4 text-tomate" aria-hidden /> Redes sociales
          </h2>
          <div className="mt-4 space-y-4">
            {(
              [
                ["instagram", "Instagram"],
                ["tiktok", "TikTok"],
                ["facebook", "Facebook"],
                ["whatsapp", "WhatsApp (enlace wa.me)"],
              ] as const
            ).map(([campo, etiqueta]) => (
              <div key={campo}>
                <label htmlFor={campo} className="etiqueta">{etiqueta}</label>
                <input
                  id={campo}
                  name={campo}
                  type="url"
                  maxLength={200}
                  defaultValue={cfg.redes[campo] ?? ""}
                  placeholder="https://…"
                  className={cn("campo", errorDe(campo) && "campo-error")}
                />
                {errorDe(campo) && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* Envíos */}
        <section className="rounded-card border border-beige-dark/60 bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-marron">
            <Truck className="h-4 w-4 text-tomate" aria-hidden /> Envíos
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="envioCostoLocal" className="etiqueta">Costo delivery local (S/)</label>
              <input
                id="envioCostoLocal"
                name="envioCostoLocal"
                type="number"
                min={0}
                max={500}
                step="0.01"
                defaultValue={cfg.envioCostoLocal}
                className={cn("campo", errorDe("envioCostoLocal") && "campo-error")}
              />
            </div>
            <div>
              <label htmlFor="envioGratisDesde" className="etiqueta">Envío gratis desde (S/)</label>
              <input
                id="envioGratisDesde"
                name="envioGratisDesde"
                type="number"
                min={0}
                step="0.01"
                defaultValue={cfg.envioGratisDesde}
                className={cn("campo", errorDe("envioGratisDesde") && "campo-error")}
              />
            </div>
          </div>
          {(errorDe("envioCostoLocal") || errorDe("envioGratisDesde")) && (
            <p className="mt-2 text-xs font-medium text-tomate">{estado.error}</p>
          )}
          <label className="mt-4 flex items-center gap-2.5 text-sm text-marron/80">
            <input
              type="checkbox"
              name="recojoGratuito"
              defaultChecked={cfg.recojoGratuito}
              className="h-4 w-4 accent-[#D94B38]"
            />
            <Store className="h-4 w-4 text-marron/50" aria-hidden />
            El recojo en tienda es gratuito
          </label>
          <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-beige-dark/60 p-3.5">
            <span>
              <span className="block text-sm font-semibold text-marron">Autollenar ubicación en el checkout</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-marron/60">
                Para direcciones nuevas: La Libertad, Ascope y Rázuri.
              </span>
            </span>
            <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
              <input
                type="checkbox"
                name="autollenarUbicacionCheckout"
                role="switch"
                defaultChecked={cfg.autollenarUbicacionCheckout}
                aria-label="Autollenar la ubicación de entrega en el checkout"
                className="peer sr-only"
              />
              <span aria-hidden="true" className="absolute inset-0 rounded-full bg-marron/20 transition-colors peer-checked:bg-tomate peer-focus-visible:ring-2 peer-focus-visible:ring-tomate/40" />
              <span aria-hidden="true" className="pointer-events-none relative ml-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
            </span>
          </label>
        </section>

        {/* Medios de pago */}
        <section className="rounded-card border border-beige-dark/60 bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-marron">
            <Wallet className="h-4 w-4 text-tomate" aria-hidden /> Medios de pago
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-marron/60">
            Yape es el único medio de pago de la tienda. El pago se confirma manualmente desde
            Pedidos, tras verificar el comprobante enviado por el cliente.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-beige-dark/60 px-3.5 py-2.5 text-sm text-marron transition-colors hover:border-tomate/40 has-[:checked]:border-tomate/60 has-[:checked]:bg-tomate/5">
              <input
                type="checkbox"
                name="pagoYape"
                defaultChecked={cfg.metodosPago.yape}
                className="h-4 w-4 accent-[#780699]"
              />
              Yape
            </label>
          </div>
          {errorDe("pagoYape") && (
            <p className="mt-3 rounded-xl border border-tomate/20 bg-tomate/10 px-3 py-2 text-xs font-medium text-tomate" role="alert">
              {estado.error}
            </p>
          )}
        </section>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={pendiente} className="btn-primary px-7 py-3">
          {pendiente ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          {pendiente ? "Guardando…" : "Guardar configuración"}
        </button>
      </div>
    </form>
  );
}
