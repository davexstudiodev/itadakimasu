import type { Categoria, ConfiguracionTienda, Cupon, Marca, Producto } from "@/types";

/* ============================================================
   CATÁLOGO VACÍO
   Los productos se agregan desde el panel administrativo.
   */

export const CATEGORIAS_SEED: Categoria[] = [
  {
    slug: "buldak",
    nombre: "Buldak",
    descripcion: "El picante coreano que encendió el mundo: 불닭볶음면 en todos sus sabores.",
    icono: "flame",
    orden: 1,
  },
  {
    slug: "ramen",
    nombre: "Ramen",
    descripcion: "Fideos instantáneos de Japón y Corea para un caldo lleno de umami.",
    icono: "bowl",
    orden: 2,
  },
  {
    slug: "snacks",
    nombre: "Snacks",
    descripcion: "Botanas crujientes de Tokio, Seúl y todo lo que queda en el camino.",
    icono: "cookie",
    orden: 3,
  },
  {
    slug: "dulces",
    nombre: "Dulces",
    descripcion: "Mochis, galletas y golosinas con el toque kawaii que endulza el día.",
    icono: "candy",
    orden: 4,
  },
  {
    slug: "bebidas",
    nombre: "Bebidas",
    descripcion: "Ramune, soju sin alcohol y refrescos que no encuentras en cualquier lado.",
    icono: "cup",
    orden: 5,
  },
  {
    slug: "comida",
    nombre: "Comida",
    descripcion: "Platos coreanos listos para preparar en minutos.",
    icono: "utensils",
    orden: 6,
  },
  {
    slug: "combos",
    nombre: "Combos",
    descripcion: "Arma tu antojo con packs especiales y ahorra en cada pedido.",
    icono: "package",
    orden: 7,
  },
];

export const MARCAS_SEED: Marca[] = [
  { slug: "samyang", nombre: "Samyang", pais: "corea" },
  { slug: "nongshim", nombre: "Nongshim", pais: "corea" },
  { slug: "lotte", nombre: "Lotte", pais: "corea" },
  { slug: "orion", nombre: "Orion", pais: "corea" },
  { slug: "jinro", nombre: "HiteJinro", pais: "corea" },
  { slug: "sempio", nombre: "Sempio", pais: "corea" },
  { slug: "nissin", nombre: "Nissin", pais: "japon" },
  { slug: "glico", nombre: "Glico", pais: "japon" },
  { slug: "maruchan", nombre: "Maruchan", pais: "japon" },
  { slug: "sangaria", nombre: "Sangaria", pais: "japon" },
  { slug: "fujiya", nombre: "Fujiya", pais: "japon" },
  { slug: "nestle", nombre: "Nestlé", pais: "japon" },
  { slug: "asahi", nombre: "Asahi", pais: "japon" },
  { slug: "suntory", nombre: "Suntory", pais: "japon" },
  { slug: "yamaya", nombre: "Yamaya", pais: "japon" },
  { slug: "itadakimasu", nombre: "ITADAKIMASU", pais: "japon" },
];

export const PRODUCTOS_SEED: Producto[] = [];

export const CUPONES_SEED: Cupon[] = [
  {
    id: "cup-001",
    codigo: "BIENVENIDO10",
    tipo: "porcentaje",
    valor: 10,
    activo: true,
    fechaInicio: "2026-01-01T00:00:00.000Z",
    fechaFin: null,
    usosMaximos: 1000,
    usosActuales: 0,
    compraMinima: 30,
    descripcion: "10% de descuento en tu primera compra desde S/ 30.",
  },
  {
    id: "cup-002",
    codigo: "BULDAK5",
    tipo: "fijo",
    valor: 5,
    activo: true,
    fechaInicio: "2026-01-01T00:00:00.000Z",
    fechaFin: null,
    usosMaximos: 500,
    usosActuales: 0,
    compraMinima: 40,
    descripcion: "S/ 5 de descuento en pedidos desde S/ 40.",
  },
];

export const CONFIG_SEED: ConfiguracionTienda = {
  nombre: "ITADAKIMASU",
  lema: "Tu antojo asiático comienza aquí.",
  telefono: "+51 946 002 100",
  correo: "hola@itadakimasu.pe",
  direccion: "Jr. Los Pescadores 123, Puerto Malabrigo, Rázuri, Ascope, La Libertad",
  horario: "Lun a Sáb · 10:00 – 20:00",
  redes: {
    instagram: "https://instagram.com/itadakimasu.pe",
    tiktok: "https://tiktok.com/@itadakimasu.pe",
    facebook: "https://facebook.com/itadakimasu.pe",
    whatsapp: "https://wa.me/51946002100",
  },
  envioCostoLocal: 0,
  envioGratisDesde: 0,
  recojoGratuito: true,
  metodosPago: {
    yape: true,
    plin: false,
    transferencia: false,
    contraEntrega: false,
    pasarela: false,
  },
  mensajeBoasvindas: "¡Bienvenido a ITADAKIMASU! Envío gratis en todos los pedidos.",
};
