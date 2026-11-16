import type { Metadata } from "next";
import { Search, Users } from "lucide-react";
import { getProvider } from "@/lib/data";
import { getUsuarioActual } from "@/lib/auth";
import { FilaUsuario } from "@/components/admin/fila-usuario";
import { EstadoVacio } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Usuarios" };

interface Props {
  searchParams: Promise<{ q?: string }>;
}

function uno(v: string | string[] | undefined): string | undefined {
  const valor = Array.isArray(v) ? v[0] : v;
  return valor && valor.trim() !== "" ? valor.trim() : undefined;
}

export default async function PaginaUsuarios({ searchParams }: Props) {
  const sp = await searchParams;
  const q = uno(sp.q);

  const [usuarios, yo] = await Promise.all([
    getProvider().listarUsuarios(q),
    getUsuarioActual(),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="texto-jp text-sm text-tomate">ユーザー管理</p>
          <h1 className="mt-1 font-display text-2xl font-black tracking-tight text-marron sm:text-3xl">
            Usuarios
          </h1>
          <p className="mt-1 text-sm text-marron/60">
            {usuarios.length} cuenta{usuarios.length === 1 ? "" : "s"}
          </p>
        </div>

        <form method="get" action="/admin/usuarios" className="flex gap-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-marron/40"
              aria-hidden
            />
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Nombre o correo…"
              aria-label="Buscar usuarios"
              className="campo w-56 pl-9"
            />
          </div>
          <button type="submit" className="btn-outline px-4 py-2.5 text-sm">
            Buscar
          </button>
        </form>
      </div>

      {usuarios.length === 0 ? (
        <EstadoVacio
          icono={Users}
          titulo="Sin resultados"
          descripcion={q ? `Ninguna cuenta coincide con «${q}».` : "Aún no hay usuarios registrados."}
          accion={q ? { texto: "Ver todos", href: "/admin/usuarios" } : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-card border border-beige-dark/60 bg-white shadow-card">
          <div className="hidden gap-4 border-b border-beige-dark/60 bg-crema/70 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-marron/60 lg:grid lg:grid-cols-[1fr_170px_140px_140px_180px]">
            <span>Cliente</span>
            <span>Teléfono</span>
            <span>Rol</span>
            <span>Estado</span>
            <span className="text-right">Acciones</span>
          </div>
          <ul className="divide-y divide-beige-dark/60">
            {usuarios.map((u) => (
              <FilaUsuario key={u.id} usuario={u} esYo={u.id === yo?.id} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
