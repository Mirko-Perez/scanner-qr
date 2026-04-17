import { Skeleton } from "@/components/ui/skeleton";

export default function GuestsLoading() {
  return (
    <div className="space-y-6 page-transition">
      {/* Title */}
      <div>
        <Skeleton className="h-8 w-40 bg-white/[0.06]" />
        <Skeleton className="h-4 w-64 mt-2 bg-white/[0.04]" />
      </div>

      {/* Form card */}
      <Skeleton className="h-44 rounded-2xl bg-white/[0.06]" />

      {/* Filter bar */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-40 rounded-xl bg-white/[0.06]" />
        <Skeleton className="h-10 w-24 rounded-xl bg-white/[0.04]" />
      </div>

      {/* Guest rows */}
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl bg-white/[0.06]" />
        ))}
      </div>
    </div>
  );
}
