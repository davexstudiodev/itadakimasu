import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, TriangleAlert, Package } from "lucide-react";
import { getProvider } from "@/lib/data";
import { formatFecha } from "@/lib/utils/format";
import { FormInventario } from "@/components/admin/form-inventario";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Inventario" };

const TIPO_TEXTO: Record<string, string> = {
  entrada: "Entrada",
  salida: "Salida",
  ajuste: "Ajuste",
  venta: "Venta",
};

export default async function PaginaInventario() {
  const provider = getProvider();
  const [catalogo, movimientos] = await Promise.all([
    provider.listarProductosAdmin({ pagina: 1, porPagina: 60 }),
    provider.getMovimientos(),
  ]);

  const bajos = catalogo.items.filter((p) => p.activo && p.stock <= p.stockMinimo);

  return (
    <div className="space-y-6">
      <div>
        <p className="texto-jp text-sm text-tomate">在庫管理</p>
        <h1 className="mt-1 font-display text-2xl font-black tracking-tight text-marron sm:text-3xl">
          Inventario
        </h1>
        <p className="mt-1 text-sm text-marron/60">
          Entradas, salidas y ajustes de stock con trazabilidad completa.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Formulario */}
        <div className="space-y-6">
          <FormInventario
            productos={catalogo.items.map((p) => ({
              id: p.id,
              nombre: p.nombre,
              stock: p.stock,
            }))}
          />

          {/* Alertas de stock */}
          <section className="rounded-card border border-beige-dark/60 bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 font-display font-bold text-marron">
              <TriangleAlert className="h-4 w-4 text-naranja-dark" aria-hidden />
              Stock bajo o agotado
            </h2>
            {bajos.length === 0 ? (
              <p className="mt-3 text-sm text-marron/60">
                Todos los productos activos están por encima de su mínimo.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {bajos.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                    <Link
                      href={`/admin/productos/${p.id}`}
                      className="min-w-0 truncate font-semibold text-marron hover:text-tomate"
                    >
                      {p.nombre}
                    </Link>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold",
                        p.stock === 0 ? "bg-tomate/10 text-tomate" : "bg-naranja/15 text-naranja-dark"
                      )}
                    >
                      {p.stock} / mín. {p.stockMinimo}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Movimientos */}
        <section className="rounded-card border border-beige-dark/60 bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-marron">
            <Boxes className="h-4 w-4 text-tomate" aria-hidden />
            Últimos movimientos
          </h2>

          {movimientos.length === 0 ? (
            <div className="mt-6 text-center">
              <Package className="mx-auto h-9 w-9 text-marron/35" aria-hidden />
              <p className="mt-2 text-sm text-marron/60">
                Aún no hay movimientos de inventario.
              </p>
              <p className="mt-1 text-xs text-marron/45">
                Cada entrada, salida o ajuste quedará registrado aquí con autor y motivo.
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-beige-dark/60 text-[11px] font-bold uppercase tracking-wide text-marron/55">
                    <th className="py-2.5 pr-3">Fecha</th>
                    <th className="py-2.5 pr-3">Producto</th>
                    <th className="py-2.5 pr-3">Tipo</th>
                    <th className="py-2.5 pr-3 text-right">Cantidad</th>
                    <th className="py-2.5 pr-3 text-right">Stock</th>
                    <th className="py-2.5 pr-3">Motivo</th>
                    <th className="py-2.5">Autor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige-dark/50">
                  {movimientos.slice(0, 40).map((m) => (
                    <tr key={m.id} className="text-marron/75">
                      <td className="py-2.5 pr-3 text-xs text-marron/55">{formatFecha(m.fecha)}</td>
                      <td className="max-w-[180px] truncate py-2.5 pr-3 font-semibold text-marron">
                        {m.productoNombre}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                            m.tipo === "entrada" || m.tipo === "venta"
                              ? m.tipo === "entrada"
                                ? "bg-hojita/15 text-hojita"
                                : "bg-tomate/10 text-tomate"
                              : m.tipo === "salida"
                                ? "bg-naranja/15 text-naranja-dark"
                                : "bg-beige text-marron"
                          )}
                        >
                          {TIPO_TEXTO[m.tipo] ?? m.tipo}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-right font-bold">
                        {m.tipo === "entrada" ? "+" : m.tipo === "salida" ? "−" : ""}
                        {m.cantidad}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-semibold text-marron">
                        {m.stockResultante}
                      </td>
                      <td className="max-w-[200px] truncate py-2.5 pr-3 text-xs">{m.motivo}</td>
                      <td className="py-2.5 text-xs text-marron/55">{m.autor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
