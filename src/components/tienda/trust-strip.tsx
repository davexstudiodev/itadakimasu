import { Truck, ShieldCheck, RotateCcw, Headphones } from "lucide-react";

const garantias = [
  {
    icono: Truck,
    titulo: "Delivery local",
    texto: "Puerto Malabrigo y alrededores · 24–48 h",
  },
  {
    icono: ShieldCheck,
    titulo: "Pago seguro",
    texto: "Yape al instante · confirmación rápida",
  },
  {
    icono: RotateCcw,
    titulo: "Devoluciones",
    texto: "Hasta 7 días si algo llega dañado",
  },
  {
    icono: Headphones,
    titulo: "Atención cercana",
    texto: "Soporte por WhatsApp y correo",
  },
];

export function TrustStrip() {
  return (
    <section aria-label="Beneficios de la tienda" className="border-y border-beige-dark bg-white/70">
      <div className="contenedor grid grid-cols-1 gap-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
        {garantias.map(({ icono: Icono, titulo, texto }) => (
          <div key={titulo} className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-tomate/10 text-tomate">
              <Icono className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-marron">{titulo}</p>
              <p className="text-xs leading-snug text-marron/60">{texto}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
