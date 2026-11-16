"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash, Ticket, LoaderCircle, Check } from "lucide-react";
import { guardarCupon, eliminarCupon } from "@/server/actions/admin/cupones";
import { Modal } from "@/components/ui/modal";
import { ConfirmarAccion } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toaster";
import type { Cupon, ResultadoAccion } from "@/types";
import { cn } from "@/lib/utils/cn";

const ESTADO_INICIAL: ResultadoAccion = { ok: false };

/* Gestión completa de cupones: tabla + alta/edición en modal + baja. */
export function GestionCupones({ cupones }: { cupones: Cupon[] }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Cupon | null>(null);
  const [estado, setEstado] = useState<ResultadoAccion>(ESTADO_INICIAL);
  const [pendiente, setPendiente] = useState(false);

  const nuevo = () => {
    setEditando(null);
    setEstado(ESTADO_INICIAL);
    setAbierto(true);
  };

  const editar = (c: Cupon) => {
    setEditando(c);
    setEstado(ESTADO_INICIAL);
    setAbierto(true);
  };

  const cerrar = () => {
    setAbierto(false);
    setEditando(null);
    setEstado(ESTADO_INICIAL);
  };

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPendiente(true);
    try {
      const r = await guardarCupon(ESTADO_INICIAL, new FormData(e.currentTarget));
      setEstado(r);
      if (r.ok) {
        toast.success((r.datos?.mensaje as string) ?? "Cupón guardado");
        cerrar();
        router.refresh();
      }
    } catch {
      setEstado({ ok: false, error: "No se pudo guardar. Intenta de nuevo." });
    } finally {
      setPendiente(false);
    }
  };

  const eliminar = async (c: Cupon) => {
    const r = await eliminarCupon(c.id);
    if (r.ok) {
      toast.success((r.datos?.mensaje as string) ?? "Cupón eliminado");
      router.refresh();
    } else {
      toast.error(r.error ?? "No se pudo eliminar");
    }
    return r;
  };

  const errorDe = (campo: string) => (estado.campo === campo ? estado.error : undefined);
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={nuevo} className="btn-primary px-5 py-2.5 text-sm">
          <Plus className="h-4 w-4" aria-hidden /> Nuevo cupón
        </button>
      </div>

      {cupones.length === 0 ? (
        <div className="rounded-card border border-dashed border-beige-dark bg-white/70 px-6 py-14 text-center">
          <Ticket className="mx-auto h-10 w-10 text-marron/35" aria-hidden />
          <h2 className="mt-3 font-display text-lg font-bold text-marron">Aún no hay cupones</h2>
          <p className="mt-1 text-sm text-marron/60">
            Crea tu primer código de descuento (por ejemplo, BIENVENIDO10).
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-beige-dark/60 bg-white shadow-card">
          <ul className="divide-y divide-beige-dark/60">
            {cupones.map((c) => {
              const vigente =
                c.activo &&
                (!c.fechaInicio || c.fechaInicio <= hoy) &&
                (!c.fechaFin || c.fechaFin >= hoy) &&
                (c.usosMaximos == null || c.usosActuales < c.usosMaximos);
              return (
                <li key={c.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_140px_160px_180px] md:items-center">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-tomate px-2 py-1 font-mono text-xs font-black tracking-wider text-crema">
                        {c.codigo}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                          vigente ? "bg-hojita/15 text-hojita" : "bg-beige-dark/50 text-marron/55"
                        )}
                      >
                        {vigente ? "Vigente" : c.activo ? "Inactivo" : "Desactivado"}
                      </span>
                    </p>
                    {c.descripcion && (
                      <p className="mt-1 truncate text-xs text-marron/60">{c.descripcion}</p>
                    )}
                  </div>

                  <div className="text-sm">
                    <span className="font-black text-marron">
                      {c.tipo === "porcentaje" ? `${c.valor}%` : `S/ ${c.valor}`}
                    </span>
                    <span className="ml-1.5 text-xs text-marron/50">
                      {c.tipo === "porcentaje" ? "dto." : "fijo"}
                    </span>
                  </div>

                  <div className="text-xs text-marron/60">
                    <p>
                      Usos:{" "}
                      <strong className="text-marron">
                        {c.usosActuales}
                        {c.usosMaximos != null ? ` / ${c.usosMaximos}` : ""}
                      </strong>
                    </p>
                    <p className="text-marron/45">
                      {c.compraMinima != null ? `Desde S/ ${c.compraMinima}` : "Sin compra mínima"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <button
                      type="button"
                      onClick={() => editar(c)}
                      className="flex items-center gap-1.5 rounded-full border border-beige-dark px-3.5 py-1.5 text-xs font-semibold text-marron transition-colors hover:border-tomate hover:text-tomate"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden /> Editar
                    </button>
                    <ConfirmarAccion
                      titulo="Eliminar cupón"
                      descripcion={`Se eliminará el cupón ${c.codigo}. Los pedidos que ya lo usaron conservan su descuento.`}
                      textoConfirmar="Eliminar"
                      onConfirmar={() => eliminar(c)}
                    >
                      <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-full border border-tomate/25 px-3.5 py-1.5 text-xs font-semibold text-tomate transition-colors hover:bg-tomate/10"
                      >
                        <Trash className="h-3.5 w-3.5" aria-hidden /> Eliminar
                      </button>
                    </ConfirmarAccion>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Modal de alta/edición */}
      <Modal
        abierto={abierto}
        onCerrar={cerrar}
        titulo={editando ? `Editar ${editando.codigo}` : "Nuevo cupón"}
        ancho="max-w-xl"
      >
        <form onSubmit={enviar} className="space-y-4">
          {editando && <input type="hidden" name="id" value={editando.id} />}
          {estado.error && !estado.campo && (
            <p className="rounded-xl border border-tomate/20 bg-tomate/10 px-4 py-3 text-sm font-medium text-tomate" role="alert">
              {estado.error}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="codigo" className="etiqueta">Código *</label>
              <input
                id="codigo"
                name="codigo"
                required
                maxLength={30}
                defaultValue={editando?.codigo ?? ""}
                placeholder="BIENVENIDO10"
                className={cn("campo uppercase", errorDe("codigo") && "campo-error")}
              />
              {errorDe("codigo") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
            </div>

            <div>
              <label htmlFor="tipo" className="etiqueta">Tipo *</label>
              <select
                id="tipo"
                name="tipo"
                required
                defaultValue={editando?.tipo ?? "porcentaje"}
                className="campo appearance-none"
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="fijo">Monto fijo (S/)</option>
              </select>
            </div>

            <div>
              <label htmlFor="valor" className="etiqueta">Valor *</label>
              <input
                id="valor"
                name="valor"
                type="number"
                min={1}
                max={10000}
                step="0.01"
                required
                defaultValue={editando?.valor ?? ""}
                placeholder="10"
                className={cn("campo", errorDe("valor") && "campo-error")}
              />
              {errorDe("valor") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
            </div>

            <div>
              <label htmlFor="compraMinima" className="etiqueta">Compra mínima (S/)</label>
              <input
                id="compraMinima"
                name="compraMinima"
                type="number"
                min={0}
                step="0.01"
                defaultValue={editando?.compraMinima ?? ""}
                placeholder="Sin mínimo"
                className="campo"
              />
            </div>

            <div>
              <label htmlFor="fechaInicio" className="etiqueta">Desde</label>
              <input
                id="fechaInicio"
                name="fechaInicio"
                type="date"
                defaultValue={editando?.fechaInicio ?? ""}
                className="campo"
              />
            </div>

            <div>
              <label htmlFor="fechaFin" className="etiqueta">Hasta</label>
              <input
                id="fechaFin"
                name="fechaFin"
                type="date"
                defaultValue={editando?.fechaFin ?? ""}
                className={cn("campo", errorDe("fechaFin") && "campo-error")}
              />
              {errorDe("fechaFin") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
            </div>

            <div>
              <label htmlFor="usosMaximos" className="etiqueta">Usos máximos</label>
              <input
                id="usosMaximos"
                name="usosMaximos"
                type="number"
                min={1}
                defaultValue={editando?.usosMaximos ?? ""}
                placeholder="Ilimitado"
                className="campo"
              />
            </div>

            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2.5 text-sm text-marron/80">
                <input
                  type="checkbox"
                  name="activo"
                  defaultChecked={editando?.activo ?? true}
                  className="h-4 w-4 accent-[#D94B38]"
                />
                Cupón activo
              </label>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="descripcion" className="etiqueta">Descripción</label>
              <input
                id="descripcion"
                name="descripcion"
                maxLength={200}
                defaultValue={editando?.descripcion ?? ""}
                placeholder="10% de descuento en tu primera compra"
                className="campo"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-beige-dark pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={cerrar} className="btn-outline px-5 py-2.5">
              Cancelar
            </button>
            <button type="submit" disabled={pendiente} className="btn-primary px-6 py-2.5">
              {pendiente ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Check className="h-4 w-4" aria-hidden />
              )}
              Guardar cupón
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
