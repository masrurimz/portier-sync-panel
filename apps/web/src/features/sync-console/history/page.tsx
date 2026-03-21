import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@portier-sync/ui/components/alert";
import { Badge } from "@portier-sync/ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@portier-sync/ui/components/card";
import { Separator } from "@portier-sync/ui/components/separator";
import { HistoryIcon } from "lucide-react";

import {
  integrationsListQueryOptions,
  historyListQueryOptions,
  getLocalHistory,
  type IntegrationId,
  type AuditEntry,
} from "@portier-sync/api";
import { remoteHistoryToAuditEntry } from "../-domain/history";
import { DataPoint, PageShell, SurfaceSection } from "../-ui/ui";

export function HistoryPage({ integrationId }: { integrationId: IntegrationId }) {
  const { data: integrations = [] } = useQuery(integrationsListQueryOptions());
  const integration = integrations.find((item) => item.id === integrationId);

  // Query remote history
  const { data: history = [] } = useQuery(historyListQueryOptions({ input: { id: integrationId } }));

  // Query local history
  const { data: localEntries = [] } = useQuery({
    queryKey: ["local", "history", integrationId],
    queryFn: () => getLocalHistory(integrationId),
  });

  // Normalize remote entries and merge with local entries
  const remoteAuditEntries: AuditEntry[] = history.map(remoteHistoryToAuditEntry);
  const timeline: AuditEntry[] = [...remoteAuditEntries, ...localEntries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // Guard: integration not yet hydrated in query state
  if (!integration) {
    return (
      <PageShell
        eyebrow="History and audit"
        title="Loading…"
        description="Fetching integration details."
      >
        <div className="rounded-2xl border border-dashed border-border/80 bg-background/30 p-6 text-sm text-muted-foreground">
          Integration is loading or unavailable. If this persists, check your connection and refresh.
        </div>
      </PageShell>
    );
  }

  const selectedEntry = timeline.find((entry) => entry.id === selectedId) ?? timeline[0];

  return (
    <PageShell
      eyebrow="History and audit"
      title={`${integration.name} version history`}
      description="Inspect past sync events and audit details, then jump back into review when needed."
      actions={<Badge variant="outline">{timeline.length} events</Badge>}
    >
      <Alert>
        <HistoryIcon />
        <AlertTitle>History answers what changed, who approved it, and when.</AlertTitle>
        <AlertDescription>
          Select an event to inspect its result, counts, and notes in the detail panel.
        </AlertDescription>
      </Alert>

      {timeline.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-background/30 p-6 text-sm text-muted-foreground">
          No history entries are available yet. History will appear here after sync operations are completed.
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SurfaceSection
            title="Version timeline"
            description="Each row includes enough context to scan outcomes quickly."
            action={<Badge variant="outline">Audit-first layout</Badge>}
          >
            <div className="flex flex-col gap-3">
              {timeline.map((entry) => {
                const flagged = entry.summary.toLowerCase().includes("error") || entry.summary.toLowerCase().includes("paused");
                const versionDisplay = entry.localRevision != null
                  ? `r${entry.localRevision}`
                  : (entry.resultVersion ?? entry.remoteVersion ?? "—");
                const sourceLabel = entry.origin === "local" ? "Applied locally" : entry.eventType === "remote-history" ? "Remote system" : "Preview";
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
                          {new Date(entry.timestamp).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" • "}
                          {sourceLabel}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={entry.origin === "local" ? "outline" : "secondary"} className={entry.origin === "local" ? "border-emerald-500/50 text-emerald-600 bg-emerald-500/8" : ""}>
                          {entry.origin === "local" ? "Local" : "Remote"}
                        </Badge>
                        <Badge variant="secondary">{versionDisplay}</Badge>
                        <Badge variant={flagged ? "destructive" : "outline"}>{flagged ? "Requires attention" : "Completed"}</Badge>
                      </div>
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
                action={<Badge variant="outline">{selectedEntry.resultVersion ?? "—"}</Badge>}
              >
                <div className="grid gap-3">
                  <DataPoint label="Trigger" value={selectedEntry.origin === "local" ? "Applied locally" : selectedEntry.eventType === "remote-history" ? "Remote system" : "Preview fetch"} />
                  <DataPoint label="Result" value={selectedEntry.summary} emphasis />
                  {selectedEntry.baseVersion && <DataPoint label="Base version" value={selectedEntry.baseVersion} />}
                  {selectedEntry.resultVersion && <DataPoint label="Result version" value={selectedEntry.resultVersion} />}
                </div>
                <Separator />
                <Card size="sm" className="border border-border/70 bg-background/40">
                  <CardHeader>
                    <CardTitle className="text-sm">Details</CardTitle>
                    <CardDescription>Description recorded with this history event.</CardDescription>
                  </CardHeader>
                  <CardContent className="text-muted-foreground">{selectedEntry.details ?? "—"}</CardContent>
                </Card>
              </SurfaceSection>
            </div>
          ) : null}
        </div>
      )}
    </PageShell>
  );
}