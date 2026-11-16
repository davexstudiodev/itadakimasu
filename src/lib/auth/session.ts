import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/* ============================================================
   Sesiones firmadas por cookie (modo local).
   - Cookie httpOnly + sameSite=lax + secure en producción.
   - Firma HMAC-SHA256 con SESSION_SECRET (o secreto local generado
     una vez y guardado en data/.session-secret).
   ============================================================ */

const NOMBRE_COOKIE = "ita_session";
const DURACION_SEGUNDOS = 60 * 60 * 24 * 30; // 30 días

let secretoCache: string | null = null;

async function obtenerSecreto(): Promise<string> {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (secretoCache) return secretoCache;
  const { promises: fs } = await import("node:fs");
  const path = await import("node:path");
  const archivo = path.join(process.cwd(), "data", ".session-secret");
  try {
    secretoCache = await fs.readFile(archivo, "utf8");
    return secretoCache;
  } catch {
    const nuevo = randomBytes(32).toString("hex");
    await fs.mkdir(path.dirname(archivo), { recursive: true });
    await fs.writeFile(archivo, nuevo, { mode: 0o600 });
    secretoCache = nuevo;
    return nuevo;
  }
}

function firmar(dato: string, secreto: string): string {
  return createHmac("sha256", secreto).update(dato).digest("hex");
}

function seguro(): boolean {
  return process.env.NODE_ENV === "production";
}

export async function crearSesion(usuarioId: string): Promise<void> {
  const secreto = await obtenerSecreto();
  const expira = Math.floor(Date.now() / 1000) + DURACION_SEGUNDOS;
  const cuerpo = `${usuarioId}.${expira}`;
  const firma = firmar(cuerpo, secreto);
  const store = await cookies();
  store.set(NOMBRE_COOKIE, `${cuerpo}.${firma}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: seguro(),
    path: "/",
    maxAge: DURACION_SEGUNDOS,
  });
}

export async function destruirSesion(): Promise<void> {
  const store = await cookies();
  store.delete(NOMBRE_COOKIE);
}

/** Devuelve el id del usuario autenticado o null. Verifica firma y expiración. */
export async function obtenerUsuarioId(): Promise<string | null> {
  const store = await cookies();
  const valor = store.get(NOMBRE_COOKIE)?.value;
  if (!valor) return null;
  const partes = valor.split(".");
  if (partes.length !== 3) return null;
  const [usuarioId, expira, firma] = partes;
  const secreto = await obtenerSecreto();
  const esperada = firmar(`${usuarioId}.${expira}`, secreto);
  const a = Buffer.from(firma);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(expira) * 1000 < Date.now()) return null;
  return usuarioId;
}
