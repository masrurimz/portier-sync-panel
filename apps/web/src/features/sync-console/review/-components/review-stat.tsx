import { Card, CardDescription, CardHeader, CardTitle } from "@portier-sync/ui/components/card";
import type { Layers2Icon } from "lucide-react";

export function ReviewStat({ icon: Icon, label, value }: { icon: typeof Layers2Icon; label: string; value: string }) {
  return (
    <Card size="sm" className="border border-border/70 bg-card/70">
      <CardHeader>
        <CardDescription className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] uppercase">
          <Icon className="size-3.5 text-muted-foreground" />
          {label}
        </CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
