import type { Metadata } from "next";
import { getProvider } from "@/lib/data";
import { FormConfiguracion } from "@/components/admin/form-configuracion";

export const metadata: Metadata = { title: "Configuración" };

export default async function PaginaConfiguracion() {
  const cfg = await getProvider().getConfiguracion();

  return (
    <div className="space-y-5">
      <div>
        <p className="texto-jp text-sm text-tomate">店舗設定</p>
        <h1 className="mt-1 font-display text-2xl font-black tracking-tight text-marron sm:text-3xl">
          Configuración
        </h1>
        <p className="mt-1 text-sm text-marron/60">
          Datos de contacto, envíos, medios de pago y mensajes de la tienda.
        </p>
      </div>
      <FormConfiguracion cfg={cfg} />
    </div>
  );
}
