"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Receipt,
  Ticket,
  Users,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const ITEMS: { href: string; texto: string; icono: LucideIcon }[] = [
  { href: "/admin", texto: "Dashboard", icono: LayoutDashboard },
  { href: "/admin/productos", texto: "Productos", icono: Package },
  { href: "/admin/anuncios", texto: "Anuncios IA", icono: Sparkles },
  { href: "/admin/inventario", texto: "Inventario", icono: Boxes },
  { href: "/admin/pedidos", texto: "Pedidos", icono: Receipt },
  { href: "/admin/cupones", texto: "Cupones", icono: Ticket },
  { href: "/admin/usuarios", texto: "Usuarios", icono: Users },
  { href: "/admin/configuracion", texto: "Configuración", icono: Settings },
];

/** Navegación del panel admin (activa según la ruta). */
export function NavAdmin() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Panel de administración"
      className="flex gap-1 overflow-x-auto px-3 py-3 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:px-3 lg:py-4"
    >
      {ITEMS.map(({ href, texto, icono: Icono }) => {
        // /admin y /admin/productos no deben confundirse en el activo
        const activo =
          href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
              activo
                ? "bg-tomate text-crema shadow-[0_10px_20px_-14px_rgba(217,75,56,1)]"
                : "text-crema/75 hover:bg-crema/10 hover:text-crema"
            )}
          >
            <Icono className="h-4 w-4" aria-hidden />
            <span className="whitespace-nowrap">{texto}</span>
          </Link>
        );
      })}
    </nav>
  );
}
