import type { ApplicationId, Integration } from "../../../lib/api-types";
import { INTEGRATIONS, formatRelativeTime, getIntegrationById } from "../../../lib/api-types";

export interface IntegrationHealthMeta {
  reliability: string;
  sourceHealth: "healthy" | "degraded" | "timeout";
  auditRetention: string;
  nextScheduledSync: string;
}

export interface ConsoleMetric {
  label: string;
  value: string;
  hint: string;
}

export const integrationHealthSeed: Record<ApplicationId, IntegrationHealthMeta> = {
  salesforce: {
    reliability: "Source healthy • preview available • low-risk updates can be reviewed immediately",
    sourceHealth: "healthy",
    auditRetention: "90 days",
    nextScheduledSync: "Today • 14:00",
  },
  hubspot: {
    reliability: "Source healthy • preview fetched • operator review required before apply",
    sourceHealth: "healthy",
    auditRetention: "90 days",
    nextScheduledSync: "Today • 13:30",
  },
  stripe: {
    reliability: "Provider degraded • preview could not be refreshed • no new changes applied",
    sourceHealth: "degraded",
    auditRetention: "90 days",
    nextScheduledSync: "Retry in 15 minutes",
  },
  slack: {
    reliability: "Live fetch in progress • workspace change set is still loading",
    sourceHealth: "healthy",
    auditRetention: "30 days",
    nextScheduledSync: "Running now",
  },
  zendesk: {
    reliability: "Provider timed out • last known review queue preserved for audit only",
    sourceHealth: "timeout",
    auditRetention: "90 days",
    nextScheduledSync: "Retry in 30 minutes",
  },
  intercom: {
    reliability: "Source healthy • last batch completed with no unresolved conflicts",
    sourceHealth: "healthy",
    auditRetention: "60 days",
    nextScheduledSync: "Today • 15:00",
  },
};

export function createInitialIntegrations(): Integration[] {
  return INTEGRATIONS.map((integration) => ({ ...integration }));
}

export function requireIntegration(integrationId: ApplicationId) {
  const integration = getIntegrationById(integrationId);
  if (!integration) {
    throw new Error(`Unknown integration: ${integrationId}`);
  }
  return integration;
}

export function findIntegration(integrations: Integration[], integrationId: ApplicationId) {
  return integrations.find((item) => item.id === integrationId) ?? requireIntegration(integrationId);
}

export function buildIntegrationMetrics({
  integration,
  pendingUpdates,
  conflicts,
  health,
  hasFetchError,
}: {
  integration: Integration;
  pendingUpdates: number;
  conflicts: number;
  health: IntegrationHealthMeta;
  hasFetchError: boolean;
}): ConsoleMetric[] {
  return [
    {
      label: "Total records",
      value: new Intl.NumberFormat("en-US").format(integration.totalRecords ?? 0),
      hint: "Modeled entity count currently mirrored for this connector.",
    },
    {
      label: "Pending updates",
      value: String(pendingUpdates),
      hint: hasFetchError ? "Preview failed before a new batch could be generated." : "Selected fields waiting in the current review batch.",
    },
    {
      label: "Unresolved conflicts",
      value: String(conflicts),
      hint: conflicts > 0 ? "These fields need explicit operator direction before apply." : "No ambiguous fields in the current batch.",
    },
    {
      label: "Last sync duration",
      value: `${integration.lastSyncDuration ?? 0}s`,
      hint: `Last healthy sync ${formatRelativeTime(integration.lastSynced)}.`,
    },
    {
      label: "Audit retention",
      value: health.auditRetention,
      hint: "Applied review decisions remain visible in history for auditability.",
    },
  ];
}

export function buildOverviewMetrics(integrations: Integration[]): ConsoleMetric[] {
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
  return integrations.filter((integration) => integration.status === "conflict" || integration.status === "error");
}
