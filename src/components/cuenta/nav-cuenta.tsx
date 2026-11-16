"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Receipt, Heart, MapPin, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const ITEMS: { href: string; texto: string; icono: LucideIcon }[] = [
  { href: "/cuenta", texto: "Resumen", icono: User },
  { href: "/cuenta/pedidos", texto: "Pedidos", icono: Receipt },
  { href: "/cuenta/favoritos", texto: "Favoritos", icono: Heart },
  { href: "/cuenta/direcciones", texto: "Direcciones", icono: MapPin },
];

/** Navegación lateral de la cuenta (activa según la ruta). */
export function NavCuenta() {
  const pathname = usePathname();

  return (
    <nav aria-label="Menú de cuenta" className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
      {ITEMS.map(({ href, texto, icono: Icono }) => {
        const activo = href === "/cuenta" ? pathname === "/cuenta" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
              activo ? "bg-tomate text-crema shadow-[0_8px_18px_-12px_rgba(217,75,56,0.9)]" : "text-marron hover:bg-beige"
            )}
          >
            <Icono className="h-4 w-4" aria-hidden />
            {texto}
          </Link>
        );
      })}
    </nav>
  );
}
