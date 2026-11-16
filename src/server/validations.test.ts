import { describe, it, expect } from "vitest";
import {
  esquemaRegistro,
  esquemaLogin,
  esquemaCheckout,
  esquemaDireccion,
  esquemaCupon,
  esquemaProducto,
  esquemaResena,
  esquemaPerfil,
  PASSWORD_MINIMO,
} from "./validations";

/* ============================================================
   Validaciones Zod — el servidor SIEMPRE valida.
   Estos tests protegen las reglas de negocio críticas.
   ============================================================ */

describe("esquemaRegistro", () => {
  const base = {
    nombre: "Dave",
    apellidos: "Cliente",
    email: "Dave.Cliente@Correo.com",
    password: "Prueba2026!",
    confirmar: "Prueba2026!",
    aceptaTerminos: true as const,
  };

  it("acepta un registro válido y normaliza el email", () => {
    const r = esquemaRegistro.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("dave.cliente@correo.com");
  });

  it("rechaza sin aceptar términos", () => {
    const r = esquemaRegistro.safeParse({ ...base, aceptaTerminos: false });
    expect(r.success).toBe(false);
  });

  it("rechaza contraseñas que no coinciden", () => {
    const r = esquemaRegistro.safeParse({ ...base, confirmar: "Otra2026!" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toContain("confirmar");
  });

  it("rechaza contraseña sin mayúscula", () => {
    const r = esquemaRegistro.safeParse({ ...base, password: "prueba2026!", confirmar: "prueba2026!" });
    expect(r.success).toBe(false);
  });

  it("rechaza contraseña sin número", () => {
    const r = esquemaRegistro.safeParse({ ...base, password: "PruebaSin!", confirmar: "PruebaSin!" });
    expect(r.success).toBe(false);
  });

  it(`rechaza contraseña más corta que ${PASSWORD_MINIMO}`, () => {
    const corta = "Ab1".padEnd(PASSWORD_MINIMO - 1, "x");
    const r = esquemaRegistro.safeParse({ ...base, password: corta, confirmar: corta });
    expect(r.success).toBe(false);
  });

  it("rechaza nombres con números", () => {
    const r = esquemaRegistro.safeParse({ ...base, nombre: "D4ve" });
    expect(r.success).toBe(false);
  });
});

describe("esquemaLogin", () => {
  it("acepta credenciales válidas", () => {
    expect(esquemaLogin.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });

  it("rechaza email inválido", () => {
    expect(esquemaLogin.safeParse({ email: "no-es-email", password: "x" }).success).toBe(false);
  });

  it("rechaza contraseña vacía", () => {
    expect(esquemaLogin.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("esquemaDireccion", () => {
  const base = {
    nombreCompleto: "Dave Cliente",
    telefono: "987654321",
    departamento: "La Libertad",
    provincia: "Ascope",
    distrito: "Rázuri",
    direccion: "Jr. Los Pescadores 456",
  };

  it("acepta dirección válida", () => {
    expect(esquemaDireccion.safeParse(base).success).toBe(true);
  });

  it("rechaza teléfono demasiado corto", () => {
    expect(esquemaDireccion.safeParse({ ...base, telefono: "123" }).success).toBe(false);
  });

  it("rechaza dirección muy corta", () => {
    expect(esquemaDireccion.safeParse({ ...base, direccion: "Av" }).success).toBe(false);
  });
});

describe("esquemaCheckout", () => {
  const direccion = {
    nombreCompleto: "Dave Cliente",
    telefono: "987654321",
    departamento: "La Libertad",
    provincia: "Ascope",
    distrito: "Rázuri",
    direccion: "Jr. Los Pescadores 456",
  };
  const base = {
    items: [{ productoId: "prod-1", cantidad: 2 }],
    metodoPago: "yape" as const,
    metodoEnvio: "delivery_local" as const,
    direccion,
    aceptaTerminos: true as const,
  };

  it("acepta un checkout válido", () => {
    expect(esquemaCheckout.safeParse(base).success).toBe(true);
  });

  it("rechaza carrito vacío", () => {
    const r = esquemaCheckout.safeParse({ ...base, items: [] });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toMatch(/vacío/i);
  });

  it("rechaza cantidades fuera de rango (0 o >99)", () => {
    expect(esquemaCheckout.safeParse({ ...base, items: [{ productoId: "p", cantidad: 0 }] }).success).toBe(false);
    expect(esquemaCheckout.safeParse({ ...base, items: [{ productoId: "p", cantidad: 100 }] }).success).toBe(false);
    expect(esquemaCheckout.safeParse({ ...base, items: [{ productoId: "p", cantidad: 1.5 }] }).success).toBe(false);
  });

  it("rechaza métodos de pago/inválidos", () => {
    expect(esquemaCheckout.safeParse({ ...base, metodoPago: "bitcoin" }).success).toBe(false);
    // Yape es el único método habilitado: los demás se rechazan.
    expect(esquemaCheckout.safeParse({ ...base, metodoPago: "plin" }).success).toBe(false);
    expect(esquemaCheckout.safeParse({ ...base, metodoPago: "transferencia" }).success).toBe(false);
    expect(esquemaCheckout.safeParse({ ...base, metodoPago: "contra_entrega" }).success).toBe(false);
    expect(esquemaCheckout.safeParse({ ...base, metodoEnvio: "dron" }).success).toBe(false);
  });

  it("rechaza si no acepta términos", () => {
    expect(esquemaCheckout.safeParse({ ...base, aceptaTerminos: false }).success).toBe(false);
  });

  it("acepta cupón opcional o vacío", () => {
    expect(esquemaCheckout.safeParse({ ...base, cuponCodigo: "BIENVENIDO10" }).success).toBe(true);
    expect(esquemaCheckout.safeParse({ ...base, cuponCodigo: "" }).success).toBe(true);
    expect(
      esquemaCheckout.safeParse({ ...base, cuponCodigo: "x".repeat(31) }).success
    ).toBe(false);
  });
});

describe("esquemaCupon", () => {
  const base = {
    codigo: "bienv10",
    tipo: "porcentaje" as const,
    valor: 10,
    activo: true,
  };

  it("normaliza el código a mayúsculas", () => {
    const r = esquemaCupon.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.codigo).toBe("BIENV10");
  });

  it("rechaza porcentaje mayor a 100", () => {
    const r = esquemaCupon.safeParse({ ...base, valor: 150 });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toContain("valor");
  });

  it("rechaza fechas invertidas (fin antes de inicio)", () => {
    const r = esquemaCupon.safeParse({ ...base, fechaInicio: "2026-12-31", fechaFin: "2026-01-01" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toContain("fechaFin");
  });

  it("rechaza códigos con símbolos raros", () => {
    expect(esquemaCupon.safeParse({ ...base, codigo: "10%" }).success).toBe(false);
  });

  it("acepta cupón fijo", () => {
    expect(esquemaCupon.safeParse({ ...base, tipo: "fijo", valor: 15 }).success).toBe(true);
  });
});

describe("esquemaProducto", () => {
  const base = {
    nombre: "Ramen Tonkotsu",
    slug: "ramen-tonkotsu",
    descripcion: "Ramen instantáneo de sabor cerdo.",
    precio: 12.9,
    categoriaSlug: "ramen",
    marcaSlug: "nissin",
    pais: "japon" as const,
    stock: 50,
    stockMinimo: 5,
    destacado: false,
    activo: true,
  };

  it("acepta un producto válido", () => {
    expect(esquemaProducto.safeParse(base).success).toBe(true);
  });

  it("rechaza precio mínimo", () => {
    expect(esquemaProducto.safeParse({ ...base, precio: 0.1 }).success).toBe(false);
  });

  it("rechaza slug con mayúsculas o espacios", () => {
    expect(esquemaProducto.safeParse({ ...base, slug: "Ramen Tonkotsu" }).success).toBe(false);
  });

  it("rechaza stock negativo", () => {
    expect(esquemaProducto.safeParse({ ...base, stock: -1 }).success).toBe(false);
  });

  it("rechaza país desconocido", () => {
    expect(esquemaProducto.safeParse({ ...base, pais: "peru" }).success).toBe(false);
  });

  it("rechaza descripción muy corta", () => {
    expect(esquemaProducto.safeParse({ ...base, descripcion: "corta" }).success).toBe(false);
  });
});

describe("esquemaResena", () => {
  const base = {
    productoId: "prod-1",
    calificacion: 5,
    titulo: "Delicioso",
    comentario: "Me encantó este producto, lo recomiendo mucho.",
  };

  it("acepta reseña válida", () => {
    expect(esquemaResena.safeParse(base).success).toBe(true);
  });

  it("calificación fuera de 1-5", () => {
    expect(esquemaResena.safeParse({ ...base, calificacion: 0 }).success).toBe(false);
    expect(esquemaResena.safeParse({ ...base, calificacion: 6 }).success).toBe(false);
  });

  it("comentario mínimo de 10 caracteres", () => {
    expect(esquemaResena.safeParse({ ...base, comentario: "corto" }).success).toBe(false);
  });
});

describe("esquemaPerfil", () => {
  it("acepta perfil con teléfono vacío (opcional)", () => {
    const r = esquemaPerfil.safeParse({ nombre: "Dave", apellidos: "Cliente", telefono: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.telefono).toBeNull();
  });

  it("rechaza teléfono inválido", () => {
    expect(
      esquemaPerfil.safeParse({ nombre: "Dave", apellidos: "Cliente", telefono: "abc" }).success
    ).toBe(false);
  });
});
