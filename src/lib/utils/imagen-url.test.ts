import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ImagenProducto } from "@/components/ui/imagen-producto";
import { esUrlImagenExterna } from "./imagen-url";

describe("esUrlImagenExterna", () => {
  it("detecta URLs externas HTTP(S) y relativas al protocolo", () => {
    expect(esUrlImagenExterna("https://kfood.pe/imagen.jpg")).toBe(true);
    expect(esUrlImagenExterna("http://cdn.example.com/imagen.png")).toBe(true);
    expect(esUrlImagenExterna("//cdn.example.com/imagen.webp")).toBe(true);
  });

  it("mantiene las rutas locales bajo la optimización normal", () => {
    expect(esUrlImagenExterna("/productos/ramen.svg")).toBe(false);
  });

  it("renderiza URLs externas sin pedirlas al optimizador de Next", () => {
    const url = "https://kfood.pe/tienda/tallarines/buldak-bokeummyun-x-140gr/";
    const markup = renderToStaticMarkup(
      createElement(ImagenProducto, { src: url, alt: "Producto", width: 120, height: 120 })
    );

    expect(markup).toContain(`src="${url}"`);
    expect(markup).not.toContain("/_next/image");
  });

  it("mantiene la optimización de Next para rutas locales", () => {
    const markup = renderToStaticMarkup(
      createElement(ImagenProducto, {
        src: "/productos/ramen.jpg",
        alt: "Producto",
        width: 120,
        height: 120,
      })
    );

    expect(markup).toContain("/_next/image");
  });
});
