import "server-only";
import { randomBytes } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";
import { Pool, types } from "pg";
import type { PoolClient, QueryResultRow } from "pg";
import { headers } from "next/headers";
import { obtenerUsuarioId } from "@/lib/auth/session";

/* ============================================================
   Conexión a PostgreSQL (Neon) para el proveedor DATA_PROVIDER=neon.
   - Pool singleton por proceso (evita agotar conexiones en serverless).
   - Los timestamps se devuelven como string ISO (los tipos del
     dominio usan string, igual que el modo local).
   ============================================================ */

function aISO(valor: string): string {
  let s = valor.replace(" ", "T");
  if (/[+-]\d{2}$/.test(s)) s += ":00"; // "+00" → "+00:00" (ISO estricto)
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? valor : d.toISOString();
}

// 1184 = timestamptz, 1114 = timestamp sin zona
types.setTypeParser(1184, (v: string) => aISO(v));
types.setTypeParser(1114, (v: string) => aISO(v));

let pool: Pool | null = null;
const identidadRls = new AsyncLocalStorage<{ id: string; email: string }>();

/** Ejecuta operaciones de Neon con identidad recibida tras autenticar en Supabase. */
export function withRlsIdentity<T>(
  identidad: { id: string; email: string },
  trabajo: () => Promise<T>
): Promise<T> {
  return identidadRls.run(identidad, trabajo);
}

export function getPool(): Pool {
  if (!pool) {
    const url = process.env.NEON_DATABASE_URL;
    if (!url) {
      throw new Error(
        "Falta NEON_DATABASE_URL. Configura la conexión de Neon en .env.local (desarrollo) o en las variables de entorno de Vercel (producción)."
      );
    }
    pool = new Pool({
      connectionString: url,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
    // Errores de conexiones ociosos no deben tumbar el proceso
    pool.on("error", () => undefined);
  }
  return pool;
}

/** Consulta simple (una sentencia). */
export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  return transaccion(async (cliente) => {
    const resultado = await cliente.query<T>(sql, params as never[]);
    return resultado.rows;
  });
}

/** Primera fila o null. */
export async function queryUno<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const filas = await query<T>(sql, params);
  return filas[0] ?? null;
}

/** Ejecuta fn dentro de una transacción con rollback automático. */
export async function transaccion<T>(
  fn: (cliente: PoolClient) => Promise<T>
): Promise<T> {
  const cliente = await getPool().connect();
  try {
    await cliente.query("BEGIN");
    await establecerIdentidadRls(cliente);
    const resultado = await fn(cliente);
    await cliente.query("COMMIT");
    return resultado;
  } catch (error) {
    await cliente.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    cliente.release();
  }
}

/**
 * Identidad de confianza para las políticas RLS de Neon.
 * En modo Supabase, proxy.ts valida el token y reemplaza estos headers antes
 * de que la petición llegue a la aplicación. En modo local, se verifica la
 * cookie firmada del servidor. Los valores son locales a la transacción.
 */
async function establecerIdentidadRls(cliente: PoolClient): Promise<void> {
  const contexto = identidadRls.getStore();
  let usuarioId = contexto?.id ?? "";
  let correo = contexto?.email ?? "";

  try {
    if (contexto) {
      // Sign-up y sign-in pueden consultar Neon antes de que la próxima
      // petición atraviese proxy.ts; el contexto proviene del resultado Auth.
    } else if ((process.env.AUTH_MODE ?? "local").toLowerCase() === "supabase") {
      const h = await headers();
      usuarioId = h.get("x-ita-user-id") ?? "";
      correo = h.get("x-ita-user-email") ?? "";
    } else {
      usuarioId = (await obtenerUsuarioId()) ?? "";
    }
  } catch {
    // Jobs/tests sin petición web quedan como visitante sin identidad.
  }

  await cliente.query(
    "SELECT set_config('app.user_id', $1, true), set_config('app.user_email', $2, true)",
    [usuarioId, correo]
  );
}

/** Cierra el pool (usado en tests y en el apagado ordenado). */
export async function cerrarPool(): Promise<void> {
  if (pool) {
    const p = pool;
    pool = null;
    await p.end().catch(() => undefined);
  }
}

/** Id con el mismo estilo que el modo local: prefijo + 16 hex. */
export function nuevoId(prefijo: string): string {
  return `${prefijo}-${randomBytes(8).toString("hex")}`;
}

export function ahora(): string {
  return new Date().toISOString();
}

/** Error de clave duplicada de Postgres (23505). */
export function esDuplicado(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === "23505";
}
