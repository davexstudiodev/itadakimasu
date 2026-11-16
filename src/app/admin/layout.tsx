import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { exigirAdmin } from "@/lib/auth";
import { NavAdmin } from "@/components/admin/nav-admin";
import { cerrarSesion } from "@/server/actions/auth";

export const metadata: Metadata = {
  title: { default: "Panel admin — ITADAKIMASU", template: "%s · Admin ITADAKIMASU" },
  description: "Panel de administración de ITADAKIMASU.",
  robots: { index: false, follow: false },
};

/* Panel de administración independiente de la tienda:
   exige rol admin (verificado en servidor) en cada navegación. */
export default async function LayoutAdmin({ children }: { children: ReactNode }) {
  const admin = await exigirAdmin();

  return (
    <div className="min-h-screen bg-crema">
      <div className="lg:flex">
        {/* Barra lateral (fijo en escritorio, superior en móvil) */}
        <aside className="flex flex-col bg-marron text-crema lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0">
          <div className="flex items-center gap-3 border-b border-crema/10 px-5 py-4 lg:py-6">
            <Image src="/logo.png" alt="" width={40} height={40} className="rounded-xl" priority />
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-black tracking-wide">
                ITADAKIMASU
              </p>
              <p className="texto-jp text-[11px] text-crema/60">管理パネル</p>
            </div>
            <Link
              href="/"
              className="ml-auto rounded-lg p-2 text-crema/70 transition-colors hover:bg-crema/10 hover:text-crema lg:hidden"
              aria-label="Ver la tienda"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <NavAdmin />

          {/* Usuario (solo escritorio) */}
          <div className="mt-auto hidden border-t border-crema/10 px-5 py-5 lg:block">
            <p className="truncate text-xs font-semibold text-crema">{admin.email}</p>
            <p className="text-[11px] text-crema/55">Rol: Administrador</p>
            <div className="mt-3 flex flex-col gap-2">
              <form action={cerrarSesion}>
                <button
                  type="submit"
                  className="w-full rounded-full border border-crema/25 px-4 py-2 text-xs font-semibold text-crema transition-colors hover:bg-crema/10"
                >
                  Cerrar sesión
                </button>
              </form>
              <Link
                href="/"
                className="flex items-center justify-center gap-1.5 rounded-full bg-tomate px-4 py-2 text-xs font-bold text-crema transition-colors hover:bg-tomate-dark"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Ver la tienda
              </Link>
            </div>
          </div>
        </aside>

        {/* Contenido */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
