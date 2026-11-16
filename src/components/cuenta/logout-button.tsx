"use client";

import { cerrarSesion } from "@/server/actions/auth";
import { LogOut } from "lucide-react";

/** Cierra la sesión (server action sin args). */
export function LogoutButton() {
  return (
    <form action={cerrarSesion}>
      <button type="submit" className="btn-outline px-5 py-2.5">
        <LogOut className="h-4 w-4" aria-hidden />
        Cerrar sesión
      </button>
    </form>
  );
}
