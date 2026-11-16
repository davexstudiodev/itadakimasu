import Image, { type ImageProps } from "next/image";
import { esUrlImagenExterna } from "@/lib/utils/imagen-url";

type Props = Omit<ImageProps, "src" | "unoptimized"> & {
  src: string;
};

export function ImagenProducto({ src, alt, ...props }: Props) {
  return <Image {...props} alt={alt} src={src} unoptimized={esUrlImagenExterna(src)} />;
}
