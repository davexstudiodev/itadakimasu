"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, ImagePlus, LoaderCircle, Sparkles, WandSparkles } from "lucide-react";
import { ImagenProducto } from "@/components/ui/imagen-producto";
import { formatPEN } from "@/lib/utils/format";

interface ProductoAnuncio {
  id: string;
  slug: string;
  nombre: string;
  marcaSlug: string;
  pais: "japon" | "corea";
  precio: number;
  descripcion: string;
  imagenes: string[];
}

type Formato = "cuadrado" | "historia" | "banner";
type Estilo = "minimalista" | "vibrante" | "premium" | "kawaii";

interface ResultadoAnuncio {
  imagenUrl: string;
  tipoImagen: string;
  texto: string;
}

export function GeneradorAnuncios({ productos }: { productos: ProductoAnuncio[] }) {
  const [productoId, setProductoId] = useState(productos[0]?.id ?? "");
  const [imagenIndex, setImagenIndex] = useState(0);
  const [formato, setFormato] = useState<Formato>("cuadrado");
  const [estilo, setEstilo] = useState<Estilo>("vibrante");
  const [instrucciones, setInstrucciones] = useState("");
  const [resultado, setResultado] = useState<ResultadoAnuncio | null>(null);
  const [textoAnuncio, setTextoAnuncio] = useState("");
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState("");
  const producto = productos.find((p) => p.id === productoId) ?? productos[0];
  const fotoSeleccionada = producto?.imagenes[imagenIndex] ?? producto?.imagenes[0];

  const generar = async () => {
    if (!producto || !fotoSeleccionada || generando) return;
    setGenerando(true);
    setError("");
    setResultado(null);
    setTextoAnuncio("");
    try {
      const respuesta = await fetch("/api/admin/anuncios/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productoId: producto.id, imagenIndex, formato, estilo, instrucciones }),
      });
      if (!respuesta.ok) {
        const datos = (await respuesta.json()) as { error?: string };
        setError(datos.error ?? "No se pudo generar el anuncio.");
        return;
      }
      const archivo = await respuesta.blob();
      const datos: ResultadoAnuncio = {
        imagenUrl: URL.createObjectURL(archivo),
        tipoImagen: archivo.type || "image/png",
        texto: decodeURIComponent(respuesta.headers.get("X-Anuncio-Texto") ?? ""),
      };
      setResultado(datos);
      setTextoAnuncio(datos.texto);
    } catch {
      setError("No se pudo conectar con el generador. Intenta nuevamente.");
    } finally {
      setGenerando(false);
    }
  };

  useEffect(() => {
    if (!resultado?.imagenUrl) return;
    return () => URL.revokeObjectURL(resultado.imagenUrl);
  }, [resultado?.imagenUrl]);

  const copiarTexto = async () => {
    try {
      await navigator.clipboard.writeText(textoAnuncio);
    } catch {
      setError("No se pudo copiar el texto. Selecciónalo y cópialo manualmente.");
    }
  };

  const extension = resultado?.tipoImagen === "image/jpeg" ? "jpg" : resultado?.tipoImagen.split("/")[1] ?? "png";
  const proporciones = formato === "historia" ? "mx-auto aspect-[9/16] max-w-sm" : formato === "banner" ? "aspect-video" : "aspect-square";

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
      <section className="rounded-card border border-beige-dark/60 bg-white p-5 shadow-card sm:p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-marron">
          <ImagePlus className="h-5 w-5 text-tomate" aria-hidden="true" />
          Producto y formato
        </h2>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="productoAnuncio" className="etiqueta">Producto</label>
            <select
              id="productoAnuncio"
              value={productoId}
              onChange={(evento) => {
                setProductoId(evento.target.value);
                setImagenIndex(0);
                setResultado(null);
                setTextoAnuncio("");
              }}
              className="campo"
            >
              {productos.map((item) => (
                <option key={item.id} value={item.id}>{item.nombre}</option>
              ))}
            </select>
            {producto && (
              <p className="mt-1 text-xs text-marron/60">
                {producto.marcaSlug.replaceAll("-", " ")} · {producto.pais === "japon" ? "Japón" : "Corea del Sur"} · {formatPEN(producto.precio)}
              </p>
            )}
          </div>

          {producto && producto.imagenes.length > 0 && (
            <div>
              <p className="etiqueta">Foto de referencia</p>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {producto.imagenes.map((imagen, indice) => (
                  <button
                    key={`${imagen}-${indice}`}
                    type="button"
                    aria-label={`Usar foto ${indice + 1} de ${producto.nombre}`}
                    aria-pressed={imagenIndex === indice}
                    onClick={() => {
                      setImagenIndex(indice);
                      setResultado(null);
                      setTextoAnuncio("");
                    }}
                    className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white ${imagenIndex === indice ? "border-tomate" : "border-beige-dark/60"}`}
                  >
                    <ImagenProducto src={imagen} alt={`${producto.nombre}, foto ${indice + 1}`} fill sizes="80px" className="object-contain p-1" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="formatoAnuncio" className="etiqueta">Formato</label>
              <select id="formatoAnuncio" value={formato} onChange={(e) => setFormato(e.target.value as Formato)} className="campo">
                <option value="cuadrado">Cuadrado · publicación</option>
                <option value="historia">Vertical · historia o reel</option>
                <option value="banner">Horizontal · banner web</option>
              </select>
            </div>
            <div>
              <label htmlFor="estiloAnuncio" className="etiqueta">Estilo visual</label>
              <select id="estiloAnuncio" value={estilo} onChange={(e) => setEstilo(e.target.value as Estilo)} className="campo">
                <option value="vibrante">Vibrante</option>
                <option value="minimalista">Minimalista</option>
                <option value="premium">Premium</option>
                <option value="kawaii">Kawaii</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="instruccionesAnuncio" className="etiqueta">Idea adicional (opcional)</label>
            <textarea
              id="instruccionesAnuncio"
              value={instrucciones}
              onChange={(e) => setInstrucciones(e.target.value.slice(0, 400))}
              maxLength={400}
              rows={3}
              placeholder="Ej.: ambiente de verano, colores rojos y crema"
              className="campo resize-y"
            />
            <p className="mt-1 text-right text-[11px] text-marron/50">{instrucciones.length}/400</p>
          </div>

          <div className="rounded-xl border border-naranja/25 bg-naranja/5 p-3 text-xs leading-relaxed text-marron/70">
            El generador usa la foto y los datos del producto. Cada generación puede consumir créditos del servicio de IA.
          </div>

          {error && <p role="alert" className="rounded-xl border border-tomate/20 bg-tomate/10 px-3 py-2.5 text-sm text-tomate">{error}</p>}

          <button type="button" onClick={generar} disabled={generando || !producto || !fotoSeleccionada} className="btn-primary w-full justify-center py-3.5">
            {generando ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <WandSparkles className="h-5 w-5" aria-hidden="true" />}
            {generando ? "Creando tu anuncio…" : "Generar anuncio"}
          </button>
          {generando && <p aria-live="polite" className="text-center text-xs text-marron/55">Puede tardar unos segundos mientras la IA prepara la imagen.</p>}
        </div>
      </section>

      <section className="rounded-card border border-beige-dark/60 bg-white p-5 shadow-card sm:p-6" aria-live="polite">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-marron">
          <Sparkles className="h-5 w-5 text-tomate" aria-hidden="true" />
          Vista previa
        </h2>

        {resultado ? (
          <div className="mt-4 space-y-4">
            <div className={`relative ${proporciones} overflow-hidden rounded-2xl bg-beige`}>
              <Image
                src={resultado.imagenUrl}
                alt={`Anuncio generado para ${producto?.nombre ?? "el producto"}`}
                fill
                unoptimized
                sizes="(max-width: 1280px) 90vw, 45vw"
                className="object-contain"
              />
            </div>
            <div>
              <label htmlFor="textoAnuncioGenerado" className="etiqueta">Texto sugerido por la IA</label>
              <textarea
                id="textoAnuncioGenerado"
                value={textoAnuncio}
                onChange={(e) => setTextoAnuncio(e.target.value)}
                rows={4}
                className="campo mt-1.5 resize-y"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <a
                href={resultado.imagenUrl}
                download={`itadakimasu-anuncio-${producto?.slug ?? "producto"}.${extension}`}
                className="btn-primary flex-1 justify-center px-4 py-2.5"
              >
                <Download className="h-4 w-4" aria-hidden="true" /> Descargar imagen
              </a>
              <button type="button" onClick={copiarTexto} disabled={!textoAnuncio.trim()} className="btn-outline flex-1 justify-center px-4 py-2.5">
                Copiar texto
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid min-h-72 place-items-center rounded-2xl border border-dashed border-beige-dark bg-crema/40 px-6 text-center">
            <div>
              <Sparkles className="mx-auto h-10 w-10 text-tomate/45" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-marron/65">Aquí aparecerá tu anuncio</p>
              <p className="mt-1 text-xs text-marron/50">Elige un producto y su foto para empezar.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
