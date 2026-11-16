"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, LoaderCircle, Eye, EyeOff } from "lucide-react";
import { restablecerPassword } from "@/server/actions/auth";
import { toast } from "@/components/ui/toaster";
import type { ResultadoAccion } from "@/types";
import { cn } from "@/lib/utils/cn";

const ESTADO_INICIAL: ResultadoAccion = { ok: false };

export function FormRestablecer({ token }: { token: string }) {
  const [estado, action, pendiente] = useActionState(restablecerPassword, ESTADO_INICIAL);
  const [ver, setVer] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (estado.ok) {
      toast.success((estado.datos?.mensaje as string) ?? "Contraseña actualizada");
      router.push("/auth/login");
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

      <input type="hidden" name="token" value={token} />

      <div>
        <label htmlFor="password" className="etiqueta">Nueva contraseña</label>
        <div className="relative">
          <input
            id="password" name="password" type={ver ? "text" : "password"}
            autoComplete="new-password" required minLength={8} placeholder="Mínimo 8 caracteres"
            className={cn("campo pr-12", errorDe("password") && "campo-error")}
          />
          <button
            type="button"
            onClick={() => setVer((v) => !v)}
            aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-marron/50 transition-colors hover:text-marron"
          >
            {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errorDe("password") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
      </div>

      <div>
        <label htmlFor="confirmar" className="etiqueta">Confirmar contraseña</label>
        <input
          id="confirmar" name="confirmar" type={ver ? "text" : "password"}
          autoComplete="new-password" required placeholder="Repite la contraseña"
          className={cn("campo", errorDe("confirmar") && "campo-error")}
        />
        {errorDe("confirmar") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
      </div>

      <button type="submit" disabled={pendiente} className="btn-primary w-full py-3.5">
        {pendiente ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden /> : <KeyRound className="h-5 w-5" aria-hidden />}
        {pendiente ? "Guardando…" : "Guardar nueva contraseña"}
      </button>

      <p className="text-center text-sm text-marron/65">
        <Link href="/auth/login" className="font-semibold text-tomate hover:text-tomate-dark">
          ← Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
}
