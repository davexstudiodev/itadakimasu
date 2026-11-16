import { atribucionFotoProducto } from "@/lib/utils/imagenes-producto";

interface Props {
  slug: string;
}

export function AtribucionFotoProducto({ slug }: Props) {
  const atribucion = atribucionFotoProducto(slug);
  if (!atribucion) return null;

  return (
    <p className="text-center text-[10px] text-marron/50">
      Foto de{" "}
      <a
        href={atribucion.fuente}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2"
      >
        Open Food Facts contributors
      </a>
      {" · "}
      <a
        href="https://creativecommons.org/licenses/by-sa/3.0/"
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2"
      >
        CC BY-SA 3.0
      </a>
    </p>
  );
}
