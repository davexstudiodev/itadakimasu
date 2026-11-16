import "server-only";
import { randomBytes } from "node:crypto";
import { Pool, types } from "pg";
import type { PoolClient, QueryResultRow } from "pg";

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
  const resultado = await getPool().query<T>(sql, params as never[]);
  return resultado.rows;
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
