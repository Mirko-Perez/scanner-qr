import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 page-transition">
      {/* Title */}
      <div>
        <Skeleton className="h-8 w-48 bg-border" />
        <Skeleton className="h-4 w-72 mt-2 bg-white/[0.04]" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl bg-border" />
        ))}
      </div>

      {/* Progress card */}
      <Skeleton className="h-20 rounded-2xl bg-border" />

      {/* Table grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl bg-border" />
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 rounded-xl bg-border" />
        ))}
      </div>
    </div>
  );
}
