import { cn } from "@/lib/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-xl", className)} aria-hidden />;
}

export function ProductoCardSkeleton() {
  return (
    <div className="tarjeta overflow-hidden" aria-hidden>
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-6 w-24" />
      </div>
    </div>
  );
}

export function GrillaSkeleton({ cantidad = 8 }: { cantidad?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {Array.from({ length: cantidad }).map((_, i) => (
        <ProductoCardSkeleton key={i} />
      ))}
    </div>
  );
}
