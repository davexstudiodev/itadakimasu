import Image from "next/image";
import type { ReactNode } from "react";

/** Tarjeta centrada para páginas de autenticación. */
export function CardAuth({
  titulo,
  subtitulo,
  textoJp,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  textoJp?: string;
  children: ReactNode;
}) {
  return (
    <div className="contenedor flex min-h-[68vh] items-center justify-center py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Image src="/logo.png" alt="ITADAKIMASU" width={72} height={72} className="mx-auto rounded-2xl" priority />
          {textoJp && <p className="texto-jp mt-3 text-sm text-tomate">{textoJp}</p>}
          <h1 className="mt-1 font-display text-2xl font-black tracking-tight text-marron sm:text-3xl">
            {titulo}
          </h1>
          {subtitulo && <p className="mt-1.5 text-sm text-marron/65">{subtitulo}</p>}
        </div>

        <div className="rounded-card border border-beige-dark/60 bg-white p-6 shadow-card sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
