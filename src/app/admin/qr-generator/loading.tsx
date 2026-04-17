import { Skeleton } from "@/components/ui/skeleton";

export default function QRGeneratorLoading() {
  return (
    <div className="space-y-6 page-transition">
      {/* Title */}
      <div>
        <Skeleton className="h-8 w-36 bg-white/[0.06]" />
        <Skeleton className="h-4 w-60 mt-2 bg-white/[0.04]" />
      </div>

      {/* Info banner */}
      <Skeleton className="h-20 rounded-2xl bg-white/[0.06]" />

      {/* Action card */}
      <Skeleton className="h-24 rounded-2xl bg-white/[0.06]" />

      {/* QR grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="aspect-square rounded-xl bg-white/[0.06]" />
        ))}
      </div>
    </div>
  );
}
