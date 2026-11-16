"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { getProvider } from "@/lib/data";
import { authSupabaseActivo } from "@/lib/auth/modo";
import { crearClienteSoloLectura, crearClienteSupabase } from "@/lib/auth/supabase";
import { crearSesion, destruirSesion, obtenerUsuarioId } from "@/lib/auth/session";
import { hashPassword, verificarPassword } from "@/lib/data/local/db";
import { limitar } from "@/lib/rate-limit";
import {
  esquemaCambiarPassword,
  esquemaLogin,
  esquemaPasswordNueva,
  esquemaPerfil,
  esquemaRecuperar,
  esquemaRegistro,
  esquemaRestablecer,
} from "@/server/validations";
import type { ResultadoAccion } from "@/types";

/* ============================================================
   Acciones de autenticación.
   Dos modos (AUTH_MODE):
   - "local":   scrypt + cookie firmada HMAC (demo / desarrollo).
   - "supabase": Supabase Auth con cookies @supabase/ssr (producción).
   En ambos casos la validación y el rol SIEMPRE son de servidor.
   ============================================================ */

async function ipCliente(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "local";
}

function error(campo: string, mensaje: string): ResultadoAccion {
  return { ok: false, campo, error: mensaje };
}

/** Traduce mensajes de Supabase a los textos de la tienda. */
function traducirErrorSupabase(mensaje: string): string {
  const m = mensaje.toLowerCase();
  if (m.includes("already") || m.includes("registered")) return "Este correo ya está registrado";
  if (m.includes("rate limit") || m.includes("rate_limit"))
    return "Demasiados intentos. Espera un minuto.";
  if (m.includes("password")) return "La contraseña no cumple los requisitos";
  return "No se pudo completar la operación. Intenta de nuevo.";
}

/* ---------------- Registro ---------------- */

export async function registrar(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const ip = await ipCliente();
  if (!limitar(`registro:${ip}`, 5)) {
    return error("", "Demasiados intentos. Espera un minuto.");
  }

  const datos = {
    nombre: String(formData.get("nombre") ?? ""),
    apellidos: String(formData.get("apellidos") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmar: String(formData.get("confirmar") ?? ""),
    aceptaTerminos: formData.get("aceptaTerminos") === "on",
  };

  const parseado = esquemaRegistro.safeParse(datos);
  if (!parseado.success) {
    const problema = parseado.error.issues[0];
    return error(String(problema.path[0] ?? ""), problema.message);
  }

  const provider = getProvider();

  /* ---- Modo Supabase Auth ---- */
  if (authSupabaseActivo()) {
    const supabase = await crearClienteSupabase();
    const { data, error: fallo } = await supabase.auth.signUp({
      email: parseado.data.email,
      password: parseado.data.password,
      options: {
        data: { nombre: parseado.data.nombre, apellidos: parseado.data.apellidos },
      },
    });

    if (fallo) return error("", traducirErrorSupabase(fallo.message));

    if (!data.session || !data.user) {
      // Confirmación de correo pendiente: el perfil se crea en el primer acceso.
      return {
        ok: true,
        datos: { mensaje: "Revisa tu correo y confirma tu cuenta para continuar." },
      };
    }

    try {
      const existente = await provider.getPerfilPorEmail(parseado.data.email);
      if (!existente) {
        await provider.crearPerfil({
          id: data.user.id,
          email: parseado.data.email,
          nombre: parseado.data.nombre,
          apellidos: parseado.data.apellidos,
        });
      }
      await provider.registrarAuditoria({
        actor: parseado.data.email,
        accion: "registro",
        detalle: "Nueva cuenta creada",
      });
    } catch (e) {
      // La cuenta en Supabase ya existe; el perfil se reconcilia en el primer login.
      console.error("[ITADAKIMASU] No se pudo crear el perfil tras el registro:", e);
    }

    return { ok: true };
  }

  /* ---- Modo local (scrypt + cookie) ---- */
  const existente = await provider.getPerfilPorEmail(parseado.data.email);
  if (existente) return error("email", "Este correo ya está registrado");

  const id = `usr-${randomBytes(8).toString("hex")}`;
  try {
    await provider.crearPerfil({
      id,
      email: parseado.data.email,
      nombre: parseado.data.nombre,
      apellidos: parseado.data.apellidos,
    });
    await provider.guardarPasswordHash(id, await hashPassword(parseado.data.password));
    await provider.registrarAuditoria({
      actor: parseado.data.email,
      accion: "registro",
      detalle: "Nueva cuenta creada",
    });
  } catch (e) {
    return error("", (e as Error).message ?? "No se pudo crear la cuenta");
  }

  await crearSesion(id);
  return { ok: true };
}

/* ---------------- Inicio de sesión ---------------- */

export async function iniciarSesion(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const ip = await ipCliente();
  if (!limitar(`login:${ip}`, 8)) {
    return error("", "Demasiados intentos. Espera un minuto.");
  }

  const parseado = esquemaLogin.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parseado.success) {
    const problema = parseado.error.issues[0];
    return error(String(problema.path[0] ?? ""), problema.message);
  }

  const provider = getProvider();

  /* ---- Modo Supabase Auth ---- */
  if (authSupabaseActivo()) {
    const supabase = await crearClienteSupabase();
    const { data, error: fallo } = await supabase.auth.signInWithPassword({
      email: parseado.data.email,
      password: parseado.data.password,
    });
    if (fallo || !data.user) return error("", "Correo o contraseña incorrectos");

    let perfil = await provider.getPerfilPorEmail(parseado.data.email);
    if (!perfil) {
      const meta = (data.user.user_metadata ?? {}) as Record<string, string>;
      try {
        perfil = await provider.crearPerfil({
          id: data.user.id,
          email: parseado.data.email,
          nombre: meta.nombre || parseado.data.email.split("@")[0],
          apellidos: meta.apellidos || "",
          telefono: meta.telefono || undefined,
        });
      } catch (e) {
        console.error("[ITADAKIMASU] No se pudo crear el perfil en el login:", e);
        return error("", "No se pudo cargar tu cuenta. Contacta con soporte.");
      }
    }

    if (!perfil.activo) {
      await supabase.auth.signOut();
      return error("", "Esta cuenta está desactivada. Contacta con soporte.");
    }

    await provider.registrarAuditoria({
      actor: perfil.email,
      accion: "login",
      detalle: "Inicio de sesión",
    });

    const destino = String(formData.get("next") ?? "");
    if (destino.startsWith("/") && !destino.startsWith("//")) redirect(destino);
    return { ok: true };
  }

  /* ---- Modo local ---- */
  const perfil = await provider.getPerfilPorEmail(parseado.data.email);
  if (!perfil) return error("", "Correo o contraseña incorrectos");

  const hash = await provider.getPasswordHash(perfil.id);
  if (!hash || !(await verificarPassword(parseado.data.password, hash))) {
    return error("", "Correo o contraseña incorrectos");
  }
  if (!perfil.activo) {
    return error("", "Esta cuenta está desactivada. Contacta con soporte.");
  }

  await crearSesion(perfil.id);
  await provider.registrarAuditoria({
    actor: perfil.email,
    accion: "login",
    detalle: "Inicio de sesión",
  });

  const destino = String(formData.get("next") ?? "");
  if (destino.startsWith("/") && !destino.startsWith("//")) redirect(destino);
  return { ok: true };
}

/* ---------------- Cierre de sesión ---------------- */

export async function cerrarSesion(): Promise<void> {
  const provider = getProvider();

  if (authSupabaseActivo()) {
    const supabase = await crearClienteSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await provider.registrarAuditoria({
        actor: user.email ?? user.id,
        accion: "logout",
        detalle: "Cierre de sesión",
      });
    }
    await supabase.auth.signOut();
    redirect("/");
  }

  const id = await obtenerUsuarioId();
  if (id) {
    await provider.registrarAuditoria({
      actor: id,
      accion: "logout",
      detalle: "Cierre de sesión",
    });
  }
  await destruirSesion();
  redirect("/");
}

/* ---------------- Perfil ---------------- */

export async function actualizarPerfil(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const { getUsuarioActual } = await import("@/lib/auth");
  const usuario = await getUsuarioActual();
  if (!usuario) return error("", "Tu sesión expiró");

  const parseado = esquemaPerfil.safeParse({
    nombre: String(formData.get("nombre") ?? ""),
    apellidos: String(formData.get("apellidos") ?? ""),
    telefono: String(formData.get("telefono") ?? ""),
  });
  if (!parseado.success) {
    const problema = parseado.error.issues[0];
    return error(String(problema.path[0] ?? ""), problema.message);
  }

  await getProvider().actualizarPerfil(usuario.id, {
    nombre: parseado.data.nombre,
    apellidos: parseado.data.apellidos,
    telefono: parseado.data.telefono ?? null,
  });
  return { ok: true, datos: { mensaje: "Perfil actualizado" } };
}

/* ---------------- Cambiar contraseña ---------------- */

export async function cambiarPassword(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const ip = await ipCliente();
  if (!limitar(`password:${ip}`, 6)) {
    return error("", "Demasiados intentos. Espera un minuto.");
  }
  const { getUsuarioActual } = await import("@/lib/auth");
  const usuario = await getUsuarioActual();
  if (!usuario) return error("", "Tu sesión expiró");

  const parseado = esquemaCambiarPassword.safeParse({
    actual: String(formData.get("actual") ?? ""),
    nueva: String(formData.get("nueva") ?? ""),
    confirmar: String(formData.get("confirmar") ?? ""),
  });
  if (!parseado.success) {
    const problema = parseado.error.issues[0];
    return error(String(problema.path[0] ?? ""), problema.message);
  }

  const provider = getProvider();

  /* ---- Modo Supabase Auth ---- */
  if (authSupabaseActivo()) {
    const supabase = await crearClienteSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return error("", "Tu sesión expiró");

    // Verificar la contraseña actual en un cliente aparte (sin tocar la sesión)
    const soloLectura = await crearClienteSoloLectura();
    const verificacion = await soloLectura.auth.signInWithPassword({
      email: user.email,
      password: parseado.data.actual,
    });
    if (verificacion.error) return error("actual", "La contraseña actual no es correcta");

    const { error: fallo } = await supabase.auth.updateUser({
      password: parseado.data.nueva,
    });
    if (fallo) return error("", "No se pudo actualizar la contraseña. Intenta de nuevo.");

    await provider.registrarAuditoria({
      actor: usuario.email,
      accion: "password",
      detalle: "Contraseña actualizada",
    });
    return { ok: true, datos: { mensaje: "Contraseña actualizada" } };
  }

  /* ---- Modo local ---- */
  const hash = await provider.getPasswordHash(usuario.id);
  if (!hash || !(await verificarPassword(parseado.data.actual, hash))) {
    return error("actual", "La contraseña actual no es correcta");
  }
  await provider.guardarPasswordHash(usuario.id, await hashPassword(parseado.data.nueva));
  await provider.registrarAuditoria({
    actor: usuario.email,
    accion: "password",
    detalle: "Contraseña actualizada",
  });
  return { ok: true, datos: { mensaje: "Contraseña actualizada" } };
}

/* ---------------- Recuperación de contraseña ---------------- */

export async function solicitarRecuperacion(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const ip = await ipCliente();
  if (!limitar(`reset:${ip}`, 4)) {
    return error("", "Demasiados intentos. Espera un minuto.");
  }

  const parseado = esquemaRecuperar.safeParse({
    email: String(formData.get("email") ?? ""),
  });
  if (!parseado.success) return error("email", "Correo inválido");

  /* ---- Modo Supabase Auth: el enlace lo envía Supabase ---- */
  if (authSupabaseActivo()) {
    const supabase = await crearClienteSupabase();
    const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const { error: fallo } = await supabase.auth.resetPasswordForEmail(parseado.data.email, {
      redirectTo: `${sitio}/auth/callback?next=/auth/restablecer`,
    });
    if (fallo) console.error("[ITADAKIMASU] resetPasswordForEmail:", fallo.message);
    // Respuesta genérica: nunca revela si el correo existe
    return { ok: true, datos: { mensaje: "Si el correo existe, te enviaremos un enlace." } };
  }

  /* ---- Modo local ---- */
  const provider = getProvider();
  const perfil = await provider.getPerfilPorEmail(parseado.data.email);
  if (perfil) {
    const token = randomBytes(24).toString("hex");
    const expira = new Date(Date.now() + 30 * 60_000).toISOString();
    await provider.solicitarReset(parseado.data.email, token, expira);

    const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/restablecer?token=${token}`;

    if (process.env.RESEND_API_KEY) {
      // Envío real con Resend (FASE 6)
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM ?? "ITADAKIMASU <no-reply@itadakimasu.pe>",
          to: [parseado.data.email],
          subject: "Restablece tu contraseña — ITADAKIMASU",
          html: `<p>Hola, recibimos una solicitud para restablecer tu contraseña.</p><p><a href="${url}">Haz clic aquí para crear una nueva contraseña</a> (válido 30 minutos).</p>`,
        }),
      }).catch(() => undefined);
      return { ok: true, datos: { mensaje: "Si el correo existe, te enviaremos un enlace." } };
    }

    console.log(`[ITADAKIMASU] Enlace de recuperación (sin proveedor de correo): ${url}`);
    return {
      ok: true,
      datos: {
        mensaje:
          "Si el correo existe, recibirás un enlace. (Modo demo: sin proveedor de correo configurado, el enlace se imprime en la consola del servidor.)",
        aviso: true,
      },
    };
  }
  // Respuesta genérica por seguridad (no revela si el correo existe)
  return { ok: true, datos: { mensaje: "Si el correo existe, te enviaremos un enlace." } };
}

export async function restablecerPassword(
  _prev: ResultadoAccion,
  formData: FormData
): Promise<ResultadoAccion> {
  const ip = await ipCliente();
  if (!limitar(`reset-pw:${ip}`, 6)) {
    return error("", "Demasiados intentos. Espera un minuto.");
  }

  const password = String(formData.get("password") ?? "");
  const confirmar = String(formData.get("confirmar") ?? "");

  /* ---- Modo Supabase Auth: la sesión de recuperación está en la cookie ---- */
  if (authSupabaseActivo()) {
    const parseado = esquemaPasswordNueva.safeParse({ password, confirmar });
    if (!parseado.success) {
      const problema = parseado.error.issues[0];
      return error(String(problema.path[0] ?? ""), problema.message);
    }

    const supabase = await crearClienteSupabase();
    const { error: fallo } = await supabase.auth.updateUser({
      password: parseado.data.password,
    });
    if (fallo) return error("", "El enlace expiró o no es válido");

    return { ok: true, datos: { mensaje: "Contraseña actualizada. Ya puedes iniciar sesión." } };
  }

  /* ---- Modo local ---- */
  const parseado = esquemaRestablecer.safeParse({
    token: String(formData.get("token") ?? ""),
    password,
    confirmar,
  });
  if (!parseado.success) {
    const problema = parseado.error.issues[0];
    return error(String(problema.path[0] ?? ""), problema.message);
  }

  const provider = getProvider();
  const hash = await hashPassword(parseado.data.password);
  const ok = await provider.restablecerConToken(parseado.data.token, hash);
  if (!ok) return error("", "El enlace expiró o no es válido");

  return { ok: true, datos: { mensaje: "Contraseña actualizada. Ya puedes iniciar sesión." } };
}
