import { describe, it, expect } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("convierte texto simple", () => {
    expect(slugify("Ramen instantáneo")).toBe("ramen-instantaneo");
  });

  it("elimina caracteres especiales", () => {
    expect(slugify("¡Pocky Fresa!")).toBe("pocky-fresa");
    expect(slugify("Combo #1 (2x)")).toBe("combo-1-2x");
  });

  it("colapsa espacios y guiones repetidos", () => {
    expect(slugify("  buldak   original  ")).toBe("buldak-original");
    expect(slugify("a--b")).toBe("a-b");
  });

  it("elimina guiones al inicio y final", () => {
    expect(slugify("-hola-")).toBe("hola");
  });

  it("maneja acentos JP/KR mezclados sin romperse", () => {
    expect(slugify("Buldak Bokkeum Myeon")).toBe("buldak-bokkeum-myeon");
  });

  it("cadena vacía da cadena vacía", () => {
    expect(slugify("")).toBe("");
    expect(slugify("   ")).toBe("");
  });

  it("es minúsculas siempre", () => {
    expect(slugify("KitKat Matcha")).toBe("kitkat-matcha");
  });
});
