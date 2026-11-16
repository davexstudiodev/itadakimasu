import { ProductCard } from "./product-card";

export function ProductGrid({
  productos,
  columnas = 4,
}: {
  productos: React.ComponentProps<typeof ProductCard>["producto"][];
  columnas?: 2 | 3 | 4;
}) {
  const clases = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4",
  } as const;

  return (
    <div className={`grid ${clases[columnas]} gap-4 sm:gap-6`}>
      {productos.map((producto, i) => (
        <ProductCard key={producto.id} producto={producto} indice={i} />
      ))}
    </div>
  );
}

