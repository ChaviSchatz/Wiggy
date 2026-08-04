import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersLoading() {
  return (
    <div>
      <Skeleton className="mb-2 h-8 w-48" />
      <Skeleton className="mb-6 h-4 w-72" />
      <div className="mb-4 flex items-center justify-between gap-3">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
