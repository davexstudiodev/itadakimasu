import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const directorio = path.join(process.cwd(), "public", "productos");
const archivos = readdirSync(directorio).filter(
  (archivo) => archivo.endsWith(".svg") && !/-vista-[2-4]\.svg$/.test(archivo)
);

for (const archivo of archivos) {
  const slug = path.basename(archivo, ".svg");
  const rutaOriginal = path.join(directorio, archivo);
  const original = readFileSync(rutaOriginal, "utf8").replace(
    '<rect width="800" height="800" fill="#FFF5E9"/>',
    '<rect width="800" height="800" fill="#FFFFFF"/>'
  );
  writeFileSync(rutaOriginal, original);

  const arte = original.replace(/^\s*<svg\b[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  const vista = (x, y, width, height, attributes = "") =>
    `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="0 0 800 800" ${attributes}>${arte}</svg>`;
  const vistas = [
    `<rect width="800" height="800" fill="#FFFFFF"/>${vista(60, 50, 680, 680, 'filter="url(#shadow)" transform="rotate(-2 400 400)"')}`,
    `<rect width="800" height="800" fill="#FFFFFF"/><rect x="42" y="42" width="716" height="716" rx="38" fill="#FFFFFF" stroke="#F3E4D2" stroke-width="3"/><g clip-path="url(#crop)">${vista(-24, -24, 848, 848)}</g>`,
    `<rect width="800" height="800" fill="#FFFFFF"/><circle cx="400" cy="382" r="330" fill="#FFF5E9"/>${vista(110, 70, 580, 580, 'filter="url(#shadow)"')}<path d="M225 700h350" stroke="#F3E4D2" stroke-width="4" stroke-linecap="round"/>`,
  ];

  vistas.forEach((contenido, indice) => {
    const numero = indice + 2;
    const defs =
      numero === 2
        ? '<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#382820" flood-opacity=".16"/></filter>'
        : numero === 3
          ? '<clipPath id="crop"><rect x="58" y="58" width="684" height="684" rx="28"/></clipPath>'
          : '<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#382820" flood-opacity=".14"/></filter>';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="800" height="800" viewBox="0 0 800 800"><defs>${defs}</defs>${contenido}</svg>`;
    writeFileSync(path.join(directorio, `${slug}-vista-${numero}.svg`), svg);
  });
}

console.log(`Galerías generadas: ${archivos.length} productos, ${archivos.length * 4} imágenes.`);
