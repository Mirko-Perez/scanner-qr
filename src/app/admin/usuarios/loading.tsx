import { Skeleton } from "@/components/ui/skeleton";

export default function UsuariosLoading() {
  return (
    <div className="space-y-6 page-transition">
      {/* Title */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-36 bg-white/[0.06]" />
        <Skeleton className="h-9 w-32 rounded-xl bg-white/[0.06]" />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white/[0.06] p-4 space-y-3">
        <Skeleton className="h-10 w-full rounded-lg bg-white/[0.04]" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg bg-white/[0.04]" />
        ))}
      </div>
    </div>
  );
}
