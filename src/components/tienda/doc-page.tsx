import type { ReactNode } from "react";

/* ============================================================
   Plantilla para páginas de contenido (legales, ayuda, info).
   ============================================================ */

export function DocPage({
  titulo,
  subtitulo,
  textoJp,
  actualizado,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  textoJp?: string;
  actualizado?: string;
  children: ReactNode;
}) {
  return (
    <div className="contenedor max-w-3xl py-10 sm:py-14">
      {textoJp && <p className="texto-jp text-sm text-tomate">{textoJp}</p>}
      <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-marron sm:text-4xl">
        {titulo}
      </h1>
      {subtitulo && <p className="mt-2 text-base text-marron/65">{subtitulo}</p>}
      {actualizado && (
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-marron/45">
          Actualizado: {actualizado}
        </p>
      )}
      <div className="mt-8 space-y-7">{children}</div>
    </div>
  );
}

export function DocSeccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-card border border-beige-dark/60 bg-white p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold text-marron sm:text-xl">{titulo}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-marron/75">{children}</div>
    </section>
  );
}

export function DocParrafo({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}

export function DocLista({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-tomate" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
