import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@portier-sync/ui/components/alert";
import { Badge } from "@portier-sync/ui/components/badge";
import { Button } from "@portier-sync/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@portier-sync/ui/components/card";
import { Separator } from "@portier-sync/ui/components/separator";
import { ArrowRightIcon, HistoryIcon } from "lucide-react";

import type { ApplicationId } from "../../lib/api-types";
import { useSyncConsole } from "../../lib/sync-console-store";
import { DataPoint, IntegrationLinkSet, LinkButton, PageShell, SurfaceSection } from "./shared";

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
      description="Inspect versions, trigger sources, results, and changed-field counts without losing the path back into the review workflow."
      actions={
        <>
          <Badge variant="outline">{history.length} events</Badge>
          <Button variant="outline" disabled>
            Export audit
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <LinkButton to="/integration/$integrationId" params={{ integrationId }}>Back to detail</LinkButton>
        <IntegrationLinkSet integrationId={integrationId} current="history" />
      </div>

      <Alert>
        <HistoryIcon />
        <AlertTitle>History should answer what changed, who approved it, and when.</AlertTitle>
        <AlertDescription>
          This view is interactive: selecting a timeline event updates the expanded audit panel so the operator can inspect result, counts, and context quickly.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SurfaceSection
          title="Version timeline"
          description="Collapsed rows still surface enough information to scan results quickly."
          action={<Badge variant="outline">Audit-first layout</Badge>}
        >
          <div className="flex flex-col gap-3">
            {history.map((entry) => {
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
                        {entry.source === "user" ? "Triggered by operator" : "Triggered by system"}
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
              description="Selecting a timeline event reveals the operator-facing context for that specific version change."
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
                  <CardDescription>Operator-facing description preserved with the history event.</CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground">{selectedEntry.details}</CardContent>
              </Card>
            </SurfaceSection>

            <SurfaceSection
              title="Navigate the flow"
              description="History should support movement back into the operational workflow without losing orientation."
            >
              <div className="flex flex-col gap-2">
                <LinkButton to="/integration/$integrationId/review" params={{ integrationId }} variant="secondary" className="justify-between">
                  Return to review queue
                  <ArrowRightIcon data-icon="inline-end" />
                </LinkButton>
                <LinkButton to="/integration/$integrationId" params={{ integrationId }} className="justify-between">
                  Back to detail
                  <ArrowRightIcon data-icon="inline-end" />
                </LinkButton>
              </div>
            </SurfaceSection>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
