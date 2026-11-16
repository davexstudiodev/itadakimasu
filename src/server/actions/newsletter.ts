"use server";

import { headers } from "next/headers";
import { getProvider } from "@/lib/data";
import { limitar } from "@/lib/rate-limit";
import { esquemaNewsletter } from "@/server/validations";
import type { ResultadoAccion } from "@/types";

export async function suscribirNewsletter(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const email = String(formData.get("email") ?? "");
  const cabeceras = await headers();
  const ip =
    cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  if (!limitar(`newsletter:${ip}`, 5)) {
    return { ok: false, error: "Demasiados intentos. Intenta más tarde." };
  }

  const parseado = esquemaNewsletter.safeParse({ email });
  if (!parseado.success) return { ok: false, campo: "email", error: "Correo inválido" };

  const resultado = await getProvider().suscribir(parseado.data.email);
  if (!resultado.ok) return { ok: false, error: resultado.error };

  return {
    ok: true,
    datos: { mensaje: "¡Listo! Te avisaremos de ofertas y novedades." },
  };
}
