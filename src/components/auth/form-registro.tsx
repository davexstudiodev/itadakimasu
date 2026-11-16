"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, UserPlus, LoaderCircle, Check } from "lucide-react";
import { registrar } from "@/server/actions/auth";
import { toast } from "@/components/ui/toaster";
import type { ResultadoAccion } from "@/types";
import { cn } from "@/lib/utils/cn";

const ESTADO_INICIAL: ResultadoAccion = { ok: false };

export function FormRegistro() {
  const [estado, action, pendiente] = useActionState(registrar, ESTADO_INICIAL);
  const [verPassword, setVerPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (estado.ok) {
      toast.success("¡Bienvenido a ITADAKIMASU! Tu cuenta está lista.");
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nombre" className="etiqueta">Nombre</label>
          <input
            id="nombre" name="nombre" required maxLength={60} autoComplete="given-name"
            placeholder="Yuki" className={cn("campo", errorDe("nombre") && "campo-error")}
          />
          {errorDe("nombre") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
        </div>
        <div>
          <label htmlFor="apellidos" className="etiqueta">Apellidos</label>
          <input
            id="apellidos" name="apellidos" required maxLength={60} autoComplete="family-name"
            placeholder="Tanaka" className={cn("campo", errorDe("apellidos") && "campo-error")}
          />
          {errorDe("apellidos") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="etiqueta">Correo electrónico</label>
        <input
          id="email" name="email" type="email" required autoComplete="email"
          placeholder="tu@correo.com" className={cn("campo", errorDe("email") && "campo-error")}
        />
        {errorDe("email") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
      </div>

      <div>
        <label htmlFor="password" className="etiqueta">Contraseña</label>
        <div className="relative">
          <input
            id="password" name="password" type={verPassword ? "text" : "password"}
            autoComplete="new-password" required minLength={8} placeholder="Mínimo 8 caracteres"
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

      <div>
        <label htmlFor="confirmar" className="etiqueta">Confirmar contraseña</label>
        <input
          id="confirmar" name="confirmar" type={verPassword ? "text" : "password"}
          autoComplete="new-password" required placeholder="Repite tu contraseña"
          className={cn("campo", errorDe("confirmar") && "campo-error")}
        />
        {errorDe("confirmar") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
      </div>

      <label className="flex items-start gap-3 text-xs leading-relaxed text-marron/70">
        <input type="checkbox" name="aceptaTerminos" required className="mt-0.5 h-4 w-4 accent-[#D94B38]" />
        <span>
          Acepto los <Link href="/terminos" className="font-semibold text-tomate underline">términos y condiciones</Link> y la{" "}
          <Link href="/privacidad" className="font-semibold text-tomate underline">política de privacidad</Link>. *
        </span>
      </label>
      {errorDe("aceptaTerminos") && (
        <p className="text-xs font-medium text-tomate" role="alert">{estado.error}</p>
      )}

      <button type="submit" disabled={pendiente} className="btn-primary w-full py-3.5 text-base">
        {pendiente ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden /> : <UserPlus className="h-5 w-5" aria-hidden />}
        {pendiente ? "Creando cuenta…" : "Crear mi cuenta"}
      </button>

      <ul className="grid gap-1.5 rounded-xl bg-crema px-4 py-3 text-[11px] text-marron/70">
        <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-hojita" aria-hidden /> Tus precios y favoritos se guardan en tu cuenta</li>
        <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-hojita" aria-hidden /> Sigue tus pedidos en tiempo real</li>
        <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-hojita" aria-hidden /> Paga con Yape desde tu celular</li>
      </ul>

      <p className="text-center text-sm text-marron/65">
        ¿Ya tienes cuenta?{" "}
        <Link href="/auth/login" className="font-semibold text-tomate hover:text-tomate-dark">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
