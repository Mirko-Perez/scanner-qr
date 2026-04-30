import { Skeleton } from "@/components/ui/skeleton";

export default function RecuerdosLoading() {
  return (
    <div className="space-y-6 page-transition">
      {/* Title */}
      <div>
        <Skeleton className="h-8 w-40 bg-border" />
        <Skeleton className="h-4 w-56 mt-2 bg-white/[0.04]" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl bg-border" />
        ))}
      </div>

      {/* Filter bar */}
      <Skeleton className="h-10 w-48 rounded-xl bg-border" />

      {/* Media grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="aspect-[4/3] rounded-xl bg-border" />
        ))}
      </div>
    </div>
  );
}
