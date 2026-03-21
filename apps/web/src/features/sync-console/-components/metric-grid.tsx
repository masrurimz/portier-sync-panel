import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@portier-sync/ui/components/card";

import type { ConsoleMetric } from "../-domain/integration";

export function MetricGrid({ metrics }: { metrics: ConsoleMetric[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label} size="sm" className="border border-border/70 bg-card/60">
          <CardHeader>
            <CardDescription className="text-[11px] font-semibold tracking-[0.16em] uppercase">{metric.label}</CardDescription>
            <CardTitle className="text-2xl">{metric.value}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{metric.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
