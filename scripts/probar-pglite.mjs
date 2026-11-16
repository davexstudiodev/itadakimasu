/* Prueba de humo: aplica las migraciones en un Postgres en memoria
   (PGlite) y se conecta por TCP con el driver `pg` (igual que hará
   contra Neon). No toca servicios externos.
   Uso: node scripts/probar-pglite.mjs */

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import pg from "pg";

const PUERTO = Number(process.env.PGLITE_PUERTO ?? 55432);

const db = new PGlite();
const dir = path.join(process.cwd(), "db", "migrations");
const archivos = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

for (const archivo of archivos) {
  process.stdout.write(`→ ${archivo} ... `);
  await db.exec(readFileSync(path.join(dir, archivo), "utf8"));
  console.log("OK");
}

const servidor = new PGLiteSocketServer({ db, port: PUERTO, maxConnections: 10 });
await servidor.start();

const cliente = new pg.Client({
  connectionString: `postgresql://postgres@127.0.0.1:${PUERTO}/postgres`,
});
await cliente.connect();

const conteos = await cliente.query(`
  SELECT (SELECT count(*)::int FROM productos) AS productos,
         (SELECT count(*)::int FROM categorias) AS categorias,
         (SELECT count(*)::int FROM cupones) AS cupones,
         (SELECT count(*)::int FROM resenas) AS resenas,
         (SELECT count(*)::int FROM perfiles) AS perfiles
`);
console.log("Seed:", conteos.rows[0]);

const pedidos = await cliente.query(
  `INSERT INTO contadores (clave, valor) VALUES ('prueba', 1)
     ON CONFLICT (clave) DO UPDATE SET valor = contadores.valor + 1
     RETURNING valor`
);
console.log("Contador atómico:", pedidos.rows[0]);

await cliente.end();
await servidor.stop();
console.log("TODO OK");
