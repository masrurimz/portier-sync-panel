import { Alert, AlertDescription, AlertTitle } from "@portier-sync/ui/components/alert";
import { Button } from "@portier-sync/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@portier-sync/ui/components/card";
import { useNavigate } from "@tanstack/react-router";
import { DatabaseZapIcon, GitCompareArrowsIcon, HistoryIcon, RefreshCwIcon, ShieldCheckIcon } from "lucide-react";

import type { ApplicationId } from "../../lib/api-types";
import { formatRelativeTime } from "../../lib/api-types";
import { useSyncConsole } from "../../lib/sync-console-store";
import { DataPoint, IntegrationLinkSet, LinkButton, MetricGrid, PageShell, StatusBadge, SurfaceSection } from "./shared";

export function DetailPage({ integrationId }: { integrationId: ApplicationId }) {
  const navigate = useNavigate();
  const {
    integrations,
    healthByIntegration,
    syncingId,
    getIntegrationMetrics,
    getDetailPreviewLines,
    getPendingReviewCount,
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

  const handleSyncNow = async () => {
    try {
      await syncNow(integrationId);
      await navigate({ to: "/integration/$integrationId/review", params: { integrationId } });
    } catch {
      // toast feedback is handled in the sync store; stay on the detail page on failure.
    }
  };

  return (
    <PageShell
      eyebrow="Integration detail"
      title={`${integration.name} sync surface`}
      description="Health, pending work, preview context, and audit access are kept together so the operator can decide whether to fetch, review, or inspect history next."
      actions={
        <>
          <StatusBadge status={integration.status} />
          <Button onClick={handleSyncNow} disabled={isSyncing} variant="default">
            <RefreshCwIcon data-icon="inline-start" className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Syncing…" : "Sync now"}
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <LinkButton to="/">All integrations</LinkButton>
        <IntegrationLinkSet integrationId={integrationId} current="overview" />
      </div>

      <Alert variant={syncError ? "destructive" : "default"}>
        <ShieldCheckIcon />
        <AlertTitle>{syncError ? syncError.title : health.reliability}</AlertTitle>
        <AlertDescription>
          {syncError
            ? syncError.message
            : `Next scheduled sync ${health.nextScheduledSync}. Audit retention ${health.auditRetention}. Last healthy sync ${formatRelativeTime(integration.lastSynced)}.`}
        </AlertDescription>
      </Alert>

      <MetricGrid metrics={metrics} />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <SurfaceSection
          title="Incoming changes preview"
          description="Fetched changes are summarized before the operator commits to field-by-field review."
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
              No preview is currently available for this integration. Trigger Sync now to fetch a fresh batch.
            </div>
          )}
        </SurfaceSection>

        <SurfaceSection
          title="Audit and operating notes"
          description="Context that helps an operator understand the connector before applying or escalating a batch."
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
                <CardDescription>Version lineage remains one click away from the active operational surface.</CardDescription>
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
                <CardDescription>These notes anchor the operator in connector-specific constraints.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-muted-foreground">
                <p>
                  Source health is currently marked <span className="font-medium text-foreground">{health.sourceHealth}</span>. Use retryable errors to decide whether to fetch again or inspect the last successful history entry.
                </p>
                <p>
                  Live fetch is only required for Sync now. The rest of the UI remains locally modeled so the review and audit flows can be exercised without backend support.
                </p>
              </CardContent>
            </Card>
          </div>
        </SurfaceSection>
      </div>
    </PageShell>
  );
}
