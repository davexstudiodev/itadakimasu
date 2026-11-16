"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Mail, LoaderCircle, ArrowLeft, CircleCheck } from "lucide-react";
import { solicitarRecuperacion } from "@/server/actions/auth";
import type { ResultadoAccion } from "@/types";

const ESTADO_INICIAL: ResultadoAccion = { ok: false };

export function FormRecuperar() {
  const [estado, action, pendiente] = useActionState(solicitarRecuperacion, ESTADO_INICIAL);
  const [enviado, setEnviado] = useState(false);

  if (estado.ok && enviado) {
    const mensaje = (estado.datos?.mensaje as string) ?? "Si el correo existe, te enviaremos un enlace.";
    const aviso = Boolean(estado.datos?.aviso);
    return (
      <div className="text-center">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-hojita/15">
          <CircleCheck className="h-7 w-7 text-hojita" aria-hidden />
        </span>
        <h2 className="mt-4 font-display text-lg font-bold text-marron">Revisa tu correo</h2>
        <p className="mt-2 text-sm leading-relaxed text-marron/70">{mensaje}</p>
        {aviso && (
          <p className="mt-3 rounded-xl border border-naranja/40 bg-naranja/10 px-4 py-3 text-left text-xs leading-relaxed text-marron/80">
            <strong className="text-naranja-dark">Modo demo:</strong> sin proveedor de correo configurado, el
            enlace de recuperación se imprime en la consola del servidor (<code className="font-mono">npm run dev</code>).
          </p>
        )}
        <Link href="/auth/login" className="btn-outline mt-5 inline-flex px-5 py-2.5">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="space-y-4"
      onSubmit={() => setEnviado(true)}
    >
      {estado.error && (
        <p className="rounded-xl border border-tomate/20 bg-tomate/10 px-4 py-3 text-sm font-medium text-tomate" role="alert">
          {estado.error}
        </p>
      )}

      <p className="text-sm leading-relaxed text-marron/70">
        Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva contraseña (válido por 30 minutos).
      </p>

      <div>
        <label htmlFor="email" className="etiqueta">Correo electrónico</label>
        <input
          id="email" name="email" type="email" required autoComplete="email"
          placeholder="tu@correo.com" className="campo"
        />
      </div>

      <button type="submit" disabled={pendiente} className="btn-primary w-full py-3.5">
        {pendiente ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden /> : <Mail className="h-5 w-5" aria-hidden />}
        {pendiente ? "Enviando…" : "Enviar enlace"}
      </button>

      <p className="text-center text-sm text-marron/65">
        <Link href="/auth/login" className="font-semibold text-tomate hover:text-tomate-dark">
          ← Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
}
