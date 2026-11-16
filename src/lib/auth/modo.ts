/**
 * Modo de autenticación:
 * - "local" (por defecto): scrypt + cookie firmada HMAC (demo / desarrollo).
 * - "supabase": Supabase Auth con cookies @supabase/ssr (producción).
 *
 * Se configura con AUTH_MODE en .env.local / variables de Vercel.
 */
export function authSupabaseActivo(): boolean {
  return (process.env.AUTH_MODE ?? "local").toLowerCase() === "supabase";
}
