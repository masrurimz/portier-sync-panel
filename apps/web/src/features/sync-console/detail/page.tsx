import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@portier-sync/ui/components/alert";
import { Button } from "@portier-sync/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@portier-sync/ui/components/card";
import { CheckCircle2Icon, DatabaseZapIcon, GitCompareArrowsIcon, HistoryIcon, RefreshCwIcon, ShieldCheckIcon } from "lucide-react";

import type { ApplicationId } from "../../../lib/api-types";
import { formatRelativeTime } from "../../../lib/api-types";
import { useSyncConsole } from "../../../lib/sync-console-store";
import { DataPoint, LinkButton, MetricGrid, PageShell, StatusBadge, SurfaceSection } from "../shared/ui";

export function DetailPage({ integrationId }: { integrationId: ApplicationId }) {
  const {
    integrations,
    healthByIntegration,
    syncingId,
    getIntegrationMetrics,
    getDetailPreviewLines,
    getPendingReviewCount,
    getReviewBatch,
    getSyncError,
    syncNow,
  } = useSyncConsole();

  const integration = integrations.find((item) => item.id === integrationId);

  if (!integration) {
    return null;
  }

  const health = healthByIntegration[integrationId];
  const metrics = getIntegrationMetrics(integrationId);
  const previewLines = getDetailPreviewLines(integrationId);
  const syncError = getSyncError(integrationId);
  const isSyncing = syncingId === integrationId;

  const [fetchResult, setFetchResult] = React.useState<{ changeCount: number; conflictCount: number; appName: string } | null>(null);

  React.useEffect(() => {
    setFetchResult(null);
  }, [integrationId]);

  const handleSyncNow = async () => {
    try {
      await syncNow(integrationId);
      const freshBatch = getReviewBatch(integrationId);
      setFetchResult({
        changeCount: freshBatch.items.length,
        conflictCount: freshBatch.items.filter((i) => i.conflict).length,
        appName: freshBatch.applicationName,
      });
    } catch {
      setFetchResult(null);
      // toast feedback is handled in the sync store; stay on the detail page on failure.
    }
  };

  return (
    <PageShell
      eyebrow="Integration detail"
      title={`${integration.name} sync surface`}
      description="Review health, pending work, and recent context before you sync or open review."
      actions={
        <>
          <StatusBadge status={integration.status} />
          <Button onClick={handleSyncNow} disabled={isSyncing} variant="default">
            <RefreshCwIcon data-icon="inline-start" className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Syncing…" : "Fetch latest"}
          </Button>
        </>
      }
    >
      <Alert variant={syncError ? "destructive" : "default"}>
        <ShieldCheckIcon />
        <AlertTitle>{syncError ? syncError.title : health.reliability}</AlertTitle>
        <AlertDescription>
          {syncError
            ? syncError.message
            : `Next scheduled sync ${health.nextScheduledSync}. Audit retention ${health.auditRetention}. Last healthy sync ${formatRelativeTime(integration.lastSynced)}.`}
        </AlertDescription>
      </Alert>

      {fetchResult !== null && (
        <Card className="border border-border/70 bg-background/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckCircle2Icon className="size-4 text-emerald-500" />
              Fetch complete
            </CardTitle>
            <CardDescription>
              {fetchResult.changeCount === 0
                ? `${fetchResult.appName} returned no changes.`
                : `Found ${fetchResult.changeCount} change${fetchResult.changeCount !== 1 ? "s" : ""} — ${fetchResult.conflictCount} require${fetchResult.conflictCount !== 1 ? "" : "s"} resolution.`}
            </CardDescription>
          </CardHeader>
          {fetchResult.changeCount > 0 && (
            <CardContent>
              <LinkButton to="/integration/$integrationId/review" params={{ integrationId }} variant="default">
                Review updates
              </LinkButton>
            </CardContent>
          )}
        </Card>
      )}

      <MetricGrid metrics={metrics} />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <SurfaceSection
          title="Incoming changes preview"
          description="Summary of fetched changes before field-level review."
          action={
            <LinkButton to="/integration/$integrationId/review" params={{ integrationId }} variant="secondary">
              Review queue
            </LinkButton>
          }
        >
          {previewLines.length > 0 ? (
            <div className="flex flex-col gap-3">
              {previewLines.map((line) => (
                <div key={line} className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/40 p-4">
                  <GitCompareArrowsIcon className="mt-0.5 size-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{line}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/80 bg-background/30 p-6 text-sm text-muted-foreground">
              No preview is available yet. Run Sync now to fetch a fresh batch.
            </div>
          )}
        </SurfaceSection>

        <SurfaceSection
          title="Audit and operating notes"
          description="Key context for deciding whether to apply, retry, or escalate."
          action={
            <LinkButton to="/integration/$integrationId/history" params={{ integrationId }}>
              Open history
            </LinkButton>
          }
        >
          <div className="flex flex-col gap-3">
            <Card size="sm" className="border border-border/70 bg-background/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <HistoryIcon className="size-4 text-muted-foreground" />
                  Recent versions
                </CardTitle>
                <CardDescription>Quick access to recent version lineage.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <DataPoint label="Current version" value={integration.version} />
                <DataPoint label="Last synced" value={formatRelativeTime(integration.lastSynced)} />
                <DataPoint label="Pending review" value={`${getPendingReviewCount(integrationId)} fields`} />
              </CardContent>
            </Card>
            <Card size="sm" className="border border-border/70 bg-background/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <DatabaseZapIcon className="size-4 text-muted-foreground" />
                  Source notes
                </CardTitle>
                <CardDescription>Connector-specific notes for safe operations.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-muted-foreground">
                <p>
                  Source health is currently marked <span className="font-medium text-foreground">{health.sourceHealth}</span>. Use retryable errors to decide whether to fetch again or inspect the last successful history entry.
                </p>
              </CardContent>
            </Card>
          </div>
        </SurfaceSection>
      </div>
    </PageShell>
  );
}