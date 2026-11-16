import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, Home, User, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Acceso denegado — ITADAKIMASU",
  robots: { index: false },
};

export default function PaginaAccesoDenegado() {
  return (
    <div className="contenedor flex min-h-[70vh] items-center justify-center py-12">
      <div className="max-w-md text-center">
        <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-tomate/10">
          <ShieldAlert className="h-8 w-8 text-tomate" aria-hidden />
        </span>
        <p className="texto-jp mt-4 text-sm text-tomate">アクセス拒否</p>
        <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-marron">
          No tienes acceso
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-marron/70">
          Esta sección es solo para cuentas de administrador. Si crees que es un error, verifica que hayas iniciado
          sesión con tu cuenta correcta o contáctanos.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="btn-primary px-6 py-3">
            <Home className="h-4 w-4" aria-hidden /> Volver al inicio
          </Link>
          <Link href="/cuenta" className="btn-outline px-6 py-3">
            <User className="h-4 w-4" aria-hidden /> Mi cuenta
          </Link>
          <Link href="/contacto" className="btn-ghost px-6 py-3">
            <Mail className="h-4 w-4" aria-hidden /> Contactar
          </Link>
        </div>
      </div>
    </div>
  );
}
