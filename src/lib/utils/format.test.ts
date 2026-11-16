import { describe, it, expect } from "vitest";
import {
  formatPEN,
  formatNumero,
  formatFecha,
  formatFechaCorta,
  formatCantidad,
  porcentajeDescuento,
  plural,
} from "./format";

describe("formatPEN", () => {
  it("formatea soles con dos decimales", () => {
    expect(formatPEN(12.9)).toMatch(/12[.,]90/);
    expect(formatPEN(0)).toMatch(/0[.,]00/);
  });

  it("miles con separador", () => {
    expect(formatPEN(1277.1)).toMatch(/1[.,]?277[.,]10/);
  });

  it("acepta negativos (reembolsos)", () => {
    expect(formatPEN(-5)).toMatch(/-.*5[.,]00/);
  });
});

describe("formatNumero", () => {
  it("siempre dos decimales", () => {
    expect(formatNumero(5)).toMatch(/5[.,]00/);
    expect(formatNumero(5.5)).toMatch(/5[.,]50/);
  });
});

describe("formatFecha", () => {
  it("acepta ISO válido", () => {
    const salida = formatFecha("2026-11-14T20:30:00.000Z");
    expect(salida).toContain("2026");
    expect(salida).toContain("30");
  });

  it("formato corta contiene año", () => {
    expect(formatFechaCorta("2026-11-14T20:30:00.000Z")).toContain("2026");
  });
});

describe("formatCantidad", () => {
  it("entero", () => {
    expect(formatCantidad(1234)).toMatch(/1[.,]?234/);
  });
});

describe("porcentajeDescuento", () => {
  it("calcula el descuento redondeado", () => {
    // 14.90 → 12.90 = 13.42% → 13
    expect(porcentajeDescuento(12.9, 14.9)).toBe(13);
    // 50 → 25 = 50%
    expect(porcentajeDescuento(25, 50)).toBe(50);
  });

  it("devuelve 0 sin precio anterior", () => {
    expect(porcentajeDescuento(10, null)).toBe(0);
    expect(porcentajeDescuento(10, undefined)).toBe(0);
  });

  it("devuelve 0 si el precio anterior no es mayor (precio igual o menor)", () => {
    expect(porcentajeDescuento(10, 10)).toBe(0);
    expect(porcentajeDescuento(12, 10)).toBe(0);
  });
});

describe("plural", () => {
  it("elige singular y plural", () => {
    expect(plural(1, "artículo", "artículos")).toBe("artículo");
    expect(plural(0, "artículo", "artículos")).toBe("artículos");
    expect(plural(2, "artículo", "artículos")).toBe("artículos");
  });
});
