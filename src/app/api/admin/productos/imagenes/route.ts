import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getUsuarioActual } from "@/lib/auth";
import { limitar } from "@/lib/rate-limit";
import {
  extensionImagen,
  firmaImagenValida,
  MAX_TAMANO_IMAGEN,
  MIME_IMAGENES_PERMITIDOS,
} from "@/lib/utils/validar-imagen";

export const runtime = "nodejs";

const NOMBRE_BUCKET_POR_DEFECTO = "producto-imagenes";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return Response.json({ error: "Solicitud no permitida." }, { status: 403 });
  }

  const admin = await getUsuarioActual();
  if (!admin) return Response.json({ error: "Tu sesión expiró. Inicia sesión de nuevo." }, { status: 401 });
  if (admin.rol !== "admin") return Response.json({ error: "No tienes permisos de administrador." }, { status: 403 });
  if (!limitar(`upload:${admin.id}`, 30)) {
    return Response.json({ error: "Has subido muchas imágenes. Espera un minuto." }, { status: 429 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json(
      { error: "Configura NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para subir imágenes." },
      { status: 503 }
    );
  }

  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data;")) {
    return Response.json({ error: "Envía la imagen como archivo multipart." }, { status: 415 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "No se pudo leer el archivo enviado." }, { status: 400 });
  }

  const archivos = formData.getAll("archivo");
  const archivo = archivos[0];
  if (archivos.length !== 1 || !(archivo instanceof File)) {
    return Response.json({ error: "Selecciona un solo archivo de imagen." }, { status: 400 });
  }

  const extension = extensionImagen(archivo.type);
  if (!extension) {
    return Response.json({ error: "Formato no permitido. Usa JPG, PNG o WebP." }, { status: 415 });
  }
  if (archivo.size === 0 || archivo.size > MAX_TAMANO_IMAGEN) {
    return Response.json({ error: "Cada imagen debe pesar más de 0 y hasta 4 MB." }, { status: 413 });
  }

  const cabecera = new Uint8Array(await archivo.slice(0, 12).arrayBuffer());
  if (!firmaImagenValida(archivo.type, cabecera)) {
    return Response.json({ error: "El archivo no coincide con un JPG, PNG o WebP válido." }, { status: 415 });
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || NOMBRE_BUCKET_POR_DEFECTO;
  if (!/^[a-z0-9][a-z0-9_-]{1,61}[a-z0-9]$/i.test(bucket)) {
    return Response.json({ error: "El nombre del bucket de imágenes no es válido." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data: buckets, error: errorBuckets } = await supabase.storage.listBuckets();
  if (errorBuckets) {
    return Response.json({ error: `No se pudo revisar Supabase Storage: ${errorBuckets.message}` }, { status: 502 });
  }

  let bucketPublico = buckets.find((existente) => existente.name === bucket)?.public ?? false;
  if (!buckets.some((existente) => existente.name === bucket)) {
    const { error: errorCrear } = await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: MAX_TAMANO_IMAGEN,
      allowedMimeTypes: MIME_IMAGENES_PERMITIDOS,
    });

    if (errorCrear) {
      const { data: bucketsActualizados, error: errorRevisar } = await supabase.storage.listBuckets();
      if (errorRevisar) {
        return Response.json({ error: `No se pudo crear el bucket público: ${errorCrear.message}` }, { status: 502 });
      }
      bucketPublico =
        bucketsActualizados.find((existente) => existente.name === bucket)?.public ?? false;
      if (!bucketPublico) {
        return Response.json({ error: `No se pudo crear el bucket público "${bucket}": ${errorCrear.message}` }, { status: 502 });
      }
    } else {
      bucketPublico = true;
    }
  }

  if (!bucketPublico) {
    return Response.json(
      { error: `El bucket "${bucket}" existe, pero debe ser público para mostrar imágenes en la tienda.` },
      { status: 409 }
    );
  }

  const ruta = `${admin.id}/${randomUUID()}.${extension}`;
  const { data, error: errorSubir } = await supabase.storage
    .from(bucket)
    .upload(ruta, archivo, {
      cacheControl: "31536000",
      contentType: archivo.type,
      upsert: false,
    });

  if (errorSubir) {
    return Response.json({ error: `No se pudo subir la imagen a Supabase Storage: ${errorSubir.message}` }, { status: 502 });
  }

  const { data: imagenPublica } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return Response.json({ url: imagenPublica.publicUrl }, { headers: { "Cache-Control": "no-store" } });
}
