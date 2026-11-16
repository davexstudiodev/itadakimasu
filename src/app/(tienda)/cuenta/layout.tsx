import type { ReactNode } from "react";
import { exigirUsuario } from "@/lib/auth";
import { NavCuenta } from "@/components/cuenta/nav-cuenta";
import { LogoutButton } from "@/components/cuenta/logout-button";

export default async function LayoutCuenta({ children }: { children: ReactNode }) {
  const usuario = await exigirUsuario("/cuenta");

  return (
    <div className="contenedor py-8 sm:py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="texto-jp text-sm text-tomate">マイアカウント</p>
          <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-marron">
            Hola, {usuario.nombre}
          </h1>
          <p className="mt-1 text-sm text-marron/60">{usuario.email}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <NavCuenta />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
