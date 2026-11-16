/* ============================================================
   Aplica db/migrations/*.sql en orden contra NEON_DATABASE_URL.
   Uso:
     $env:NEON_DATABASE_URL="postgresql://…" ; node scripts/migrar.mjs
   Los archivos son idempotentes (IF NOT EXISTS / ON CONFLICT DO
   NOTHING), por lo que re-ejecutarlos es seguro.
   ============================================================ */

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const url = process.env.NEON_DATABASE_URL;
if (!url) {
  console.error("Falta NEON_DATABASE_URL. Ejemplo:");
  console.error('  $env:NEON_DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"');
  process.exit(1);
}

const dir = path.join(process.cwd(), "db", "migrations");
const archivos = readdirSync(dir)
  .filter((f) => f.toLowerCase().endsWith(".sql"))
  .sort();

if (archivos.length === 0) {
  console.error(`No hay archivos .sql en ${dir}`);
  process.exit(1);
}

const cliente = new pg.Client({ connectionString: url });
await cliente.connect();

let fallo = false;
try {
  for (const archivo of archivos) {
    const sql = readFileSync(path.join(dir, archivo), "utf8");
    process.stdout.write(`→ ${archivo} ... `);
    await cliente.query(sql);
    console.log("OK");
  }
  console.log(`\n${archivos.length} migración(es) aplicada(s).`);
} catch (error) {
  fallo = true;
  console.log("FALLO");
  console.error(error.message);
} finally {
  await cliente.end();
}

process.exit(fallo ? 1 : 0);
