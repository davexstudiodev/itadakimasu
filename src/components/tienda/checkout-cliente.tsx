"use client";

import { useEffect, useActionState, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Truck,
  Store,
  Tag,
  ShieldCheck,
  LoaderCircle,
  ShoppingBag,
  MessageCircle,
} from "lucide-react";
import { useCarrito, subtotalDe } from "@/store/carrito";
import { crearPedido, calcularTotales, type TotalesPreview } from "@/server/actions/pedidos";
import { toast } from "@/components/ui/toaster";
import { EstadoVacio } from "@/components/ui/empty-state";
import { formatPEN } from "@/lib/utils/format";
import { siteConfig } from "@/lib/config/site";
import { DEPARTAMENTOS } from "@/server/validations";
import type { ConfiguracionTienda, Direccion, MetodoEnvio, ResultadoAccion } from "@/types";
import { cn } from "@/lib/utils/cn";

interface Props {
  direcciones: Direccion[];
  cfg: ConfiguracionTienda;
  usuario: { nombre: string; email: string; telefono: string };
}

const ESTADO_INICIAL: ResultadoAccion = { ok: false };

const ENVIOS: { id: MetodoEnvio; nombre: string; detalle: string; icono: typeof Truck }[] = [
  { id: "delivery_local", nombre: "Delivery local", detalle: "Puerto Malabrigo y alrededores · 24–48 h", icono: Truck },
  { id: "recojo_tienda", nombre: "Recojo en tienda", detalle: "Puerto Malabrigo, Rázuri · sin costo", icono: Store },
];

const CAMPOS_VACIOS = {
  nombreCompleto: "",
  telefono: "",
  departamento: "",
  provincia: "",
  distrito: "",
  direccion: "",
  referencia: "",
  indicaciones: "",
};

export function CheckoutCliente({ direcciones, cfg, usuario }: Props) {
  const items = useCarrito((s) => s.items);
  const [estado, action, pendiente] = useActionState(crearPedido, ESTADO_INICIAL);

  const [envio, setEnvio] = useState<MetodoEnvio>("delivery_local");
  const [cuponInput, setCuponInput] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState<string | null>(null);
  const [totales, setTotales] = useState<TotalesPreview | null>(null);
  const [dirId, setDirId] = useState<string>(direcciones[0]?.id ?? "nueva");
  const [dir, setDir] = useState(() =>
    direcciones[0]
      ? {
          nombreCompleto: direcciones[0].nombreCompleto,
          telefono: direcciones[0].telefono,
          departamento: direcciones[0].departamento,
          provincia: direcciones[0].provincia,
          distrito: direcciones[0].distrito,
          direccion: direcciones[0].direccion,
          referencia: direcciones[0].referencia ?? "",
          indicaciones: direcciones[0].indicaciones ?? "",
        }
      : { ...CAMPOS_VACIOS, nombreCompleto: usuario.nombre, telefono: usuario.telefono }
  );

  // Totales autoritativos del servidor
  useEffect(() => {
    let vivo = true;
    calcularTotales(envio, cuponAplicado ?? undefined).then((t) => {
      if (vivo) setTotales(t);
    });
    return () => {
      vivo = false;
    };
  }, [envio, cuponAplicado]);

  const cambiarDir = (id: string) => {
    setDirId(id);
    if (id !== "nueva") {
      const d = direcciones.find((x) => x.id === id);
      if (d) {
        setDir({
          nombreCompleto: d.nombreCompleto,
          telefono: d.telefono,
          departamento: d.departamento,
          provincia: d.provincia,
          distrito: d.distrito,
          direccion: d.direccion,
          referencia: d.referencia ?? "",
          indicaciones: d.indicaciones ?? "",
        });
      }
    } else {
      setDir({ ...CAMPOS_VACIOS, nombreCompleto: usuario.nombre, telefono: usuario.telefono });
    }
  };

  const aplicarCupon = async () => {
    const codigo = cuponInput.trim().toUpperCase();
    if (!codigo) return;
    const t = await calcularTotales(envio, codigo);
    if (t.error) {
      toast.error(t.error);
      setCuponAplicado(null);
      return;
    }
    setCuponAplicado(codigo);
    toast.success(`Cupón ${codigo} aplicado`);
  };

  if (items.length === 0) {
    return (
      <EstadoVacio
        icono={ShoppingBag}
        titulo="No hay nada que comprar"
        descripcion="Tu carrito está vacío. Añade productos antes de pasar por caja."
        accion={{ texto: "Ver productos", href: "/productos" }}
      />
    );
  }

  const subtotal = subtotalDe(items);
  const envioCosto = totales?.envio ?? 0;
  const descuento = totales?.descuento ?? 0;
  const total = totales?.total ?? subtotal;
  const envioGratis = subtotal - descuento >= cfg.envioGratisDesde && envio !== "recojo_tienda";

  const setCampo = (nombre: keyof typeof CAMPOS_VACIOS) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setDir((d) => ({ ...d, [nombre]: e.target.value }));

  const errorDe = (campo: string) => (estado.campo === campo ? estado.error : undefined);

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {/* ============ Columna principal ============ */}
      <div className="space-y-6">
        {estado.error && !estado.campo && (
          <p className="rounded-xl border border-tomate/20 bg-tomate/10 px-4 py-3 text-sm font-medium text-tomate" role="alert">
            {estado.error}
          </p>
        )}

        {/* Envío */}
        <section className="rounded-card border border-beige-dark/60 bg-white p-5">
          <h2 className="font-display text-lg font-bold text-marron">
            <span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full bg-tomate text-xs font-black text-crema">1</span>
            ¿Cómo lo recibes?
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {ENVIOS.map(({ id, nombre, detalle, icono: Icono }) => (
              <label
                key={id}
                className={cn(
                  "cursor-pointer rounded-xl border-2 p-4 transition-all",
                  envio === id ? "border-tomate bg-tomate/5" : "border-beige-dark/60 bg-crema/40 hover:border-beige-dark"
                )}
              >
                <input
                  type="radio"
                  name="metodoEnvio"
                  value={id}
                  checked={envio === id}
                  onChange={() => setEnvio(id)}
                  className="sr-only"
                />
                <Icono className={cn("h-5 w-5", envio === id ? "text-tomate" : "text-marron/50")} aria-hidden />
                <p className="mt-2 text-sm font-bold text-marron">{nombre}</p>
                <p className="text-xs text-marron/60">{detalle}</p>
                <p className="mt-1.5 text-xs font-bold text-tomate">
                  {id === "recojo_tienda" && cfg.recojoGratuito
                    ? "Gratis"
                    : envioGratis
                      ? "Gratis"
                      : formatPEN(cfg.envioCostoLocal)}
                </p>
              </label>
            ))}
          </div>
          {!envioGratis && envio !== "recojo_tienda" && (
            <p className="mt-3 flex items-center gap-2 text-xs font-medium text-naranja-dark">
              <Tag className="h-3.5 w-3.5" aria-hidden />
              Te faltan {formatPEN(Math.max(0, cfg.envioGratisDesde - (subtotal - descuento)))} para el envío gratis
            </p>
          )}
        </section>

        {/* Dirección */}
        <section className="rounded-card border border-beige-dark/60 bg-white p-5">
          <h2 className="font-display text-lg font-bold text-marron">
            <span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full bg-tomate text-xs font-black text-crema">2</span>
            Dirección de entrega
          </h2>

          {direcciones.length > 0 && (
            <div className="mt-4 space-y-2">
              {direcciones.map((d) => (
                <label
                  key={d.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 transition-all",
                    dirId === d.id ? "border-tomate bg-tomate/5" : "border-beige-dark/60 hover:border-beige-dark"
                  )}
                >
                  <input
                    type="radio"
                    name="direccionId"
                    value={d.id}
                    checked={dirId === d.id}
                    onChange={() => cambiarDir(d.id)}
                    className="mt-1 accent-[#D94B38]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-marron">
                      {d.nombreCompleto}
                      {d.porDefecto && (
                        <span className="ml-2 rounded-full bg-tomate/10 px-2 py-0.5 text-[10px] font-bold uppercase text-tomate">
                          Por defecto
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-marron/65">
                      {d.direccion}, {d.distrito}, {d.provincia}, {d.departamento} · {d.telefono}
                    </span>
                  </span>
                </label>
              ))}
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3.5 transition-all",
                  dirId === "nueva" ? "border-tomate bg-tomate/5" : "border-beige-dark/60 hover:border-beige-dark"
                )}
              >
                <input
                  type="radio"
                  name="direccionId"
                  value="nueva"
                  checked={dirId === "nueva"}
                  onChange={() => cambiarDir("nueva")}
                  className="accent-[#D94B38]"
                />
                <span className="text-sm font-bold text-marron">Usar otra dirección</span>
              </label>
            </div>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nombreCompleto" className="etiqueta">Nombre completo *</label>
              <input
                id="nombreCompleto" name="nombreCompleto" value={dir.nombreCompleto} onChange={setCampo("nombreCompleto")}
                required className={cn("campo", errorDe("direccion.nombreCompleto") && "campo-error")}
              />
              {errorDe("direccion.nombreCompleto") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
            </div>
            <div>
              <label htmlFor="telefono" className="etiqueta">Teléfono *</label>
              <input
                id="telefono" name="telefono" value={dir.telefono} onChange={setCampo("telefono")} inputMode="tel"
                placeholder="987 654 321" required className={cn("campo", errorDe("direccion.telefono") && "campo-error")}
              />
              {errorDe("direccion.telefono") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
            </div>
            <div>
              <label htmlFor="departamento" className="etiqueta">Departamento *</label>
              <select
                id="departamento" name="departamento" value={dir.departamento} onChange={setCampo("departamento")}
                required className={cn("campo appearance-none", errorDe("direccion.departamento") && "campo-error")}
              >
                <option value="">Selecciona…</option>
                {DEPARTAMENTOS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="provincia" className="etiqueta">Provincia *</label>
              <input
                id="provincia" name="provincia" value={dir.provincia} onChange={setCampo("provincia")}
                required className={cn("campo", errorDe("direccion.provincia") && "campo-error")}
              />
            </div>
            <div>
              <label htmlFor="distrito" className="etiqueta">Distrito *</label>
              <input
                id="distrito" name="distrito" value={dir.distrito} onChange={setCampo("distrito")}
                required className={cn("campo", errorDe("direccion.distrito") && "campo-error")}
              />
            </div>
            <div>
              <label htmlFor="direccion" className="etiqueta">Dirección *</label>
              <input
                id="direccion" name="direccion" value={dir.direccion} onChange={setCampo("direccion")}
                placeholder="Calle, número, departamento…" required
                className={cn("campo", errorDe("direccion.direccion") && "campo-error")}
              />
            </div>
            <div>
              <label htmlFor="referencia" className="etiqueta">Referencia</label>
              <input
                id="referencia" name="referencia" value={dir.referencia} onChange={setCampo("referencia")}
                placeholder="Ej.: frente al parque" className="campo"
              />
            </div>
            <div>
              <label htmlFor="indicaciones" className="etiqueta">Indicaciones para el repartidor</label>
              <input
                id="indicaciones" name="indicaciones" value={dir.indicaciones} onChange={setCampo("indicaciones")}
                placeholder="Ej.: tocar el timbre 2B" className="campo"
              />
            </div>
          </div>
        </section>

        {/* Pago — único método: Yape */}
        <section className="rounded-card border border-beige-dark/60 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold text-marron">
              <span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full bg-tomate text-xs font-black text-crema">3</span>
              Método de pago
            </h2>
            <span className="rounded-full bg-[#780699]/10 px-3 py-1 text-[11px] font-black tracking-wide text-[#780699]">
              ÚNICO MÉTODO · YAPE
            </span>
          </div>

          <div className="mt-4 grid gap-5 sm:grid-cols-[220px_1fr]">
            {/* QR de Yape */}
            <div className="mx-auto w-full max-w-[220px]">
              <div className="overflow-hidden rounded-2xl border border-[#780699]/20 bg-white shadow-card">
                <Image
                  src="/pagos/yape-qr.jpg"
                  alt="QR de Yape — Elias Josue David Casusol Leyva"
                  width={1131}
                  height={1599}
                  className="h-auto w-full"
                  priority
                />
              </div>
              <p className="mt-2 text-center text-[11px] font-medium text-marron/55">
                Toca la imagen para ampliarla
              </p>
            </div>

            {/* Instrucciones */}
            <div className="min-w-0">
              <p className="text-sm font-bold text-marron">
                Escanea el QR con tu app Yape y transfiere{" "}
                <span className="text-[#780699]">{formatPEN(total)}</span>
              </p>

              <ol className="mt-3 space-y-2.5">
                {[
                  "Abre tu app Yape y toca «Escanear».",
                  `Transfiere exactamente ${formatPEN(total)} (no se redondea).`,
                  "Envía la captura del comprobante por WhatsApp con tu número de pedido.",
                ].map((paso, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed text-marron/80">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#780699] text-[11px] font-black text-white">
                      {i + 1}
                    </span>
                    <span>{paso}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-4 rounded-xl border border-naranja/30 bg-naranja/10 p-4 text-xs leading-relaxed text-marron/80">
                <p className="mb-1 font-bold uppercase tracking-wide text-naranja-dark">
                  Pago manual — se confirma en minutos
                </p>
                <p>
                  Tu pedido quedará en «pago pendiente» hasta que confirmemos el comprobante.
                  A nombre de <strong>Elias Josue David Casusol Leyva</strong>.
                </p>
              </div>

              <a
                href={siteConfig.redes.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-4 w-full py-3"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Enviar comprobante por WhatsApp
              </a>
            </div>
          </div>

          <input type="hidden" name="metodoPago" value="yape" />
        </section>

        {/* Cupón y notas */}
        <section className="rounded-card border border-beige-dark/60 bg-white p-5">
          <h2 className="font-display text-lg font-bold text-marron">
            <span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full bg-tomate text-xs font-black text-crema">4</span>
            Cupón y notas
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            <input
              value={cuponInput}
              onChange={(e) => setCuponInput(e.target.value.toUpperCase())}
              placeholder="BIENVENIDO10"
              aria-label="Código de cupón"
              className="campo max-w-[220px] uppercase"
            />
            <button type="button" onClick={aplicarCupon} className="btn-outline px-5 py-2.5">
              <Tag className="h-4 w-4" aria-hidden /> Aplicar
            </button>
            {cuponAplicado && (
              <button
                type="button"
                onClick={() => { setCuponAplicado(null); setCuponInput(""); }}
                className="btn-ghost px-4 py-2.5 text-tomate"
              >
                Quitar {cuponAplicado}
              </button>
            )}
          </div>

          <div className="mt-4">
            <label htmlFor="notas" className="etiqueta">Notas para tu pedido (opcional)</label>
            <textarea
              id="notas" name="notas" rows={3} maxLength={400}
              placeholder="Ej.: si no hay nadie, déjalo con el conserje…"
              className="campo min-h-20 resize-y"
            />
          </div>

          <label className="mt-4 flex items-start gap-3 text-xs leading-relaxed text-marron/70">
            <input type="checkbox" name="aceptaTerminos" required className="mt-0.5 h-4 w-4 accent-[#D94B38]" />
            <span>
              Acepto los <Link href="/terminos" className="font-semibold text-tomate underline">términos y condiciones</Link> y la{" "}
              <Link href="/privacidad" className="font-semibold text-tomate underline">política de privacidad</Link>. *
            </span>
          </label>
          {errorDe("aceptaTerminos") && (
            <p className="mt-2 text-xs font-medium text-tomate" role="alert">{estado.error}</p>
          )}
        </section>
      </div>

      {/* ============ Resumen ============ */}
      <aside className="h-fit rounded-card border border-beige-dark/60 bg-white p-5 shadow-card lg:sticky lg:top-24">
        <h2 className="font-display text-lg font-bold text-marron">Tu pedido</h2>

        <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
          {items.map((i) => (
            <li key={i.productoId} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0">
                <span className="line-clamp-1 font-medium text-marron">{i.nombre}</span>
                <span className="text-xs text-marron/50">x{i.cantidad}</span>
              </span>
              <span className="shrink-0 font-semibold text-marron">{formatPEN(i.precio * i.cantidad)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 border-t border-beige-dark pt-4 text-sm">
          <div className="flex justify-between text-marron/70">
            <dt>Subtotal</dt><dd className="font-semibold text-marron">{formatPEN(subtotal)}</dd>
          </div>
          {descuento > 0 && (
            <div className="flex justify-between text-hojita">
              <dt>Descuento {cuponAplicado && `(${cuponAplicado})`}</dt>
              <dd className="font-semibold">−{formatPEN(descuento)}</dd>
            </div>
          )}
          <div className="flex justify-between text-marron/70">
            <dt>Envío</dt>
            <dd className="font-semibold text-marron">
              {envio === "recojo_tienda" || envioGratis ? "Gratis" : formatPEN(envioCosto)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-beige-dark pt-2.5 text-base">
            <dt className="font-bold text-marron">Total</dt>
            <dd className="font-black text-tomate">{formatPEN(total)}</dd>
          </div>
        </dl>

        <button type="submit" disabled={pendiente} className="btn-primary mt-5 w-full py-3.5 text-base">
          {pendiente ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden /> : <ShieldCheck className="h-5 w-5" aria-hidden />}
          {pendiente ? "Procesando…" : "Confirmar pedido"}
        </button>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-marron/55">
          Nunca simulamos pagos reales. Los pagos manuales se confirman por nuestro equipo.
        </p>
      </aside>
      <input type="hidden" name="items" value={JSON.stringify(items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })))} />
      {cuponAplicado && <input type="hidden" name="cuponCodigo" value={cuponAplicado} />}
    </form>
  );
}
