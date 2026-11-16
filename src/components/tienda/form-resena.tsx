"use client";

import { useEffect, useState, useActionState } from "react";
import Link from "next/link";
import { Star, Send, MessageSquare } from "lucide-react";
import { crearResena } from "@/server/actions/carrito";
import { toast } from "@/components/ui/toaster";
import { Spinner } from "@/components/ui/spinner";
import type { ResultadoAccion } from "@/types";
import { cn } from "@/lib/utils/cn";

interface Props {
  productoId: string;
  logueado: boolean;
  nombreUsuario?: string;
}

const ESTADO_INICIAL: ResultadoAccion = { ok: false };

/** Formulario de reseña (requiere sesión). */
export function FormResena({ productoId, logueado, nombreUsuario }: Props) {
  const [estado, action, pendiente] = useActionState(crearResena, ESTADO_INICIAL);
  const [calificacion, setCalificacion] = useState(5);

  useEffect(() => {
    if (estado.ok) {
      toast.success((estado.datos?.mensaje as string) ?? "¡Gracias por tu reseña!");
    }
  }, [estado]);

  if (!logueado) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-card border border-dashed border-beige-dark bg-white/70 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm text-marron/70">
          <MessageSquare className="h-4 w-4 text-tomate" aria-hidden />
          ¿Ya lo probaste? Comparte tu opinión con la comunidad.
        </p>
        <Link href="/auth/login" className="btn-outline shrink-0 px-5 py-2.5">
          Inicia sesión para opinar
        </Link>
      </div>
    );
  }

  return (
    <form id="form-resena" action={action} className="rounded-card border border-beige-dark/60 bg-white p-5">
      <h3 className="font-display text-lg font-bold text-marron">
        Escribe una reseña{nombreUsuario ? `, ${nombreUsuario}` : ""}
      </h3>

      {estado.error && (
        <p
          className="mt-3 rounded-xl border border-tomate/20 bg-tomate/10 px-4 py-3 text-sm font-medium text-tomate"
          role="alert"
        >
          {estado.error}
        </p>
      )}

      <input type="hidden" name="productoId" value={productoId} />
      <input type="hidden" name="calificacion" value={calificacion} />

      <div className="mt-4">
        <span className="etiqueta">Tu calificación</span>
        <div className="flex gap-1.5" role="radiogroup" aria-label="Calificación">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={calificacion === n}
              aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
              onClick={() => setCalificacion(n)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  "h-7 w-7",
                  n <= calificacion ? "fill-naranja text-naranja" : "fill-beige-dark/50 text-beige-dark"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="titulo-resena" className="etiqueta">
          Título
        </label>
        <input
          id="titulo-resena"
          name="titulo"
          required
          minLength={3}
          maxLength={80}
          placeholder="Ej.: El mejor buldak que he probado"
          className={cn("campo", estado.campo === "titulo" && "campo-error")}
        />
        {estado.campo === "titulo" && (
          <p className="mt-1.5 text-xs font-medium text-tomate" role="alert">
            {estado.error}
          </p>
        )}
      </div>

      <div className="mt-4">
        <label htmlFor="comentario-resena" className="etiqueta">
          Comentario
        </label>
        <textarea
          id="comentario-resena"
          name="comentario"
          required
          minLength={10}
          maxLength={600}
          rows={4}
          placeholder="Cuéntanos qué te pareció el sabor, la textura, la entrega…"
          className={cn("campo min-h-24 resize-y", estado.campo === "comentario" && "campo-error")}
        />
        {estado.campo === "comentario" && (
          <p className="mt-1.5 text-xs font-medium text-tomate" role="alert">
            {estado.error}
          </p>
        )}
      </div>

      <button type="submit" disabled={pendiente} className="btn-primary mt-4 px-6 py-3">
        {pendiente ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" aria-hidden />}
        Publicar reseña
      </button>
    </form>
  );
}
