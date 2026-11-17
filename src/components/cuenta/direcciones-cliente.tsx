"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Pencil, Plus, Trash, LoaderCircle, Check } from "lucide-react";
import { guardarDireccion, eliminarDireccion } from "@/server/actions/cuenta";
import { Modal } from "@/components/ui/modal";
import { ConfirmarAccion } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toaster";
import { DEPARTAMENTOS } from "@/server/validations";
import type { Direccion, ResultadoAccion } from "@/types";
import { cn } from "@/lib/utils/cn";

const ESTADO_INICIAL: ResultadoAccion = { ok: false };

export function DireccionesCliente({ direcciones }: { direcciones: Direccion[] }) {
  const router = useRouter();
  const [editando, setEditando] = useState<Direccion | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [estado, setEstado] = useState<ResultadoAccion>(ESTADO_INICIAL);
  const [pendiente, setPendiente] = useState(false);

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPendiente(true);
    try {
      const r = await guardarDireccion(ESTADO_INICIAL, new FormData(e.currentTarget));
      setEstado(r);
      if (r.ok) {
        toast.success((r.datos?.mensaje as string) ?? "Dirección guardada");
        setAbierto(false);
        setEditando(null);
        router.refresh();
      }
    } catch {
      setEstado({ ok: false, error: "No se pudo guardar. Intenta de nuevo." });
    } finally {
      setPendiente(false);
    }
  };

  const errorDe = (campo: string) => (estado.campo === campo ? estado.error : undefined);

  const eliminar = async (id: string) => {
    const r = await eliminarDireccion(id);
    if (r.ok) {
      toast.success((r.datos?.mensaje as string) ?? "Dirección eliminada");
      router.refresh();
    }
    return r;
  };

  return (
    <div>
      <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-marron/60">
          {direcciones.length} dirección{direcciones.length === 1 ? "" : "es"} guardada{direcciones.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => { setEditando(null); setAbierto(true); }}
          className="btn-primary w-full px-5 py-2.5 sm:w-auto"
        >
          <Plus className="h-4 w-4" aria-hidden /> Nueva dirección
        </button>
      </div>

      {direcciones.length === 0 ? (
        <div className="rounded-card border border-dashed border-beige-dark bg-white/60 px-6 py-12 text-center">
          <MapPin className="mx-auto h-10 w-10 text-marron/40" aria-hidden />
          <h2 className="mt-3 font-display text-lg font-bold text-marron">Sin direcciones</h2>
          <p className="mt-1 text-sm text-marron/60">
            Guarda tu primera dirección para agilizar tus compras.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {direcciones.map((d) => (
            <li key={d.id} className="rounded-card border border-beige-dark/60 bg-white p-3 sm:p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-marron">
                    <span className="break-words">{d.nombreCompleto}</span>
                    {d.porDefecto && (
                      <span className="rounded-full bg-tomate px-2 py-0.5 text-[10px] font-bold uppercase text-crema">
                        Por defecto
                      </span>
                    )}
                  </p>
                  <p className="mt-1 break-words text-sm text-marron/70">
                    {d.direccion}, {d.distrito}
                  </p>
                  <p className="break-words text-sm text-marron/60">
                    {d.provincia}, {d.departamento} · {d.telefono}
                  </p>
                  {d.referencia && <p className="mt-1 text-xs text-marron/50">Ref.: {d.referencia}</p>}
                </div>

                <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => { setEditando(d); setAbierto(true); }}
                    className="btn-outline flex-1 px-3 py-2 text-xs sm:flex-none sm:px-4"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden /> Editar
                  </button>
                  <ConfirmarAccion
                    titulo="Eliminar dirección"
                    descripcion={`Se eliminará la dirección de ${d.nombreCompleto}. Esta acción no se puede deshacer.`}
                    textoConfirmar="Eliminar"
                    onConfirmar={() => eliminar(d.id)}
                  >
                    <button
                      type="button"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-tomate/25 px-3 py-2 text-xs font-semibold text-tomate transition-colors hover:bg-tomate/10 sm:flex-none sm:px-4"
                    >
                      <Trash className="h-3.5 w-3.5" aria-hidden /> Eliminar
                    </button>
                  </ConfirmarAccion>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal de edición/creación */}
      <Modal
        abierto={abierto}
        onCerrar={() => { setAbierto(false); setEditando(null); }}
        titulo={editando ? "Editar dirección" : "Nueva dirección"}
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
            <div className="sm:col-span-2">
              <label htmlFor="d-nombre" className="etiqueta">Nombre completo *</label>
              <input
                id="d-nombre" name="nombreCompleto" required maxLength={120}
                defaultValue={editando?.nombreCompleto ?? ""}
                className={cn("campo", errorDe("nombreCompleto") && "campo-error")}
              />
              {errorDe("nombreCompleto") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
            </div>

            <div>
              <label htmlFor="d-tel" className="etiqueta">Teléfono *</label>
              <input
                id="d-tel" name="telefono" required inputMode="tel" placeholder="987 654 321"
                defaultValue={editando?.telefono ?? ""}
                className={cn("campo", errorDe("telefono") && "campo-error")}
              />
              {errorDe("telefono") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
            </div>

            <div>
              <label htmlFor="d-dep" className="etiqueta">Departamento *</label>
              <select
                id="d-dep" name="departamento" required
                defaultValue={editando?.departamento ?? ""}
                className={cn("campo appearance-none", errorDe("departamento") && "campo-error")}
              >
                <option value="">Selecciona…</option>
                {DEPARTAMENTOS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {errorDe("departamento") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
            </div>

            <div>
              <label htmlFor="d-prov" className="etiqueta">Provincia *</label>
              <input
                id="d-prov" name="provincia" required defaultValue={editando?.provincia ?? ""}
                className={cn("campo", errorDe("provincia") && "campo-error")}
              />
              {errorDe("provincia") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
            </div>

            <div>
              <label htmlFor="d-dist" className="etiqueta">Distrito *</label>
              <input
                id="d-dist" name="distrito" required defaultValue={editando?.distrito ?? ""}
                className={cn("campo", errorDe("distrito") && "campo-error")}
              />
              {errorDe("distrito") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="d-dir" className="etiqueta">Dirección *</label>
              <input
                id="d-dir" name="direccion" required maxLength={180} placeholder="Calle, número, departamento…"
                defaultValue={editando?.direccion ?? ""}
                className={cn("campo", errorDe("direccion") && "campo-error")}
              />
              {errorDe("direccion") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="d-ref" className="etiqueta">Referencia</label>
              <input
                id="d-ref" name="referencia" maxLength={160} placeholder="Ej.: frente al parque"
                defaultValue={editando?.referencia ?? ""}
                className="campo"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="d-ind" className="etiqueta">Indicaciones para el repartidor</label>
              <input
                id="d-ind" name="indicaciones" maxLength={300} placeholder="Ej.: tocar el timbre 2B"
                defaultValue={editando?.indicaciones ?? ""}
                className="campo"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm text-marron/75">
            <input
              type="checkbox" name="porDefecto" defaultChecked={editando?.porDefecto ?? direcciones.length === 0}
              className="h-4 w-4 accent-[#D94B38]"
            />
            Usar como dirección por defecto
          </label>

          <div className="flex flex-col-reverse gap-2 border-t border-beige-dark pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => { setAbierto(false); setEditando(null); }}
              className="btn-outline w-full px-5 py-2.5 sm:w-auto"
            >
              Cancelar
            </button>
            <button type="submit" disabled={pendiente} className="btn-primary w-full px-6 py-2.5 sm:w-auto">
              {pendiente ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
              Guardar dirección
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
