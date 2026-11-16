"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RefreshCw, Wallet, CircleCheck } from "lucide-react";
import {
  cambiarEstadoPedido,
  confirmarPagoPedido,
} from "@/server/actions/admin/pedidos";
import { ConfirmarAccion } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toaster";
import type { EstadoPedido, Pedido } from "@/types";
import { cn } from "@/lib/utils/cn";

const ESTADOS: { id: EstadoPedido; texto: string }[] = [
  { id: "pago_pendiente", texto: "Pago por verificar" },
  { id: "pago_confirmado", texto: "Pago confirmado" },
  { id: "preparando", texto: "Preparando" },
  { id: "en_camino", texto: "En camino" },
  { id: "entregado", texto: "Entregado" },
  { id: "cancelado", texto: "Cancelado" },
  { id: "reembolsado", texto: "Reembolsado" },
];

const PELIGRO: EstadoPedido[] = ["cancelado", "reembolsado"];

/** Acciones de administración de un pedido (cambio de estado y pago manual). */
export function AccionesPedido({ pedido }: { pedido: Pedido }) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [estadoSel, setEstadoSel] = useState<EstadoPedido>(pedido.estado);
  const [nota, setNota] = useState("");

  const porVerificar = pedido.estado === "pago_pendiente" || pedido.estado === "pendiente";
  const cerrado = pedido.estado === "entregado" || pedido.estado === "cancelado";
  const estadosDisponibles = ESTADOS.filter((e) => e.id !== pedido.estado);

  const ejecutar = async (
    fn: () => Promise<{ ok: boolean; error?: string; datos?: Record<string, unknown> }>
  ): Promise<{ ok: boolean; error?: string; datos?: Record<string, unknown> }> => {
    try {
      const r = await fn();
      if (r.ok) {
        toast.success((r.datos?.mensaje as string) ?? "Actualizado");
        router.refresh();
      } else {
        toast.error(r.error ?? "No se pudo actualizar");
      }
      return r;
    } catch {
      const error = "Error inesperado. Intenta de nuevo.";
      toast.error(error);
      return { ok: false, error };
    }
  };

  const aplicar = (
    fn: () => Promise<{ ok: boolean; error?: string; datos?: Record<string, unknown> }>
  ) => {
    startTransition(async () => {
      await ejecutar(fn);
    });
  };

  const cambiarEstado = () =>
    ejecutar(() => cambiarEstadoPedido(pedido.id, estadoSel, nota || undefined));

  return (
    <div className="space-y-5">
      {/* Confirmar pago manual */}
      {porVerificar && (
        <section className="rounded-card border border-naranja/40 bg-naranja/10 p-5">
          <h3 className="flex items-center gap-2 font-display font-bold text-naranja-dark">
            <Wallet className="h-4 w-4" aria-hidden />
            Verificación de pago
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-marron/75">
            Comprueba el comprobante enviado por el cliente y confirma el pago. Nunca se procesa
            automáticamente: la confirmación siempre es manual.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <p className="text-xs leading-relaxed text-marron/70">
              Medio verificado: <strong className="text-[#780699]">Yape</strong> · comprueba el
              comprobante enviado por el cliente antes de confirmar.
            </p>
            <button
              type="button"
              disabled={pendiente}
              onClick={() => aplicar(() => confirmarPagoPedido(pedido.id, "yape"))}
              className="btn-primary px-5 py-2.5 text-sm"
            >
              {pendiente ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <CircleCheck className="h-4 w-4" aria-hidden />
              )}
              Confirmar pago
            </button>
          </div>
        </section>
      )}

      {/* Cambio de estado */}
      {!cerrado && (
        <section className="rounded-card border border-beige-dark/60 bg-white p-5">
          <h3 className="font-display font-bold text-marron">Cambiar estado</h3>
          <div className="mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="estado" className="etiqueta">Nuevo estado</label>
                <select
                  id="estado"
                  value={estadoSel}
                  onChange={(e) => setEstadoSel(e.target.value as EstadoPedido)}
                  className="campo appearance-none py-2.5"
                >
                  <option value={pedido.estado} disabled>
                    Actual:{" "}
                    {ESTADOS.find((e) => e.id === pedido.estado)?.texto ??
                      pedido.estado.replace(/_/g, " ")}
                  </option>
                  {estadosDisponibles.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.texto}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="nota" className="etiqueta">Nota (opcional)</label>
                <input
                  id="nota"
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  maxLength={300}
                  placeholder="Ej.: cliente avisado por WhatsApp"
                  className="campo py-2.5"
                />
              </div>
            </div>

            {PELIGRO.includes(estadoSel) ? (
              <ConfirmarAccion
                titulo={`Marcar como ${estadoSel === "cancelado" ? "cancelado" : "reembolsado"}`}
                descripcion={`El pedido ${pedido.numero} quedará cerrado con el estado «${estadoSel}». Esta acción queda registrada en la auditoría.`}
                textoConfirmar="Sí, cambiar estado"
                onConfirmar={cambiarEstado}
              >
                <button
                  type="button"
                  disabled={pendiente}
                  className="flex items-center gap-2 rounded-full border border-tomate/40 px-5 py-2.5 text-sm font-bold text-tomate transition-colors hover:bg-tomate/10"
                >
                  {pendiente ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <RefreshCw className="h-4 w-4" aria-hidden />
                  )}
                  Cambiar estado
                </button>
              </ConfirmarAccion>
            ) : (
              <button
                type="button"
                disabled={pendiente}
                onClick={() => aplicar(() => cambiarEstadoPedido(pedido.id, estadoSel, nota || undefined))}
                className={cn(
                  "btn-primary px-5 py-2.5 text-sm",
                  estadoSel === "entregado" && "bg-hojita hover:bg-hojita/90"
                )}
              >
                {pendiente ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="h-4 w-4" aria-hidden />
                )}
                Aplicar estado
              </button>
            )}
          </div>
        </section>
      )}

      {cerrado && (
        <p className="rounded-card border border-beige-dark/60 bg-white px-5 py-4 text-sm text-marron/65">
          Este pedido está cerrado ({pedido.estado.replace(/_/g, " ")}); no admite más cambios.
        </p>
      )}
    </div>
  );
}
