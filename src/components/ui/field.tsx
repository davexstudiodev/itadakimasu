import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface CampoProps extends ComponentPropsWithoutRef<"input"> {
  etiqueta: string;
  error?: string;
  ayuda?: ReactNode;
}

/** Input con etiqueta y mensaje de error (usable en servidor y cliente). */
export function Campo({ etiqueta, error, ayuda, className, id, ...props }: CampoProps) {
  const inputId = id ?? props.name;
  return (
    <div className="w-full">
      <label htmlFor={inputId} className="etiqueta">
        {etiqueta}
      </label>
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn("campo", error && "campo-error", className)}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs font-medium text-tomate" role="alert">
          {error}
        </p>
      )}
      {!error && ayuda && <p className="mt-1.5 text-xs text-marron/50">{ayuda}</p>}
    </div>
  );
}

interface AreaProps extends ComponentPropsWithoutRef<"textarea"> {
  etiqueta: string;
  error?: string;
}

export function AreaTexto({ etiqueta, error, className, id, ...props }: AreaProps) {
  const areaId = id ?? props.name;
  return (
    <div className="w-full">
      <label htmlFor={areaId} className="etiqueta">
        {etiqueta}
      </label>
      <textarea
        id={areaId}
        aria-invalid={!!error}
        className={cn("campo min-h-24 resize-y", error && "campo-error", className)}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs font-medium text-tomate" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface SelectProps extends ComponentPropsWithoutRef<"select"> {
  etiqueta: string;
  error?: string;
}

export function Selector({ etiqueta, error, className, id, children, ...props }: SelectProps) {
  const selectId = id ?? props.name;
  return (
    <div className="w-full">
      <label htmlFor={selectId} className="etiqueta">
        {etiqueta}
      </label>
      <select
        id={selectId}
        aria-invalid={!!error}
        className={cn("campo appearance-none bg-white", error && "campo-error", className)}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="mt-1.5 text-xs font-medium text-tomate" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
