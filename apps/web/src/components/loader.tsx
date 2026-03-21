import { Skeleton } from "@portier-sync/ui/components/skeleton";
import { Loader2 } from "lucide-react";

export default function Loader() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-10">
      <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-card/70 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-medium">Loading sync console data…</p>
          <p className="text-xs text-muted-foreground">Preparing demo records and integration health metrics. This can take a few seconds on first load.</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-border/70 bg-card/60 p-4">
            <Skeleton className="mb-3 h-3 w-28" />
            <Skeleton className="h-7 w-12" />
            <Skeleton className="mt-3 h-3 w-40" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border/70 bg-card/60 p-4">
        <Skeleton className="mb-4 h-4 w-40" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}