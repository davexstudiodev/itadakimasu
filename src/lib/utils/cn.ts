import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Concatena clases de Tailwind resolviendo conflictos. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
