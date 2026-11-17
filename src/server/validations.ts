import { z } from "zod";

/* ============================================================
   Validaciones Zod — compartidas entre formularios (cliente)
   y Server Actions (servidor). El servidor SIEMPRE valida.
   ============================================================ */

const email = z
  .email("Ingresa un correo válido")
  .max(160, "El correo es demasiado largo")
  .transform((v) => v.toLowerCase().trim());

export const PASSWORD_MINIMO = 8;

export const password = z
  .string()
  .min(PASSWORD_MINIMO, `La contraseña debe tener al menos ${PASSWORD_MINIMO} caracteres`)
  .max(72, "La contraseña es demasiado larga")
  .regex(/[A-Z]/, "Debe incluir al menos una mayúscula")
  .regex(/[0-9]/, "Debe incluir al menos un número");

const nombre = z
  .string()
  .min(2, "Ingresa tu nombre")
  .max(60, "Máximo 60 caracteres")
  .regex(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñü\s'-]+$/, "Solo se permiten letras");

/* ---------------- Autenticación ---------------- */

export const esquemaRegistro = z
  .object({
    nombre,
    apellidos: nombre,
    email,
    password,
    confirmar: z.string(),
    aceptaTerminos: z.literal(true, { message: "Debes aceptar los términos" }),
  })
  .refine((d) => d.password === d.confirmar, {
    path: ["confirmar"],
    message: "Las contraseñas no coinciden",
  });

export const esquemaLogin = z.object({
  email,
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export const esquemaRecuperar = z.object({ email });

export const esquemaRestablecer = z
  .object({
    token: z.string().min(10, "Token inválido"),
    password,
    confirmar: z.string(),
  })
  .refine((d) => d.password === d.confirmar, {
    path: ["confirmar"],
    message: "Las contraseñas no coinciden",
  });

/** Nueva contraseña sin token (modo Supabase Auth: la sesión de
 *  recuperación viene en la cookie, no en un parámetro). */
export const esquemaPasswordNueva = z
  .object({
    password,
    confirmar: z.string(),
  })
  .refine((d) => d.password === d.confirmar, {
    path: ["confirmar"],
    message: "Las contraseñas no coinciden",
  });

export const esquemaCambiarPassword = z
  .object({
    actual: z.string().min(1, "Ingresa tu contraseña actual"),
    nueva: password,
    confirmar: z.string(),
  })
  .refine((d) => d.nueva === d.confirmar, {
    path: ["confirmar"],
    message: "Las contraseñas no coinciden",
  })
  .refine((d) => d.actual !== d.nueva, {
    path: ["nueva"],
    message: "La nueva contraseña debe ser distinta",
  });

export const esquemaPerfil = z.object({
  nombre,
  apellidos: nombre,
  telefono: z
    .string()
    .regex(/^[0-9+\s()-]{7,20}$/, "Teléfono inválido")
    .or(z.literal(""))
    .optional()
    .transform((v) => (v ? v : null)),
});

/* ---------------- Direcciones ---------------- */

export const DEPARTAMENTOS = [
  "Amazonas",
  "Áncash",
  "Apurímac",
  "Arequipa",
  "Ayacucho",
  "Cajamarca",
  "Callao",
  "Cusco",
  "Huancavelica",
  "Huanuco",
  "Ica",
  "Junín",
  "La Libertad",
  "Lambayeque",
  "Lima",
  "Loreto",
  "Madre de Dios",
  "Moquegua",
  "Pasco",
  "Piura",
  "Puno",
  "San Martín",
  "Tacna",
  "Tumbes",
  "Ucayali",
] as const;

export const esquemaDireccion = z.object({
  nombreCompleto: z.string().min(4, "Ingresa el nombre completo").max(120),
  telefono: z.string().regex(/^[0-9+\s()-]{7,20}$/, "Teléfono inválido"),
  departamento: z.string().min(2, "Selecciona un departamento"),
  provincia: z.string().min(2, "Ingresa la provincia"),
  distrito: z.string().min(2, "Ingresa el distrito"),
  direccion: z.string().min(5, "Ingresa la dirección").max(180),
  referencia: z.string().max(160).optional().or(z.literal("")),
  indicaciones: z.string().max(300).optional().or(z.literal("")),
  porDefecto: z.boolean().optional(),
});

/* ---------------- Checkout ---------------- */

export const esquemaCheckout = z.object({
  items: z
    .array(
      z.object({
        productoId: z.string().min(1),
        cantidad: z.number().int().min(1).max(99),
      })
    )
    .min(1, "Tu carrito está vacío"),
  // Yape es el único medio de pago habilitado en la tienda.
  metodoPago: z.enum(["yape"]),
  metodoEnvio: z.enum(["recojo_tienda", "delivery_local"]),
  cuponCodigo: z.string().max(30).optional().or(z.literal("")),
  direccion: esquemaDireccion,
  notas: z.string().max(400).optional().or(z.literal("")),
  // Aceptado pero SIEMPRE recalculado en servidor:
  aceptaTerminos: z.literal(true, { message: "Debes aceptar los términos" }),
});

/* ---------------- Reseñas ---------------- */

export const esquemaResena = z.object({
  productoId: z.string().min(1),
  calificacion: z.number().int().min(1).max(5),
  titulo: z.string().min(3, "Ponle un título").max(80),
  comentario: z.string().min(10, "Cuéntanos un poco más (mínimo 10 caracteres)").max(600),
});

/* ---------------- Newsletter ---------------- */

export const esquemaNewsletter = z.object({ email });

/* ---------------- Productos (admin) ---------------- */

export const esquemaProducto = z.object({
  nombre: z.string().min(3, "Nombre muy corto").max(120),
  nombreOriginal: z.string().max(60).optional().or(z.literal("")),
  slug: z
    .string()
    .min(3, "Slug muy corto")
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  descripcion: z.string().min(10, "Descripción muy corta").max(400),
  descripcionLarga: z.string().max(2000).optional().or(z.literal("")),
  precio: z.number().min(0.5, "Precio mínimo S/ 0.50").max(9999),
  precioAnterior: z
    .number()
    .min(0)
    .max(9999)
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  categoriaSlug: z.string().min(1),
  marcaSlug: z.string().min(1),
  pais: z.enum(["japon", "corea"]),
  stock: z.number().int().min(0, "Stock no puede ser negativo").max(99999),
  stockMinimo: z.number().int().min(0).max(9999),
  destacado: z.boolean(),
  activo: z.boolean(),
  etiquetas: z.string().max(200).optional().or(z.literal("")),
  peso: z.string().max(30).optional().or(z.literal("")),
  preparacion: z.string().max(400).optional().or(z.literal("")),
  ingredientes: z.string().max(1000).optional().or(z.literal("")),
  alergenos: z.string().max(300).optional().or(z.literal("")),
  imagenes: z.string().max(2400),
}).refine(
  (d) => {
    const imagenes = d.imagenes
      .split(/\r?\n/)
      .map((imagen) => imagen.trim())
      .filter(Boolean);
    return (
      imagenes.length >= 1 &&
      imagenes.length <= 12 &&
      imagenes.every((imagen) => imagen.length <= 300) &&
      new Set(imagenes).size === imagenes.length
    );
  },
  {
    path: ["imagenes"],
    message: "Agrega entre 1 y 12 imágenes distintas (máximo 300 caracteres cada una)",
  }
);

/* ---------------- Cupones (admin) ---------------- */

export const esquemaCupon = z
  .object({
    codigo: z
      .string()
      .min(3, "Código muy corto")
      .max(30)
      .regex(/^[A-Za-z0-9-]+$/, "Solo letras, números y guiones")
      .transform((v) => v.toUpperCase()),
    tipo: z.enum(["porcentaje", "fijo"]),
    valor: z.number().min(1, "Valor mínimo 1").max(10000),
    activo: z.boolean(),
    fechaInicio: z.string().optional().or(z.literal("")),
    fechaFin: z.string().optional().or(z.literal("")),
    usosMaximos: z
      .number()
      .int()
      .min(1)
      .max(100000)
      .nullable()
      .optional()
      .or(z.literal("").transform(() => null)),
    compraMinima: z
      .number()
      .min(0)
      .max(99999)
      .nullable()
      .optional()
      .or(z.literal("").transform(() => null)),
    descripcion: z.string().max(200).optional().or(z.literal("")),
  })
  .refine((d) => !(d.fechaFin && d.fechaInicio && d.fechaFin < d.fechaInicio), {
    path: ["fechaFin"],
    message: "La fecha final debe ser posterior a la inicial",
  })
  .refine((d) => d.tipo !== "porcentaje" || d.valor <= 100, {
    path: ["valor"],
    message: "El porcentaje no puede superar 100",
  });

/* ---------------- Configuración (admin) ---------------- */

export const esquemaConfiguracion = z.object({
  nombre: z.string().min(2).max(60),
  lema: z.string().max(120),
  telefono: z.string().max(30),
  correo: z.email("Correo inválido"),
  direccion: z.string().max(160),
  horario: z.string().max(120),
  instagram: z.string().max(200).optional().or(z.literal("")),
  tiktok: z.string().max(200).optional().or(z.literal("")),
  facebook: z.string().max(200).optional().or(z.literal("")),
  whatsapp: z.string().max(200).optional().or(z.literal("")),
  envioCostoLocal: z.number().min(0).max(500),
  envioGratisDesde: z.number().min(0).max(9999),
  recojoGratuito: z.boolean(),
  autollenarUbicacionCheckout: z.boolean(),
  cuponInicioId: z.string().max(120),
  mensajeBoasvindas: z.string().max(200),
  pagoYape: z.boolean(),
  pagoPlin: z.boolean(),
  pagoTransferencia: z.boolean(),
  pagoContraEntrega: z.boolean(),
  pagoPasarela: z.boolean(),
});

/* ---------------- Tipos para formularios ---------------- */

export type DatosRegistro = z.infer<typeof esquemaRegistro>;
export type DatosLogin = z.infer<typeof esquemaLogin>;
export type DatosCheckout = z.infer<typeof esquemaCheckout>;
export type DatosDireccion = z.infer<typeof esquemaDireccion>;
export type DatosProducto = z.infer<typeof esquemaProducto>;
export type DatosCupon = z.infer<typeof esquemaCupon>;
export type DatosConfiguracion = z.infer<typeof esquemaConfiguracion>;
export type DatosResena = z.infer<typeof esquemaResena>;
export type DatosPerfil = z.infer<typeof esquemaPerfil>;
