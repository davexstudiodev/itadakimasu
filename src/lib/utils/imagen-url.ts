export function esUrlImagenExterna(src: string): boolean {
  return /^(https?:)?\/\//i.test(src);
}
