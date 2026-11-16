import { describe, expect, it } from "vitest";
import {
  extensionImagen,
  firmaImagenValida,
  MAX_TAMANO_IMAGEN,
  MIME_IMAGENES_PERMITIDOS,
} from "./validar-imagen";

describe("validación de imágenes para subir", () => {
  it("permite formatos raster admitidos y limita el tamaño por archivo", () => {
    expect(MIME_IMAGENES_PERMITIDOS).toEqual(["image/jpeg", "image/png", "image/webp"]);
    expect(extensionImagen("image/jpeg")).toBe("jpg");
    expect(extensionImagen("image/svg+xml")).toBeNull();
    expect(MAX_TAMANO_IMAGEN).toBe(4 * 1024 * 1024);
  });

  it("valida las firmas reales del archivo, no solo el MIME del navegador", () => {
    expect(firmaImagenValida("image/jpeg", Uint8Array.from([0xff, 0xd8, 0xff]))).toBe(true);
    expect(firmaImagenValida("image/png", Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
    expect(firmaImagenValida("image/webp", Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))).toBe(true);
    expect(firmaImagenValida("image/png", new TextEncoder().encode("<svg>"))).toBe(false);
    expect(firmaImagenValida("image/gif", new Uint8Array(12))).toBe(false);
  });
});
