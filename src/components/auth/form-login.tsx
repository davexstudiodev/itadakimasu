"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, LoaderCircle } from "lucide-react";
import { iniciarSesion } from "@/server/actions/auth";
import type { ResultadoAccion } from "@/types";
import { cn } from "@/lib/utils/cn";

const ESTADO_INICIAL: ResultadoAccion = { ok: false };

export function FormLogin({ emailSugerido }: { emailSugerido?: string }) {
  const [estado, action, pendiente] = useActionState(iniciarSesion, ESTADO_INICIAL);
  const [verPassword, setVerPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (estado.ok) {
      router.push("/");
      router.refresh();
    }
  }, [estado, router]);

  const errorDe = (campo: string) => (estado.campo === campo ? estado.error : undefined);

  return (
    <form action={action} className="space-y-4">
      {estado.error && !estado.campo && (
        <p className="rounded-xl border border-tomate/20 bg-tomate/10 px-4 py-3 text-sm font-medium text-tomate" role="alert">
          {estado.error}
        </p>
      )}

      <div>
        <label htmlFor="email" className="etiqueta">Correo electrónico</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={emailSugerido ?? ""}
          placeholder="tu@correo.com"
          className={cn("campo", errorDe("email") && "campo-error")}
        />
        {errorDe("email") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
      </div>

      <div>
        <label htmlFor="password" className="etiqueta">Contraseña</label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={verPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className={cn("campo pr-12", errorDe("password") && "campo-error")}
          />
          <button
            type="button"
            onClick={() => setVerPassword((v) => !v)}
            aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-marron/50 transition-colors hover:text-marron"
          >
            {verPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errorDe("password") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
      </div>

      <div className="flex items-center justify-end">
        <Link href="/auth/recuperar" className="text-xs font-semibold text-tomate hover:text-tomate-dark">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <button type="submit" disabled={pendiente} className="btn-primary w-full py-3.5 text-base">
        {pendiente ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden /> : <LogIn className="h-5 w-5" aria-hidden />}
        {pendiente ? "Entrando…" : "Entrar"}
      </button>

      <p className="text-center text-sm text-marron/65">
        ¿No tienes cuenta?{" "}
        <Link href="/auth/registro" className="font-semibold text-tomate hover:text-tomate-dark">
          Regístrate
        </Link>
      </p>
    </form>
  );
}
