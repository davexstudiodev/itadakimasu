"use server";

import { revalidatePath } from "next/cache";
import { getProvider } from "@/lib/data";
import { esquemaConfiguracion } from "@/server/validations";
import type { ResultadoAccion } from "@/types";
import { exigirAdminAccion, errorDeZod, numero, casilla } from "./comun";

/* ============================================================
   Configuración global de la tienda (solo admin).
   ============================================================ */

export async function guardarConfiguracion(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const auth = await exigirAdminAccion();
  if ("resultado" in auth) return auth.resultado;

  const parseado = esquemaConfiguracion.safeParse({
    nombre: String(formData.get("nombre") ?? ""),
    lema: String(formData.get("lema") ?? ""),
    telefono: String(formData.get("telefono") ?? ""),
    correo: String(formData.get("correo") ?? ""),
    direccion: String(formData.get("direccion") ?? ""),
    horario: String(formData.get("horario") ?? ""),
    instagram: String(formData.get("instagram") ?? ""),
    tiktok: String(formData.get("tiktok") ?? ""),
    facebook: String(formData.get("facebook") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
    envioCostoLocal: numero(formData, "envioCostoLocal"),
    envioGratisDesde: numero(formData, "envioGratisDesde"),
    recojoGratuito: casilla(formData, "recojoGratuito"),
    autollenarUbicacionCheckout: casilla(formData, "autollenarUbicacionCheckout"),
    mensajeBoasvindas: String(formData.get("mensajeBoasvindas") ?? ""),
    pagoYape: casilla(formData, "pagoYape"),
    pagoPlin: casilla(formData, "pagoPlin"),
    pagoTransferencia: casilla(formData, "pagoTransferencia"),
    pagoContraEntrega: casilla(formData, "pagoContraEntrega"),
    pagoPasarela: casilla(formData, "pagoPasarela"),
  });
  if (!parseado.success) return errorDeZod(parseado.error.issues);

  const d = parseado.data;
  if (!d.pagoYape && !d.pagoPlin && !d.pagoTransferencia && !d.pagoContraEntrega && !d.pagoPasarela)
    return {
      ok: false,
      campo: "pagoYape",
      error: "Debe haber al menos un medio de pago activo",
    };

  const provider = getProvider();
  const cfg = await provider.guardarConfiguracion({
    nombre: d.nombre,
    lema: d.lema,
    telefono: d.telefono,
    correo: d.correo,
    direccion: d.direccion,
    horario: d.horario,
    redes: {
      instagram: d.instagram || undefined,
      tiktok: d.tiktok || undefined,
      facebook: d.facebook || undefined,
      whatsapp: d.whatsapp || undefined,
    },
    envioCostoLocal: d.envioCostoLocal,
    envioGratisDesde: d.envioGratisDesde,
    recojoGratuito: d.recojoGratuito,
    autollenarUbicacionCheckout: d.autollenarUbicacionCheckout,
    metodosPago: {
      yape: d.pagoYape,
      plin: d.pagoPlin,
      transferencia: d.pagoTransferencia,
      contraEntrega: d.pagoContraEntrega,
      pasarela: d.pagoPasarela,
    },
    mensajeBoasvindas: d.mensajeBoasvindas,
  });

  await provider.registrarAuditoria({
    actor: auth.admin.email,
    accion: "configuracion",
    detalle: "Actualizó la configuración de la tienda",
  });

  revalidatePath("/admin/configuracion");
  revalidatePath("/", "layout");
  return { ok: true, datos: { mensaje: `Configuración guardada (${cfg.nombre})` } };
}
