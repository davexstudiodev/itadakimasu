import { Fragment, type ReactNode } from "react";

const MARCADOR = /\*\*([^\s*](?:[^*\n]*?[^\s*])?)\*\*|(?<!\S)\/([^\s/](?:[^/\n]*?[^\s/])?)\/(?=$|[\s.,!?;:)])/g;

export function textoSinFormato(texto: string): string {
  return texto.replace(MARCADOR, (_coincidencia, negrita: string | undefined, cursiva: string | undefined) =>
    negrita ?? cursiva ?? ""
  );
}

export function TextoFormateado({
  texto,
  className,
}: {
  texto: string;
  className?: string;
}) {
  const partes: ReactNode[] = [];
  let inicio = 0;
  let indice = 0;
  let coincidencia: RegExpExecArray | null;

  MARCADOR.lastIndex = 0;
  while ((coincidencia = MARCADOR.exec(texto))) {
    if (coincidencia.index > inicio) {
      partes.push(texto.slice(inicio, coincidencia.index));
    }

    const contenido = coincidencia[1] ?? coincidencia[2] ?? "";
    partes.push(
      <Fragment key={`formato-${indice++}`}>
        {coincidencia[1] !== undefined ? <strong>{contenido}</strong> : <em>{contenido}</em>}
      </Fragment>
    );
    inicio = coincidencia.index + coincidencia[0].length;
  }

  if (inicio < texto.length) partes.push(texto.slice(inicio));
  return <span className={className}>{partes}</span>;
}
