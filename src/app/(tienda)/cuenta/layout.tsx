import type { ReactNode } from "react";
import { exigirUsuario } from "@/lib/auth";
import { NavCuenta } from "@/components/cuenta/nav-cuenta";
import { LogoutButton } from "@/components/cuenta/logout-button";

export default async function LayoutCuenta({ children }: { children: ReactNode }) {
  const usuario = await exigirUsuario("/cuenta");

  return (
    <div className="contenedor py-6 sm:py-12">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="texto-jp text-sm text-tomate">マイアカウント</p>
          <h1 className="mt-1 break-words font-display text-2xl font-black tracking-tight text-marron sm:text-3xl">
            Hola, {usuario.nombre}
          </h1>
          <p className="mt-1 break-all text-sm text-marron/60">{usuario.email}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-6">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <NavCuenta />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
