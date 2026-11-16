import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin", className)} aria-hidden />;
}

export function BotonCargando({ texto = "Cargando..." }: { texto?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Spinner className="h-4 w-4" />
      {texto}
    </span>
  );
}
