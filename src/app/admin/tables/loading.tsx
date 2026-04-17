import { Skeleton } from "@/components/ui/skeleton";

export default function TablesLoading() {
  return (
    <div className="space-y-6 page-transition">
      {/* Title */}
      <div>
        <Skeleton className="h-8 w-32 bg-white/[0.06]" />
        <Skeleton className="h-4 w-56 mt-2 bg-white/[0.04]" />
      </div>

      {/* Form card */}
      <Skeleton className="h-40 rounded-2xl bg-white/[0.06]" />

      {/* Table list */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl bg-white/[0.06]" />
        ))}
      </div>
    </div>
  );
}
