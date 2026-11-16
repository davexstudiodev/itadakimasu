"use client";

import { cloneElement, isValidElement, useState, type ReactElement, type ReactNode } from "react";
import { Modal } from "./modal";
import { Spinner } from "./spinner";
import { toast } from "./toaster";

interface Props {
  titulo: string;
  descripcion: string;
  textoConfirmar?: string;
  onConfirmar: () => Promise<{ ok: boolean; error?: string }> | { ok: boolean; error?: string };
  children?: ReactNode;
}

/** Confirmación obligatoria antes de acciones destructivas. */
export function ConfirmarAccion({ titulo, descripcion, textoConfirmar = "Confirmar", onConfirmar, children }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);

  const confirmar = async () => {
    setCargando(true);
    try {
      const resultado = await onConfirmar();
      if (resultado.ok) {
        setAbierto(false);
      } else {
        toast.error(resultado.error ?? "No se pudo completar la acción");
      }
    } finally {
      setCargando(false);
    }
  };

  // El disparador suele venir como <button> desde el padre: se le inyecta el
  // onClick en lugar de envolverlo en otro botón (HTML inválido + error de hidratación).
  const disparador = isValidElement(children) ? (
    cloneElement(children as ReactElement<{ onClick?: () => void }>, {
      onClick: () => setAbierto(true),
    })
  ) : (
    <button type="button" onClick={() => setAbierto(true)}>
      {children}
    </button>
  );

  return (
    <>
      {disparador}
      <Modal abierto={abierto} onCerrar={() => setAbierto(false)} titulo={titulo}>
        <p className="text-sm leading-relaxed text-marron/75">{descripcion}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-outline px-5 py-2.5" onClick={() => setAbierto(false)}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary px-5 py-2.5"
            onClick={confirmar}
            disabled={cargando}
          >
            {cargando ? <Spinner className="h-4 w-4" /> : textoConfirmar}
          </button>
        </div>
      </Modal>
    </>
  );
}
