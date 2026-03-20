import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@portier-sync/ui/components/alert";
import { Badge } from "@portier-sync/ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@portier-sync/ui/components/card";
import { Separator } from "@portier-sync/ui/components/separator";
import { BotIcon, HistoryIcon, UserIcon } from "lucide-react";

import type { ApplicationId } from "../../../lib/api-types";
import { useSyncConsole } from "../../../lib/sync-console-store";
import { DataPoint, PageShell, SurfaceSection } from "../shared/ui";

export function HistoryPage({ integrationId }: { integrationId: ApplicationId }) {
  const { integrations, getIntegrationHistory } = useSyncConsole();
  const integration = integrations.find((item) => item.id === integrationId);
  const history = getIntegrationHistory(integrationId);
  const [selectedId, setSelectedId] = React.useState(history[0]?.id ?? "");

  React.useEffect(() => {
    setSelectedId(history[0]?.id ?? "");
  }, [history]);

  if (!integration) {
    return null;
  }

  const selectedEntry = history.find((entry) => entry.id === selectedId) ?? history[0];

  return (
    <PageShell
      eyebrow="History and audit"
      title={`${integration.name} version history`}
      description="Inspect past sync events and audit details, then jump back into review when needed."
      actions={<Badge variant="outline">{history.length} events</Badge>}
    >
      <Alert>
        <HistoryIcon />
        <AlertTitle>History answers what changed, who approved it, and when.</AlertTitle>
        <AlertDescription>
          Select an event to inspect its result, counts, and notes in the detail panel.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SurfaceSection
          title="Version timeline"
          description="Each row includes enough context to scan outcomes quickly."
          action={<Badge variant="outline">Audit-first layout</Badge>}
        >
          <div className="flex flex-col gap-3">
            {history.map((entry) => {
              // TODO: replace with a structured outcome field
              const flagged = entry.summary.toLowerCase().includes("error") || entry.summary.toLowerCase().includes("paused");
              return (
                <button
                  key={entry.id}
                  className={`rounded-2xl border p-4 text-left transition-colors ${
                    entry.id === selectedId ? "border-primary/45 bg-primary/8" : "border-border/70 bg-background/35 hover:bg-accent/25"
                  }`}
                  onClick={() => setSelectedId(entry.id)}
                  type="button"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-semibold">{entry.summary}</h3>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {entry.timestamp.toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" • "}
                        {entry.source === "user" ? (
                          <>
                            <UserIcon className="inline size-3 mr-1 text-muted-foreground" />
                            Operator
                          </>
                        ) : (
                          <>
                            <BotIcon className="inline size-3 mr-1 text-muted-foreground" />
                            Scheduled
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{entry.version}</Badge>
                      <Badge variant={flagged ? "destructive" : "outline"}>{flagged ? "Requires attention" : "Completed"}</Badge>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 md:grid-cols-4">
                    <DataPoint label="Changed fields" value={String(entry.changesCount ?? 0)} />
                    <DataPoint label="Added" value={String(entry.addedCount ?? 0)} />
                    <DataPoint label="Updated" value={String(entry.updatedCount ?? 0)} />
                    <DataPoint label="Deleted" value={String(entry.deletedCount ?? 0)} />
                  </div>
                </button>
              );
            })}
          </div>
        </SurfaceSection>

        {selectedEntry ? (
          <div className="flex flex-col gap-6">
            <SurfaceSection
              title="Expanded event view"
              description="Details for the selected event."
              action={<Badge variant="outline">{selectedEntry.version}</Badge>}
            >
              <div className="grid gap-3">
                <DataPoint label="Trigger" value={selectedEntry.source === "user" ? "Manual review" : "Scheduled sync"} />
                <DataPoint label="Result" value={selectedEntry.summary} emphasis />
                <DataPoint label="Changed fields" value={String(selectedEntry.changesCount ?? 0)} />
              </div>
              <Separator />
              <Card size="sm" className="border border-border/70 bg-background/40">
                <CardHeader>
                  <CardTitle className="text-sm">Details</CardTitle>
                  <CardDescription>Description recorded with this history event.</CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground">{selectedEntry.details}</CardContent>
              </Card>
            </SurfaceSection>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}