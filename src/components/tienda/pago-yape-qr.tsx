"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { formatPEN } from "@/lib/utils/format";
import { siteConfig } from "@/lib/config/site";

export function PagoYapeQR({ numeroPedido, total }: { numeroPedido: string; total: number }) {
  const [abierto, setAbierto] = useState(true);

  useEffect(() => {
    if (!abierto) return;
    const cerrarConEscape = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAbierto(false);
    };
    window.addEventListener("keydown", cerrarConEscape);
    return () => window.removeEventListener("keydown", cerrarConEscape);
  }, [abierto]);

  const mensaje = `Hola, adjunto el comprobante de pago Yape del pedido #${numeroPedido} por ${formatPEN(total)}.`;
  const whatsapp = `${siteConfig.redes.whatsapp}?text=${encodeURIComponent(mensaje)}`;

  return (
    <>
      {!abierto && (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="mt-3 inline-flex items-center justify-center rounded-full bg-[#780699] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#62057d]"
        >
          Ver QR de Yape y pagar {formatPEN(total)}
        </button>
      )}

      {abierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`QR de Yape para el pedido ${numeroPedido}`}
          className="fixed inset-0 z-[100] flex min-h-[100dvh] flex-col items-center bg-black/95 px-4 py-4 text-white"
        >
          <button
            type="button"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar QR de Yape"
            className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-3 pt-10">
            <p className="text-center text-sm font-semibold text-white/80">
              Pedido #{numeroPedido} · Transfiere exactamente {formatPEN(total)}
            </p>
            <div className="relative min-h-0 w-full max-w-[min(92vw,520px)] flex-1 overflow-hidden rounded-xl bg-white">
              <Image
                src="/pagos/yape-qr.jpg"
                alt="Código QR de Yape para realizar el pago"
                fill
                sizes="(max-width: 560px) 92vw, 520px"
                priority
                className="object-contain"
              />
            </div>
            <p className="text-center text-xs text-white/70">
              Escanea el código desde Yape. El pedido queda pendiente hasta verificar el comprobante.
            </p>
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full max-w-[520px] items-center justify-center gap-2 rounded-full bg-[#780699] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#62057d]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Enviar comprobante por WhatsApp
            </a>
          </div>
        </div>
      )}
    </>
  );
}
