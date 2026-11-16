import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Props {
  titulo: string;
  subtitulo?: string;
  textoJp?: string;
  icono?: LucideIcon;
  hrefVer?: string;
  textoVer?: string;
}

export function SectionHeader({
  titulo,
  subtitulo,
  textoJp,
  icono: Icono,
  hrefVer,
  textoVer = "Ver todo",
}: Props) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-7">
      <div>
        <div className="flex items-center gap-2.5">
          {Icono && (
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-tomate/10 text-tomate">
              <Icono className="h-4.5 w-4.5" aria-hidden />
            </span>
          )}
          <div>
            {textoJp && (
              <p className="texto-jp text-xs font-bold tracking-wider text-tomate">{textoJp}</p>
            )}
            <h2 className="titulo-seccion">{titulo}</h2>
          </div>
        </div>
        {subtitulo && <p className="mt-1.5 max-w-xl text-sm text-marron/60">{subtitulo}</p>}
      </div>
      {hrefVer && (
        <Link
          href={hrefVer}
          className="group inline-flex items-center gap-1.5 rounded-full border border-beige-dark bg-white px-4 py-2 text-sm font-semibold text-marron transition-colors hover:border-tomate hover:text-tomate"
        >
          {textoVer}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}
