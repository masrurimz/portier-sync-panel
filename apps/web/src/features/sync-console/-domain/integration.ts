import type { Integration, IntegrationId } from '@portier-sync/api';

export interface IntegrationHealthMeta {
  reliability: string;
  sourceHealth: "healthy" | "degraded" | "timeout";
  nextScheduledSync: string;
}

export interface ConsoleMetric {
  label: string;
  value: string;
  hint: string;
}

export const integrationHealthSeed: Record<IntegrationId, IntegrationHealthMeta> = {
  "1": {
    reliability: "Source healthy • preview available • low-risk updates can be reviewed immediately",
    sourceHealth: "healthy",
    nextScheduledSync: "Today • 14:00",
  },
  "2": {
    reliability: "Source healthy • preview fetched • operator review required before apply",
    sourceHealth: "healthy",
    nextScheduledSync: "Today • 13:30",
  },
  "3": {
    reliability: "Provider degraded • preview could not be refreshed • no new changes applied",
    sourceHealth: "degraded",
    nextScheduledSync: "Retry in 15 minutes",
  },
  "4": {
    reliability: "Live fetch in progress • workspace change set is still loading",
    sourceHealth: "healthy",
    nextScheduledSync: "Running now",
  },
  "5": {
    reliability: "Provider timed out • last known review queue preserved for audit only",
    sourceHealth: "timeout",
    nextScheduledSync: "Retry in 30 minutes",
  },
  "6": {
    reliability: "Source healthy • last batch completed with no items needing a decision",
    sourceHealth: "healthy",
    nextScheduledSync: "Today • 15:00",
  },
};

export function formatRelativeTime(date: Date | null): string {
  if (!date) return 'Never';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    }
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  }
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

export function findIntegration(integrations: Integration[], integrationId: IntegrationId) {
  return integrations.find((item) => item.id === integrationId);
}

export function buildIntegrationMetrics({
  integration,
  pendingUpdates,
  conflicts,
  hasFetchError,
}: {
  integration: Integration;
  pendingUpdates: number;
  conflicts: number;
  hasFetchError: boolean;
}): ConsoleMetric[] {
  return [
    {
      label: "Pending updates",
      value: String(pendingUpdates),
      hint: hasFetchError ? "Preview failed before a new batch could be generated." : "Selected fields waiting in the current review batch.",
    },
    {
      label: "Needs decision",
      value: String(conflicts),
      hint: conflicts > 0 ? "These items require your decision before they can be staged and applied." : "No items need a decision in the current batch.",
    },
    {
      label: "Last sync duration",
      value: `${integration.lastSyncDuration ?? 0}s`,
      hint: `Last healthy sync ${formatRelativeTime(integration.lastSynced)}.`,
    },
  ];
}

export function buildOverviewMetrics(integrations: Integration[]): ConsoleMetric[] {
  // 'conflict' status is set by the client heuristic until bead .q5b.4 replaces it with backend-owned classification.
  const needingReview = integrations.filter((integration) => integration.status === "conflict").length;
  const degraded = integrations.filter((integration) => integration.status === "error").length;
  const syncing = integrations.filter((integration) => integration.status === "syncing").length;

  return [
    { label: "Connected integrations", value: String(integrations.length), hint: "Across CRM, payments, support, and comms." },
    { label: "Need review", value: String(needingReview), hint: "Connectors waiting on operator approval." },
    { label: "Degraded", value: String(degraded), hint: "Providers that failed preview refresh or sync prep." },
    { label: "Currently syncing", value: String(syncing), hint: "Batches still fetching upstream changes." },
  ];
}

export function getPriorityIntegrations(integrations: Integration[]) {
  // conflict status is set by client heuristic; will be replaced by operator status in bead .q5b.4
  return integrations.filter((integration) => integration.status === "conflict" || integration.status === "error");
}