import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Receipt, Heart, MapPin, ChevronRight } from "lucide-react";
import { getUsuarioActual } from "@/lib/auth";
import { formatFechaCorta } from "@/lib/utils/format";
import { FormPerfil } from "@/components/cuenta/form-perfil";
import { FormPassword } from "@/components/cuenta/form-password";

export const metadata: Metadata = {
  title: "Mi cuenta — ITADAKIMASU",
  description: "Gestiona tus datos personales, contraseña y accesos rápidos.",
};

export default async function PaginaCuenta() {
  const usuario = await getUsuarioActual();
  if (!usuario) return null;

  const accesos = [
    { href: "/cuenta/pedidos", texto: "Mis pedidos", detalle: "Estado y seguimiento", icono: Receipt },
    { href: "/cuenta/favoritos", texto: "Mis favoritos", detalle: "Lo que guardaste", icono: Heart },
    { href: "/cuenta/direcciones", texto: "Mis direcciones", detalle: "Dónde entregamos", icono: MapPin },
  ];

  return (
    <div className="space-y-6">
      {/* Accesos rápidos */}
      <div className="grid gap-3 sm:grid-cols-3">
        {accesos.map(({ href, texto, detalle, icono: Icono }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-card border border-beige-dark/60 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-tomate/40 hover:shadow-card"
          >
            <Icono className="h-5 w-5 text-tomate" aria-hidden />
            <p className="mt-2 flex items-center gap-1 text-sm font-bold text-marron">
              {texto}
              <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
            </p>
            <p className="text-xs text-marron/55">{detalle}</p>
          </Link>
        ))}
      </div>

      {/* Datos */}
      <section className="rounded-card border border-beige-dark/60 bg-white p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-marron">Mis datos</h2>
        <div className="mt-4">
          <FormPerfil perfil={usuario} />
        </div>
      </section>

      {/* Contraseña */}
      <section className="rounded-card border border-beige-dark/60 bg-white p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-marron">Cambiar contraseña</h2>
        <div className="mt-4">
          <FormPassword />
        </div>
      </section>

      {/* Cuenta */}
      <section className="rounded-card border border-beige-dark/60 bg-crema p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-marron">
          <ShieldCheck className="h-5 w-5 text-tomate" aria-hidden />
          Tu cuenta
        </h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-marron/50">Rol</dt>
            <dd className="mt-0.5 font-semibold capitalize text-marron">
              {usuario.rol === "admin" ? "Administrador" : "Cliente"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-marron/50">Correo</dt>
            <dd className="mt-0.5 font-semibold text-marron">{usuario.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-marron/50">Miembro desde</dt>
            <dd className="mt-0.5 font-semibold text-marron">{formatFechaCorta(usuario.creadoEn)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
