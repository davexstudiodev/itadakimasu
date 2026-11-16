import { proveedorLocal } from "./local/provider";
import { proveedorNeon } from "./neon/provider";
import type { DataProvider } from "./provider";

/**
 * Fáctory del proveedor de datos (solo servidor).
 * - DATA_PROVIDER=local (por defecto): almacenamiento JSON persistente (demo/dev).
 * - DATA_PROVIDER=neon: PostgreSQL en Neon. Requiere NEON_DATABASE_URL
 *   en .env.local (desarrollo) o en las variables de entorno de Vercel.
 */
export function getProvider(): DataProvider {
  const modo = (process.env.DATA_PROVIDER ?? "local").toLowerCase();
  if (modo === "neon") return proveedorNeon;
  return proveedorLocal;
}

export type {
  DataProvider,
  FiltroProductos,
  ResultadoPaginado,
  EstadisticasDashboard,
  DatosPedido,
} from "./provider";
