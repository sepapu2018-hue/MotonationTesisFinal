function Shimmer({ className = "" }) {
  return (
    <div className={`relative overflow-hidden bg-white/5 ${className}`}>
      <div className="absolute inset-0 skeleton-shimmer" />
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border border-white/10 bg-[#0E0E0E] overflow-hidden">
          <Shimmer className="aspect-[4/3]" />
          <div className="p-5 space-y-3">
            <Shimmer className="h-2.5 w-1/3" />
            <Shimmer className="h-4 w-2/3" />
            <Shimmer className="h-6 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border border-white/10 bg-[#0E0E0E] p-4 flex items-center gap-4">
          <Shimmer className="h-12 w-12 shrink-0" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-3 w-1/4" />
            <Shimmer className="h-2.5 w-1/3" />
          </div>
          <Shimmer className="h-6 w-20 shrink-0" />
        </div>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <Shimmer className="aspect-square" />
      <div className="space-y-4">
        <Shimmer className="h-3 w-1/4" />
        <Shimmer className="h-8 w-3/4" />
        <Shimmer className="h-6 w-1/3" />
        <Shimmer className="h-24 w-full" />
        <Shimmer className="h-12 w-1/2" />
      </div>
    </div>
  );
}

// variant: "spin" (chequeo rápido de sesión, sin layout final conocido) o
// "grid" / "list" / "detail" (esqueletos con la forma real del contenido que ya está por llegar).
export default function PageLoader({ label = "Cargando", className = "py-24", variant = "spin" }) {
  if (variant === "grid") return <GridSkeleton />;
  if (variant === "list") return <ListSkeleton />;
  if (variant === "detail") return <DetailSkeleton />;
  return (
    <div className={`flex flex-col items-center justify-center gap-4 text-zinc-500 ${className}`}>
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 border-2 border-white/10 rounded-full" />
        <div className="absolute inset-0 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
      </div>
      <div className="text-[10px] font-mono uppercase tracking-[0.3em] animate-pulse">// {label}...</div>
    </div>
  );
}
