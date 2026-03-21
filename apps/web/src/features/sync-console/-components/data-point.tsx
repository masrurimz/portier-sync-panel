import { cn } from "@portier-sync/ui/lib/utils";

export function DataPoint({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border/70 bg-muted/15 p-3">
      <span className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">{label}</span>
      <span className={cn("text-sm font-medium", emphasis && "text-foreground")}>{value}</span>
    </div>
  );
}
