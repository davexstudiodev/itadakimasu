import { generateText } from "ai";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { getUsuarioActual } from "@/lib/auth";
import { getProvider } from "@/lib/data";
import { limitar } from "@/lib/rate-limit";
import {
  extensionImagen,
  firmaImagenValida,
  MAX_TAMANO_IMAGEN,
} from "@/lib/utils/validar-imagen";

export const runtime = "nodejs";
export const maxDuration = 120;

const SolicitudAnuncio = z.object({
  productoId: z.string().min(1).max(120),
  imagenIndex: z.number().int().min(0).max(11),
  formato: z.enum(["cuadrado", "historia", "banner"]),
  estilo: z.enum(["minimalista", "vibrante", "premium", "kawaii"]),
  instrucciones: z.string().max(400).default(""),
});

const FORMATOS = {
  cuadrado: "cuadrado 1:1, para una publicación de Instagram",
  historia: "vertical 9:16, para una historia o reel",
  banner: "panorámico 16:9, para un banner web",
} as const;

const ESTILOS = {
  minimalista: "minimalista, limpio, con fondo claro y espacio visual",
  vibrante: "vibrante, alegre, con colores apetitosos y energía juvenil",
  premium: "premium, elegante, iluminación de estudio y composición refinada",
  kawaii: "kawaii, simpático y tierno, con detalles gráficos japoneses sutiles",
} as const;

const ASPECT_RATIOS = {
  cuadrado: "1:1",
  historia: "9:16",
  banner: "16:9",
} as const;

async function leerFotoProducto(src: string, requestUrl: string) {
  let bytes: Uint8Array;
  let mime: string;

  if (src.startsWith("/") && !src.startsWith("//")) {
    let rutaDecodificada: string;
    try {
      rutaDecodificada = decodeURIComponent(src.split("?")[0]).replace(/^\/+/, "");
    } catch {
      throw new Error("La ruta de la foto no es válida.");
    }
    const carpetaPublica = path.resolve(process.cwd(), "public");
    const archivo = path.resolve(carpetaPublica, rutaDecodificada);
    if (!archivo.startsWith(`${carpetaPublica}${path.sep}`)) {
      throw new Error("La ruta de la foto no es válida.");
    }
    bytes = new Uint8Array(await readFile(archivo));
    const extension = path.extname(archivo).toLowerCase();
    mime = extension === ".png" ? "image/png" : extension === ".webp" ? "image/webp" : "image/jpeg";
  } else {
    let url: URL;
    try {
      url = new URL(src);
    } catch {
      throw new Error("La foto del producto no tiene una dirección válida.");
    }

    const dominiosPermitidos = new Set<string>([new URL(requestUrl).host]);
    const urlSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (urlSupabase) dominiosPermitidos.add(new URL(urlSupabase).host);
    const esOrigenLocal = url.origin === new URL(requestUrl).origin;
    if ((!esOrigenLocal && url.protocol !== "https:") || !dominiosPermitidos.has(url.host)) {
      throw new Error("Sube primero esta foto al almacenamiento de la tienda para poder generar el anuncio.");
    }

    const respuesta = await fetch(url, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (!respuesta.ok) throw new Error("No se pudo cargar la foto del producto.");
    const tamano = Number(respuesta.headers.get("content-length") ?? 0);
    if (tamano > MAX_TAMANO_IMAGEN) throw new Error("La foto supera el límite de 4 MB.");
    mime = respuesta.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    const extension = extensionImagen(mime);
    if (!extension) throw new Error("La foto debe ser JPG, PNG o WebP.");
    const buffer = await respuesta.arrayBuffer();
    if (buffer.byteLength > MAX_TAMANO_IMAGEN) throw new Error("La foto supera el límite de 4 MB.");
    bytes = new Uint8Array(buffer);
  }

  if (!extensionImagen(mime) || bytes.length === 0 || bytes.length > MAX_TAMANO_IMAGEN) {
    throw new Error("La foto debe ser JPG, PNG o WebP y pesar hasta 4 MB.");
  }
  if (!firmaImagenValida(mime, bytes.slice(0, 12))) {
    throw new Error("El archivo de foto no es una imagen válida.");
  }
  return { bytes, mime };
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return Response.json({ error: "Solicitud no permitida." }, { status: 403 });
  }

  const admin = await getUsuarioActual();
  if (!admin) return Response.json({ error: "Tu sesión expiró. Inicia sesión de nuevo." }, { status: 401 });
  if (admin.rol !== "admin") return Response.json({ error: "No tienes permisos de administrador." }, { status: 403 });

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return Response.json({ error: "La solicitud no tiene un formato válido." }, { status: 400 });
  }
  const parseado = SolicitudAnuncio.safeParse(cuerpo);
  if (!parseado.success) {
    return Response.json({ error: "Revisa el producto, formato, estilo e instrucciones." }, { status: 400 });
  }
  if (!limitar(`anuncio:${admin.id}`, 5)) {
    return Response.json({ error: "Ya se hicieron varias generaciones. Espera un minuto." }, { status: 429 });
  }

  const producto = await getProvider().getProductoPorId(parseado.data.productoId);
  if (!producto || !producto.activo) {
    return Response.json({ error: "El producto no está disponible para anunciar." }, { status: 404 });
  }
  const foto = producto.imagenes[parseado.data.imagenIndex];
  if (!foto) return Response.json({ error: "El producto no tiene esa foto." }, { status: 400 });

  let imagenProducto: Awaited<ReturnType<typeof leerFotoProducto>>;
  try {
    imagenProducto = await leerFotoProducto(foto, request.url);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo leer la foto del producto." },
      { status: 400 }
    );
  }

  const datosProducto = [
    `Nombre: ${producto.nombre}`,
    `Marca: ${producto.marcaSlug.replaceAll("-", " ")}`,
    `Origen: ${producto.pais === "japon" ? "Japón" : "Corea del Sur"}`,
    `Precio actual: S/ ${producto.precio.toFixed(2)}`,
    `Descripción aprobada: ${producto.descripcion.slice(0, 800)}`,
    producto.precioAnterior && producto.precioAnterior > producto.precio
      ? `Precio anterior: S/ ${producto.precioAnterior.toFixed(2)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = [
    "Crea una pieza publicitaria visual original para una tienda peruana de productos japoneses y coreanos.",
    `Formato: ${FORMATOS[parseado.data.formato]}.`,
    `Dirección de arte: ${ESTILOS[parseado.data.estilo]}.`,
    "Usa la foto adjunta como referencia del producto y conserva su envase, logotipo y aspecto reconocible, sin sustituirlo por otro producto.",
    "Haz una composición atractiva para comercio electrónico, iluminación de estudio y fondo limpio. No agregues texto, letras, logotipos nuevos, descuentos ni afirmaciones dentro de la imagen; el texto de anuncio se entrega aparte.",
    `Datos verificados del producto:\n${datosProducto}`,
    parseado.data.instrucciones.trim()
      ? `Preferencias adicionales del administrador (sin contradecir los datos): ${parseado.data.instrucciones.trim()}`
      : "",
    "Devuelve también una frase breve de anuncio en español, basada únicamente en los datos verificados. No inventes ingredientes, beneficios, promociones, disponibilidad ni garantías.",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const resultado = await generateText({
      model: "google/gemini-3.1-flash-image",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "file", mediaType: imagenProducto.mime, data: imagenProducto.bytes },
          ],
        },
      ],
      providerOptions: {
        google: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: { aspectRatio: ASPECT_RATIOS[parseado.data.formato], imageSize: "1K" },
          thinkingConfig: { thinkingLevel: "minimal" },
        },
      },
      abortSignal: AbortSignal.timeout(100_000),
    });

    const imagenGenerada = resultado.files.find((archivo) => archivo.mediaType.startsWith("image/"));
    if (!imagenGenerada) {
      return Response.json({ error: "La IA no devolvió una imagen. Prueba con otra foto." }, { status: 502 });
    }
    return new Response(Buffer.from(imagenGenerada.uint8Array), {
      headers: {
        "Content-Type": imagenGenerada.mediaType,
        "X-Anuncio-Texto": encodeURIComponent(resultado.text.trim()),
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json(
      { error: "No se pudo generar el anuncio. Revisa la conexión de IA o intenta de nuevo más tarde." },
      { status: 502 }
    );
  }
}
