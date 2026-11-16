"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmarAccion } from "@/components/ui/confirm-dialog";
import { FilaUsuario } from "@/components/admin/fila-usuario";
import { toast } from "@/components/ui/toaster";
import { eliminarClientes } from "@/server/actions/admin/usuarios";
import type { Perfil } from "@/types";

export function TablaUsuarios({ usuarios, miId }: { usuarios: Perfil[]; miId: string }) {
  const [seleccionados, setSeleccionados] = useState<Set<string>>(() => new Set());
  const seleccionables = useMemo(
    () => usuarios.filter((u) => u.rol === "customer" && u.id !== miId && !u.email.endsWith(".invalid")),
    [usuarios, miId]
  );
  const idsVisibles = seleccionables.filter((u) => seleccionados.has(u.id)).map((u) => u.id);
  const todosSeleccionados = seleccionables.length > 0 && idsVisibles.length === seleccionables.length;

  const alternarSeleccion = (id: string) => {
    setSeleccionados((actuales) => {
      const nuevos = new Set(actuales);
      if (nuevos.has(id)) nuevos.delete(id);
      else nuevos.add(id);
      return nuevos;
    });
  };

  const alternarTodosVisibles = () => {
    setSeleccionados((actuales) => {
      const nuevos = new Set(actuales);
      if (todosSeleccionados) seleccionables.forEach((u) => nuevos.delete(u.id));
      else seleccionables.forEach((u) => nuevos.add(u.id));
      return nuevos;
    });
  };

  const borrarSeleccionados = async () => {
    const r = await eliminarClientes(idsVisibles);
    if (r.ok) {
      toast.success(r.datos?.mensaje as string);
      setSeleccionados(new Set());
    }
    return r;
  };

  return (
    <div className="overflow-hidden rounded-card border border-beige-dark/60 bg-white shadow-card">
      {idsVisibles.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-beige-dark/60 bg-tomate/5 px-4 py-3">
          <p className="text-sm font-semibold text-marron">
            {idsVisibles.length} cliente{idsVisibles.length === 1 ? "" : "s"} seleccionado{idsVisibles.length === 1 ? "" : "s"}
          </p>
          <ConfirmarAccion
            titulo="Eliminar clientes seleccionados"
            descripcion={`Se inhabilitarán y anonimizarán ${idsVisibles.length} cuenta${idsVisibles.length === 1 ? "" : "s"}. Se conservarán los pedidos cerrados sin datos personales. La operación se cancelará si alguna cuenta tiene pedidos en curso.`}
            textoConfirmar="Eliminar cuentas"
            onConfirmar={borrarSeleccionados}
          >
            <button type="button" className="flex items-center gap-1.5 rounded-full bg-tomate px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-tomate-dark">
              <Trash2 className="h-3.5 w-3.5" aria-hidden /> Eliminar seleccionados
            </button>
          </ConfirmarAccion>
        </div>
      )}

      <label className="flex items-center gap-2 border-b border-beige-dark/60 bg-crema/70 px-4 py-3 text-xs font-bold uppercase tracking-wide text-marron/60 lg:hidden">
        <input type="checkbox" checked={todosSeleccionados} onChange={alternarTodosVisibles} aria-label={todosSeleccionados ? "Quitar selección de clientes visibles" : "Seleccionar todos los clientes visibles"} className="h-4 w-4 accent-tomate" />
        Seleccionar todos los clientes de esta página
      </label>

      <div className="hidden gap-4 border-b border-beige-dark/60 bg-crema/70 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-marron/60 lg:grid lg:grid-cols-[1fr_170px_140px_140px_180px]">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={todosSeleccionados}
            onChange={alternarTodosVisibles}
            aria-label={todosSeleccionados ? "Quitar selección de clientes visibles" : "Seleccionar todos los clientes visibles"}
            className="h-4 w-4 accent-tomate"
          />
          Cliente
        </label>
        <span>Teléfono</span>
        <span>Rol</span>
        <span>Estado</span>
        <span className="text-right">Acciones</span>
      </div>
      <ul className="divide-y divide-beige-dark/60">
        {usuarios.map((usuario) => (
          <FilaUsuario
            key={usuario.id}
            usuario={usuario}
            esYo={usuario.id === miId}
            seleccionado={seleccionados.has(usuario.id)}
            onSeleccionar={() => alternarSeleccion(usuario.id)}
          />
        ))}
      </ul>
    </div>
  );
}
