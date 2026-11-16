"use client";

import { Copy, Check, Ticket } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/toaster";
import Link from "next/link";

interface Props {
  codigo: string;
  titulo: string;
  texto: string;
}

export function PromoBanner({ codigo, titulo, texto }: Props) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      toast.success(`Cupón ${codigo} copiado`);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      toast.error("No se pudo copiar el cupón");
    }
  };

  return (
    <section className="contenedor">
      <div className="grid overflow-hidden rounded-card border border-tomate/20 bg-gradient-to-r from-tomate to-tomate-dark text-crema lg:grid-cols-[1.3fr_1fr]">
        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          <div aria-hidden className="patron-olas absolute inset-0 opacity-25" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-crema/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
              <Ticket className="h-3.5 w-3.5" aria-hidden /> Promoción
            </span>
            <h2 className="texto-marca mt-3 text-2xl font-black sm:text-3xl">{titulo}</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-crema/85 sm:text-base">
              {texto}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 bg-marron/25 px-4 py-8 text-center sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-crema/70">
            Tu código de descuento
          </p>
          <div className="flex w-full max-w-full items-center gap-2 rounded-2xl border-2 border-dashed border-crema/50 bg-crema/10 px-3 py-3 sm:gap-3 sm:px-6">
            <span className="texto-marca whitespace-nowrap text-xl font-black tracking-wide sm:text-2xl sm:tracking-widest">
              {codigo}
            </span>
            <button
              type="button"
              onClick={copiar}
              aria-label={`Copiar cupón ${codigo}`}
              className="grid h-10 w-10 place-items-center rounded-full bg-crema text-tomate transition-transform hover:scale-110 sm:h-9 sm:w-9"
            >
              {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <Link
            href="/productos?ofertas=1"
            className="btn bg-crema px-6 py-2.5 text-marron transition-colors hover:bg-white"
          >
            Ver ofertas
          </Link>
        </div>
      </div>
    </section>
  );
}
