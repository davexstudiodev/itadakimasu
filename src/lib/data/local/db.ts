import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes, randomUUID, scrypt, scryptSync, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type {
  Categoria,
  ConfiguracionTienda,
  Cupon,
  Direccion,
  ItemCarrito,
  Marca,
  MovimientoInventario,
  Pedido,
  Producto,
  Resena,
  Rol,
} from "@/types";
import {
  CATEGORIAS_SEED,
  CONFIG_SEED,
  CUPONES_SEED,
  MARCAS_SEED,
  PRODUCTOS_SEED,
} from "@/lib/data/seed";

/* ============================================================
   Almacenamiento local persistente (modo demo / desarrollo).
   Archivo JSON con escritura atómica y cola de operaciones
   para evitar condiciones de carrera entre peticiones.
   ============================================================ */

export interface UsuarioLocal {
  id: string;
  email: string;
  passwordHash: string;
  nombre: string;
  apellidos: string;
  telefono: string | null;
  rol: Rol;
  activo: boolean;
  creadoEn: string;
  resetToken?: string | null;
  resetExpires?: string | null;
}

export interface EntradaAuditoria {
  fecha: string;
  actor: string;
  accion: string;
  detalle: string;
}

export interface DBLocal {
  version: number;
  productos: Producto[];
  categorias: Categoria[];
  marcas: Marca[];
  usuarios: UsuarioLocal[];
  carritos: Record<string, ItemCarrito[]>;
  favoritos: Record<string, string[]>;
  direcciones: Direccion[];
  pedidos: Pedido[];
  resenas: Resena[];
  cupones: Cupon[];
  usosCupon: {
    id: string;
    cuponId: string;
    codigo: string;
    usuarioId: string;
    pedidoId: string;
    fecha: string;
  }[];
  movimientos: MovimientoInventario[];
  configuracion: ConfiguracionTienda;
  auditoria: EntradaAuditoria[];
  suscriptores: { email: string; fecha: string }[];
  contadorPedidos: number;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

/* ---------- Semilla ---------- */

function adminSeed(): UsuarioLocal {
  const email = (process.env.ADMIN_EMAIL ?? "admin@itadakimasu.pe").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "Itadakimasu2026!";
  return {
    id: "usr-admin-001",
    email,
    passwordHash: hashPasswordSincrono(password),
    nombre: "Admin",
    apellidos: "ITADAKIMASU",
    telefono: null,
    rol: "admin",
    activo: true,
    creadoEn: "2026-01-01T00:00:00.000Z",
  };
}

function crearSemilla(): DBLocal {
  return {
    version: 1,
    productos: PRODUCTOS_SEED,
    categorias: CATEGORIAS_SEED,
    marcas: MARCAS_SEED,
    usuarios: [adminSeed()],
    carritos: {},
    favoritos: {},
    direcciones: [],
    pedidos: [],
    resenas: [],
    cupones: CUPONES_SEED,
    usosCupon: [],
    movimientos: [],
    configuracion: CONFIG_SEED,
    auditoria: [],
    suscriptores: [],
    contadorPedidos: 0,
  };
}

/* ---------- Hash de contraseñas (scrypt) ---------- */

const SCRYPT_N = 16384;

const derivar = promisify(scrypt) as (
  pw: string,
  salt: string,
  len: number,
  opts: object
) => Promise<Buffer>;

function hashPasswordSincrono(password: string): string {
  // scrypt síncrono solo para la semilla inicial (una única ejecución)
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64, { N: SCRYPT_N }).toString("hex");
  return `scrypt$${SCRYPT_N}$${salt}$${hash}`;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = await derivar(password, salt, 64, { N: SCRYPT_N });
  return `scrypt$${SCRYPT_N}$${salt}$${hash.toString("hex")}`;
}

export async function verificarPassword(
  password: string,
  almacenado: string
): Promise<boolean> {
  try {
    const [esquema, n, salt, hash] = almacenado.split("$");
    if (esquema !== "scrypt" || !salt || !hash) return false;
    const resultado = await derivar(password, salt, 64, { N: Number(n) });
    const esperado = Buffer.from(hash, "hex");
    return resultado.length === esperado.length && timingSafeEqual(resultado, esperado);
  } catch {
    return false;
  }
}

/* ---------- Lectura / escritura ---------- */

async function leer(): Promise<DBLocal> {
  try {
    const crudo = await fs.readFile(DB_FILE, "utf8");
    const db = JSON.parse(crudo) as DBLocal;
    normalizar(db);
    return db;
  } catch (error) {
    const codigo = (error as NodeJS.ErrnoException).code;
    if (codigo !== "ENOENT") throw error;
    const semilla = crearSemilla();
    await escribir(semilla);
    return semilla;
  }
}

/**
 * Migraciones suaves de datos locales (se aplican en cada lectura y se
 * persisten en la siguiente escritura): campos nuevos de configuración y
 * métodos de envío renombrados al modo local (Puerto Malabrigo).
 */
function normalizar(db: DBLocal): void {
  if (db.configuracion) {
    db.configuracion = { ...CONFIG_SEED, ...db.configuracion };
  }
  for (const pedido of db.pedidos ?? []) {
    const metodo = pedido.metodoEnvio as string;
    if (metodo === "delivery_lima" || metodo === "envio_provincias") {
      pedido.metodoEnvio = "delivery_local";
    }
  }
}

async function escribir(db: DBLocal): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const temporal = `${DB_FILE}.${randomBytes(6).toString("hex")}.tmp`;
  await fs.writeFile(temporal, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(temporal, DB_FILE);
}

/** Cola global: serializa cada operación lectura-modificación-escritura. */
let cola: Promise<unknown> = Promise.resolve();

export function transaccion<T>(fn: (db: DBLocal) => Promise<T> | T): Promise<T> {
  const tarea = cola.then(
    async () => {
      const db = await leer();
      const resultado = await fn(db);
      await escribir(db);
      return resultado;
    },
    async () => {
      const db = await leer();
      const resultado = await fn(db);
      await escribir(db);
      return resultado;
    }
  );
  cola = tarea.catch(() => undefined);
  return tarea;
}

/** Solo lectura (no escribe el archivo). */
export async function consultar<T>(fn: (db: DBLocal) => T): Promise<T> {
  const db = await leer();
  return fn(db);
}

export function nuevoId(prefijo: string): string {
  return `${prefijo}-${randomUUID().slice(0, 8)}`;
}

export function ahora(): string {
  return new Date().toISOString();
}
