"use client";

import { useState, useTransition } from "react";
import { UserCheck, UserX, LoaderCircle, Trash2 } from "lucide-react";
import { alternarUsuario, cambiarRolUsuario, eliminarClientes } from "@/server/actions/admin/usuarios";
import { ConfirmarAccion } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toaster";
import type { Perfil } from "@/types";
import { cn } from "@/lib/utils/cn";

/* Fila de usuario: activar/desactivar cuenta y cambiar rol. */
export function FilaUsuario({
  usuario,
  esYo,
  seleccionado,
  onSeleccionar,
}: {
  usuario: Perfil;
  esYo: boolean;
  seleccionado: boolean;
  onSeleccionar: () => void;
}) {
  const [pendiente, startTransition] = useTransition();
  const [rolSel, setRolSel] = useState(usuario.rol);
  const eliminada = usuario.email.endsWith(".invalid");
  const seleccionable = usuario.rol === "customer" && !esYo && !eliminada;

  const ejecutar = (fn: () => Promise<{ ok: boolean; error?: string; datos?: Record<string, unknown> }>) => {
    startTransition(async () => {
      try {
        const r = await fn();
        if (r.ok) toast.success((r.datos?.mensaje as string) ?? "Actualizado");
        else {
          toast.error(r.error ?? "No se pudo actualizar");
          setRolSel(usuario.rol);
        }
      } catch {
        toast.error("Error inesperado");
        setRolSel(usuario.rol);
      }
    });
  };

  const cambiarRol = (rol: string) => {
    setRolSel(rol as Perfil["rol"]);
    ejecutar(() => cambiarRolUsuario(usuario.id, rol));
  };

  const borrar = async () => {
    const r = await eliminarClientes([usuario.id]);
    if (r.ok) toast.success(r.datos?.mensaje as string);
    return r;
  };

  return (
    <li className="grid gap-3 px-4 py-3.5 lg:grid-cols-[1fr_170px_140px_140px_180px] lg:items-center">
      {/* Cliente */}
      <div className="flex min-w-0 items-start gap-3">
        {seleccionable ? (
          <input
            type="checkbox"
            checked={seleccionado}
            onChange={onSeleccionar}
            aria-label={`Seleccionar cliente ${usuario.email}`}
            className="mt-1 h-4 w-4 shrink-0 accent-tomate"
          />
        ) : (
          <span className="h-4 w-4 shrink-0" aria-hidden />
        )}
        <span className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-marron">
          {usuario.nombre} {usuario.apellidos}
          {esYo && (
            <span className="rounded-full bg-tomate/10 px-2 py-0.5 text-[10px] font-bold uppercase text-tomate">
              Tú
            </span>
          )}
          {eliminada && (
            <span className="rounded-full bg-beige-dark/50 px-2 py-0.5 text-[10px] font-bold uppercase text-marron/60">
              Eliminada
            </span>
          )}
          {usuario.rol === "admin" && !esYo && (
            <span className="rounded-full bg-naranja/15 px-2 py-0.5 text-[10px] font-bold uppercase text-naranja-dark">
              Admin
            </span>
          )}
          </p>
          <p className="truncate text-xs text-marron/55">{usuario.email}</p>
        </span>
      </div>

      {/* Teléfono */}
      <span className="text-sm text-marron/70">{usuario.telefono ?? "—"}</span>

      {/* Rol */}
      <select
        value={rolSel}
        onChange={(e) => cambiarRol(e.target.value)}
        disabled={esYo || eliminada || pendiente}
        aria-label={`Rol de ${usuario.email}`}
        className={cn(
          "campo appearance-none py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:bg-beige/50 disabled:text-marron/50",
          rolSel === "admin" ? "text-naranja-dark" : "text-marron"
        )}
      >
        <option value="customer">Cliente</option>
        <option value="admin">Admin</option>
      </select>

      {/* Estado */}
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
          usuario.activo ? "bg-hojita/15 text-hojita" : "bg-tomate/10 text-tomate"
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
        {eliminada ? "Eliminada" : usuario.activo ? "Activa" : "Desactivada"}
      </span>

      {/* Acciones */}
      <div className="flex justify-start gap-2 lg:justify-end">
        <button
          type="button"
          disabled={esYo || eliminada || pendiente}
          onClick={() => ejecutar(() => alternarUsuario(usuario.id, !usuario.activo))}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
            usuario.activo
              ? "border-tomate/25 text-tomate hover:bg-tomate/10"
              : "border-hojita/40 text-hojita hover:bg-hojita/10",
            (esYo || eliminada) && "cursor-not-allowed opacity-40"
          )}
          title={esYo ? "No puedes desactivarte a ti mismo" : eliminada ? "Cuenta eliminada" : undefined}
        >
          {pendiente ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : usuario.activo ? (
            <UserX className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <UserCheck className="h-3.5 w-3.5" aria-hidden />
          )}
          {eliminada ? "Inhabilitada" : usuario.activo ? "Desactivar" : "Activar"}
        </button>
        {seleccionable && (
          <ConfirmarAccion
            titulo="Eliminar cuenta de cliente"
            descripcion={`Se inhabilitará y anonimizará la cuenta de ${usuario.nombre} ${usuario.apellidos}. Se conservarán sus pedidos cerrados sin datos personales; si tiene pedidos en curso, la operación se rechazará.`}
            textoConfirmar="Eliminar cuenta"
            onConfirmar={borrar}
          >
            <button
              type="button"
              disabled={pendiente}
              className="flex items-center gap-1.5 rounded-full border border-tomate/25 px-3.5 py-1.5 text-xs font-semibold text-tomate transition-colors hover:bg-tomate/10 disabled:opacity-50"
              aria-label={`Eliminar cuenta de ${usuario.nombre} ${usuario.apellidos}`}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden /> Eliminar
            </button>
          </ConfirmarAccion>
        )}
      </div>
    </li>
  );
}
