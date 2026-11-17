"use client";

import { useActionState } from "react";
import { KeyRound, LoaderCircle } from "lucide-react";
import { cambiarPassword } from "@/server/actions/auth";
import { toast } from "@/components/ui/toaster";
import type { ResultadoAccion } from "@/types";
import { cn } from "@/lib/utils/cn";
import { useEffect, useRef } from "react";

const ESTADO_INICIAL: ResultadoAccion = { ok: false };

export function FormPassword() {
  const [estado, action, pendiente] = useActionState(cambiarPassword, ESTADO_INICIAL);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.ok) {
      toast.success((estado.datos?.mensaje as string) ?? "Contraseña actualizada");
      formRef.current?.reset();
    }
  }, [estado]);

  const errorDe = (campo: string) => (estado.campo === campo ? estado.error : undefined);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      {estado.error && !estado.campo && (
        <p className="rounded-xl border border-tomate/20 bg-tomate/10 px-4 py-3 text-sm font-medium text-tomate" role="alert">
          {estado.error}
        </p>
      )}

      <div>
        <label htmlFor="actual" className="etiqueta">Contraseña actual</label>
        <input
          id="actual" name="actual" type="password" autoComplete="current-password" required
          className={cn("campo", errorDe("actual") && "campo-error")}
        />
        {errorDe("actual") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nueva" className="etiqueta">Nueva contraseña</label>
          <input
            id="nueva" name="nueva" type="password" autoComplete="new-password" required minLength={8}
            placeholder="Mínimo 8 caracteres"
            className={cn("campo", errorDe("nueva") && "campo-error")}
          />
          {errorDe("nueva") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
        </div>
        <div>
          <label htmlFor="confirmar" className="etiqueta">Confirmar nueva</label>
          <input
            id="confirmar" name="confirmar" type="password" autoComplete="new-password" required
            className={cn("campo", errorDe("confirmar") && "campo-error")}
          />
          {errorDe("confirmar") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
        </div>
      </div>

      <button type="submit" disabled={pendiente} className="btn-secondary w-full px-6 py-3 sm:w-auto">
        {pendiente ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <KeyRound className="h-4 w-4" aria-hidden />}
        Actualizar contraseña
      </button>
    </form>
  );
}
