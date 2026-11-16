"use client";

import { useActionState } from "react";
import { Boxes, LoaderCircle, ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal } from "lucide-react";
import { ajustarInventario } from "@/server/actions/admin/inventario";
import type { ResultadoAccion } from "@/types";
import { cn } from "@/lib/utils/cn";

const ESTADO_INICIAL: ResultadoAccion = { ok: false };

interface ProductoCorto {
  id: string;
  nombre: string;
  stock: number;
}

const TIPOS: { id: string; texto: string; icono: typeof Boxes }[] = [
  { id: "entrada", texto: "Entrada", icono: ArrowDownToLine },
  { id: "salida", texto: "Salida", icono: ArrowUpFromLine },
  { id: "ajuste", texto: "Ajuste absoluto", icono: SlidersHorizontal },
];

export function FormInventario({ productos }: { productos: ProductoCorto[] }) {
  const [estado, action, pendiente] = useActionState(ajustarInventario, ESTADO_INICIAL);
  const errorDe = (campo: string) => (estado.campo === campo ? estado.error : undefined);

  return (
    <section className="rounded-card border border-beige-dark/60 bg-white p-5 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-marron">
        <Boxes className="h-4 w-4 text-tomate" aria-hidden />
        Registrar movimiento
      </h2>

      <form action={action} className="mt-4 space-y-4">
        {estado.error && !estado.campo && (
          <p className="rounded-xl border border-tomate/20 bg-tomate/10 px-4 py-3 text-sm font-medium text-tomate" role="alert">
            {estado.error}
          </p>
        )}
        {estado.ok && (
          <p className="rounded-xl border border-hojita/25 bg-hojita/10 px-4 py-3 text-sm font-medium text-hojita" role="status">
            {(estado.datos?.mensaje as string) ?? "Movimiento registrado"}
          </p>
        )}

        <div>
          <label htmlFor="productoId" className="etiqueta">Producto *</label>
          <select
            id="productoId"
            name="productoId"
            required
            defaultValue=""
            className={cn("campo appearance-none", errorDe("productoId") && "campo-error")}
          >
            <option value="">Selecciona…</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} (stock: {p.stock})
              </option>
            ))}
          </select>
          {errorDe("productoId") && (
            <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>
          )}
        </div>

        <fieldset>
          <legend className="etiqueta">Tipo de movimiento *</legend>
          <div className="grid grid-cols-3 gap-2">
            {TIPOS.map(({ id, texto, icono: Icono }) => (
              <label
                key={id}
                className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-beige-dark/60 bg-crema/40 px-2 py-3 text-center text-[11px] font-bold text-marron transition-colors has-[:checked]:border-tomate has-[:checked]:bg-tomate/5 has-[:checked]:text-tomate"
              >
                <input
                  type="radio"
                  name="tipo"
                  value={id}
                  defaultChecked={id === "entrada"}
                  className="sr-only"
                />
                <Icono className="h-4 w-4" aria-hidden />
                {texto}
              </label>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-marron/50">
            «Ajuste absoluto» fija el stock al valor indicado; entrada/salida suman o restan.
          </p>
          {errorDe("tipo") && <p className="mt-1 text-xs font-medium text-tomate">{estado.error}</p>}
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cantidad" className="etiqueta">Cantidad *</label>
            <input
              id="cantidad"
              name="cantidad"
              type="number"
              min={1}
              max={99999}
              required
              defaultValue={1}
              className={cn("campo", errorDe("cantidad") && "campo-error")}
            />
            {errorDe("cantidad") && (
              <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>
            )}
          </div>
          <div>
            <label htmlFor="motivo" className="etiqueta">Motivo *</label>
            <input
              id="motivo"
              name="motivo"
              maxLength={120}
              required
              placeholder="Reposición proveedor"
              className={cn("campo", errorDe("motivo") && "campo-error")}
            />
          </div>
        </div>
        {errorDe("motivo") && <p className="text-xs font-medium text-tomate">{estado.error}</p>}

        <button type="submit" disabled={pendiente} className="btn-primary w-full py-3">
          {pendiente ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Boxes className="h-4 w-4" aria-hidden />
          )}
          {pendiente ? "Registrando…" : "Registrar movimiento"}
        </button>
      </form>
    </section>
  );
}
