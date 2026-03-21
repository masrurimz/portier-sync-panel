import type { Integration } from '@portier-sync/api';

export interface ConsoleMetric {
  label: string;
  value: string;
  hint: string;
}

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