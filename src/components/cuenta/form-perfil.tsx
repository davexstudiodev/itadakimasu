"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, LoaderCircle, Check } from "lucide-react";
import { actualizarPerfil } from "@/server/actions/auth";
import { toast } from "@/components/ui/toaster";
import type { Perfil, ResultadoAccion } from "@/types";
import { cn } from "@/lib/utils/cn";

const ESTADO_INICIAL: ResultadoAccion = { ok: false };

export function FormPerfil({ perfil }: { perfil: Perfil }) {
  const [estado, action, pendiente] = useActionState(actualizarPerfil, ESTADO_INICIAL);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (estado.ok) {
      toast.success((estado.datos?.mensaje as string) ?? "Perfil actualizado");
      router.refresh();
    }
  }, [estado, router]);

  const errorDe = (campo: string) => (estado.campo === campo ? estado.error : undefined);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      {estado.error && !estado.campo && (
        <p className="rounded-xl border border-tomate/20 bg-tomate/10 px-4 py-3 text-sm font-medium text-tomate" role="alert">
          {estado.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nombre" className="etiqueta">Nombre</label>
          <input
            id="nombre" name="nombre" required maxLength={60} defaultValue={perfil.nombre}
            className={cn("campo", errorDe("nombre") && "campo-error")}
          />
          {errorDe("nombre") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
        </div>
        <div>
          <label htmlFor="apellidos" className="etiqueta">Apellidos</label>
          <input
            id="apellidos" name="apellidos" required maxLength={60} defaultValue={perfil.apellidos}
            className={cn("campo", errorDe("apellidos") && "campo-error")}
          />
          {errorDe("apellidos") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="etiqueta">Correo electrónico</label>
          <input id="email" value={perfil.email} disabled className="campo bg-beige/40 text-marron/60" />
          <p className="mt-1.5 text-[11px] text-marron/50">El correo no se puede modificar.</p>
        </div>
        <div>
          <label htmlFor="telefono" className="etiqueta">Teléfono</label>
          <input
            id="telefono" name="telefono" inputMode="tel" placeholder="987 654 321"
            defaultValue={perfil.telefono ?? ""} className={cn("campo", errorDe("telefono") && "campo-error")}
          />
          {errorDe("telefono") && <p className="mt-1.5 text-xs font-medium text-tomate">{estado.error}</p>}
        </div>
      </div>

      <button type="submit" disabled={pendiente} className="btn-primary w-full px-6 py-3 sm:w-auto">
        {pendiente ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
        Guardar cambios
      </button>
    </form>
  );
}

export function IconoPerfil() {
  return <User className="h-4 w-4" aria-hidden />;
}
