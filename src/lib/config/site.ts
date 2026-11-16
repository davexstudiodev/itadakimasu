/** Configuración estática del sitio (complementada por store_settings en BD). */
export const siteConfig = {
  name: "ITADAKIMASU",
  nombreJp: "いただきます",
  tagline: "Comida japonesa y coreana",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: "hola@itadakimasu.pe",
  telefono: "+51 987 654 321",
  direccion: "Jr. Los Pescadores 123, Puerto Malabrigo, Rázuri, Ascope, La Libertad",
  horario: "Lun a Sáb · 10:00 – 20:00",
  redes: {
    instagram: "https://instagram.com/itadakimasu.pe",
    tiktok: "https://tiktok.com/@itadakimasu.pe",
    facebook: "https://facebook.com/itadakimasu.pe",
    whatsapp: "https://wa.me/51987654321",
  },
} as const;
