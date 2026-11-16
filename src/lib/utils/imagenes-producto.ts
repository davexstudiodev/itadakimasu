const FOTOS_LICENCIADAS: Partial<
  Record<string, { ruta: string; fuente: string }>
> = {
  "pocky-chocolate": {
    ruta: "/productos/pocky-chocolate-foto.jpg",
    fuente: "https://world.openfoodfacts.org/product/8851019010007/pocky-chocolate-glico",
  },
  "pocky-fresa": {
    ruta: "/productos/pocky-fresa-foto.jpg",
    fuente: "https://world.openfoodfacts.org/product/8851019010014/pocky-glico",
  },
  "pocky-matcha": {
    ruta: "/productos/pocky-matcha-foto.jpg",
    fuente: "https://world.openfoodfacts.org/product/8851019010038/matcha-green-tea-flavour-pocky",
  },
};

export function atribucionFotoProducto(
  slug: string
): { fuente: string } | undefined {
  const foto = FOTOS_LICENCIADAS[slug];
  return foto ? { fuente: foto.fuente } : undefined;
}

export function imagenesProductoBase(slug: string): string[] {
  return [
    `/productos/${slug}.svg`,
    `/productos/${slug}-vista-2.svg`,
    `/productos/${slug}-vista-3.svg`,
    `/productos/${slug}-vista-4.svg`,
  ];
}

export function imagenesProducto(slug: string): string[] {
  const imagenes = imagenesProductoBase(slug);
  const foto = FOTOS_LICENCIADAS[slug];
  return foto ? [...imagenes, foto.ruta] : imagenes;
}
