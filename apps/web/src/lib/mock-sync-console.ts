import type { ApplicationId, ChangeType, Integration, SyncHistoryEntry } from "./api-types";
import { INTEGRATIONS, formatRelativeTime, getIntegrationById, getStatusLabel, parseFieldName } from "./api-types";

export interface ConsoleMetric {
  label: string;
  value: string;
  hint: string;
}

export interface ReviewDecisionOption {
  label: string;
  active?: boolean;
}

export interface ReviewItem {
  id: string;
  fieldName: string;
  changeType: ChangeType;
  localValue?: string;
  externalValue?: string;
  reason: string;
  entityLabel: string;
  recordLabel: string;
  sourceMeta: string;
  resolutionOptions: ReviewDecisionOption[];
}

export interface ReviewGroup {
  label: string;
  count: number;
  items: ReviewItem[];
}

export interface IntegrationPageModel {
  integration: Integration;
  healthSummary: string;
  pendingUpdates: number;
  unresolvedConflicts: number;
  auditRetention: string;
  previewLines: string[];
  metrics: ConsoleMetric[];
  reviewSummary: {
    totalChanges: number;
    safeChanges: number;
    conflicts: number;
    estimatedDuration: string;
  };
  reviewGroups: ReviewGroup[];
  history: SyncHistoryEntry[];
}

const historySeed: Record<ApplicationId, SyncHistoryEntry[]> = {
  salesforce: [
    {
      id: "hist_sf_241",
      integrationId: "salesforce",
      timestamp: new Date("2026-03-02T08:30:00Z"),
      source: "system",
      version: "v2.4.1",
      summary: "Automatic sync completed",
      details: "Applied 5 changes after review with no unresolved conflicts.",
      changesCount: 5,
      addedCount: 1,
      updatedCount: 4,
      deletedCount: 0,
    },
    {
      id: "hist_sf_240",
      integrationId: "salesforce",
      timestamp: new Date("2026-03-02T04:30:00Z"),
      source: "system",
      version: "v2.4.0",
      summary: "Nightly sync completed",
      details: "User access roles refreshed from external CRM ownership changes.",
      changesCount: 2,
      addedCount: 0,
      updatedCount: 2,
      deletedCount: 0,
    },
    {
      id: "hist_sf_239",
      integrationId: "salesforce",
      timestamp: new Date("2026-03-01T20:30:00Z"),
      source: "user",
      version: "v2.3.9",
      summary: "Manual sync triggered",
      details: "Operator reviewed two key expirations before applying.",
      changesCount: 2,
      addedCount: 0,
      updatedCount: 1,
      deletedCount: 1,
    },
  ],
  hubspot: [
    {
      id: "hist_hs_183",
      integrationId: "hubspot",
      timestamp: new Date("2026-03-02T08:10:00Z"),
      source: "system",
      version: "v1.8.3",
      summary: "Sync paused with unresolved conflicts",
      details: "Four field-level conflicts require review before apply.",
      changesCount: 7,
      addedCount: 1,
      updatedCount: 6,
      deletedCount: 0,
    },
    {
      id: "hist_hs_182",
      integrationId: "hubspot",
      timestamp: new Date("2026-03-01T23:40:00Z"),
      source: "system",
      version: "v1.8.2",
      summary: "Incremental sync completed",
      details: "Lead status and ownership updates applied successfully.",
      changesCount: 3,
      addedCount: 0,
      updatedCount: 3,
      deletedCount: 0,
    },
    {
      id: "hist_hs_181",
      integrationId: "hubspot",
      timestamp: new Date("2026-03-01T16:25:00Z"),
      source: "user",
      version: "v1.8.1",
      summary: "Manual review completed",
      details: "Email conflict resolved by keeping local record.",
      changesCount: 1,
      addedCount: 0,
      updatedCount: 1,
      deletedCount: 0,
    },
  ],
  stripe: [
    {
      id: "hist_st_310",
      integrationId: "stripe",
      timestamp: new Date("2026-03-01T18:00:00Z"),
      source: "system",
      version: "v3.1.0",
      summary: "Provider returned internal error",
      details: "No changes were applied. Payment profile sync remains stale.",
      changesCount: 0,
      addedCount: 0,
      updatedCount: 0,
      deletedCount: 0,
    },
  ],
  slack: [
    {
      id: "hist_sl_125",
      integrationId: "slack",
      timestamp: new Date("2026-03-02T08:50:00Z"),
      source: "system",
      version: "v1.2.5",
      summary: "Workspace membership sync in progress",
      details: "Fetching membership and channel role changes.",
      changesCount: 2,
      addedCount: 1,
      updatedCount: 1,
      deletedCount: 0,
    },
  ],
  zendesk: [
    {
      id: "hist_zd_208",
      integrationId: "zendesk",
      timestamp: new Date("2026-03-01T13:15:00Z"),
      source: "system",
      version: "v2.0.8",
      summary: "Gateway failure during sync preparation",
      details: "Zendesk was unavailable. Review queue preserved from prior batch.",
      changesCount: 0,
      addedCount: 0,
      updatedCount: 0,
      deletedCount: 0,
    },
  ],
  intercom: [
    {
      id: "hist_ic_152",
      integrationId: "intercom",
      timestamp: new Date("2026-03-02T07:55:00Z"),
      source: "system",
      version: "v1.5.2",
      summary: "Conversation sync completed",
      details: "Status and role updates applied without review.",
      changesCount: 4,
      addedCount: 1,
      updatedCount: 3,
      deletedCount: 0,
    },
  ],
};

const reviewGroupSeed: Record<ApplicationId, ReviewGroup[]> = {
  salesforce: [
    {
      label: "Safe updates",
      count: 3,
      items: [
        {
          id: "sf_safe_1",
          fieldName: "user.role",
          changeType: "UPDATE",
          localValue: "facility_admin",
          externalValue: "regional_admin",
          reason: "Role mapping updated from CRM ownership.",
          entityLabel: "User",
          recordLabel: "USR-1042",
          sourceMeta: "Salesforce • Owner sync • 08:27",
          resolutionOptions: [{ label: "Accept external", active: true }, { label: "Keep local" }],
        },
        {
          id: "sf_safe_2",
          fieldName: "door.status",
          changeType: "UPDATE",
          localValue: "offline",
          externalValue: "online",
          reason: "Hardware heartbeat has been restored.",
          entityLabel: "Door",
          recordLabel: "D-220 / Lobby East",
          sourceMeta: "Device poller • 08:28",
          resolutionOptions: [{ label: "Accept external", active: true }, { label: "Keep local" }],
        },
        {
          id: "sf_safe_3",
          fieldName: "key.status",
          changeType: "DELETE",
          localValue: "active",
          externalValue: "revoked",
          reason: "Expired credential was revoked upstream.",
          entityLabel: "Key",
          recordLabel: "KEY-4431",
          sourceMeta: "Salesforce • Access policy • 08:29",
          resolutionOptions: [{ label: "Accept external", active: true }, { label: "Keep local" }],
        },
      ],
    },
    {
      label: "Conflicts",
      count: 2,
      items: [
        {
          id: "sf_conflict_1",
          fieldName: "user.email",
          changeType: "UPDATE",
          localValue: "john@company.com",
          externalValue: "j.smith@newdomain.com",
          reason: "Changed in both Portier and Salesforce within the same sync window.",
          entityLabel: "User",
          recordLabel: "USR-1028",
          sourceMeta: "Portier 09:12 • Salesforce 09:15",
          resolutionOptions: [
            { label: "Keep local", active: true },
            { label: "Accept external" },
            { label: "Edit merged value" },
          ],
        },
        {
          id: "sf_conflict_2",
          fieldName: "user.phone",
          changeType: "UPDATE",
          localValue: "+62 812-9900-100",
          externalValue: "+62 812-9900-101",
          reason: "Contact number changed by support staff and CRM import in parallel.",
          entityLabel: "User",
          recordLabel: "USR-1028",
          sourceMeta: "Portier 09:13 • Salesforce 09:15",
          resolutionOptions: [
            { label: "Keep local" },
            { label: "Accept external", active: true },
            { label: "Edit merged value" },
          ],
        },
      ],
    },
  ],
  hubspot: [
    {
      label: "Safe updates",
      count: 3,
      items: [
        {
          id: "hs_safe_1",
          fieldName: "user.role",
          changeType: "UPDATE",
          localValue: "sales_rep",
          externalValue: "sales_manager",
          reason: "Ownership changed upstream with matching role policy.",
          entityLabel: "User",
          recordLabel: "LEAD-045",
          sourceMeta: "HubSpot lifecycle rule • 07:55",
          resolutionOptions: [{ label: "Accept external", active: true }, { label: "Keep local" }],
        },
        {
          id: "hs_safe_2",
          fieldName: "door.location",
          changeType: "ADD",
          externalValue: "Jakarta HQ • Floor 12",
          reason: "New office access point discovered from CRM asset import.",
          entityLabel: "Door",
          recordLabel: "D-884 / South Lift",
          sourceMeta: "HubSpot asset sync • 07:56",
          resolutionOptions: [{ label: "Accept external", active: true }, { label: "Ignore for now" }],
        },
        {
          id: "hs_safe_3",
          fieldName: "key.access_end",
          changeType: "UPDATE",
          localValue: "2026-03-12 18:00",
          externalValue: "2026-03-19 18:00",
          reason: "Contract extension matched approved customer term.",
          entityLabel: "Key",
          recordLabel: "KEY-1189",
          sourceMeta: "HubSpot contract renewal • 07:58",
          resolutionOptions: [{ label: "Accept external", active: true }, { label: "Keep local" }],
        },
      ],
    },
    {
      label: "Conflicts",
      count: 4,
      items: [
        {
          id: "hs_conflict_1",
          fieldName: "user.email",
          changeType: "UPDATE",
          localValue: "john@company.com",
          externalValue: "j.smith@newdomain.com",
          reason: "Customer email changed locally while HubSpot pushed a domain migration.",
          entityLabel: "User",
          recordLabel: "LEAD-045",
          sourceMeta: "Portier 09:12 • HubSpot 09:15",
          resolutionOptions: [
            { label: "Keep local", active: true },
            { label: "Accept external" },
            { label: "Edit merged value" },
          ],
        },
        {
          id: "hs_conflict_2",
          fieldName: "user.status",
          changeType: "UPDATE",
          localValue: "active",
          externalValue: "suspended",
          reason: "CRM compliance hold conflicts with local access reinstatement.",
          entityLabel: "User",
          recordLabel: "LEAD-045",
          sourceMeta: "Portier 09:10 • HubSpot 09:14",
          resolutionOptions: [
            { label: "Keep local" },
            { label: "Accept external", active: true },
            { label: "Edit merged value" },
          ],
        },
        {
          id: "hs_conflict_3",
          fieldName: "door.status",
          changeType: "UPDATE",
          localValue: "online",
          externalValue: "offline",
          reason: "HubSpot asset import marked the door as retired while telemetry still reports healthy.",
          entityLabel: "Door",
          recordLabel: "D-551 / East Corridor",
          sourceMeta: "Portier 09:07 • HubSpot 09:11",
          resolutionOptions: [
            { label: "Keep local", active: true },
            { label: "Accept external" },
            { label: "Edit merged value" },
          ],
        },
        {
          id: "hs_conflict_4",
          fieldName: "key.status",
          changeType: "UPDATE",
          localValue: "active",
          externalValue: "revoked",
          reason: "External revocation request arrived after on-site reactivation.",
          entityLabel: "Key",
          recordLabel: "KEY-1189",
          sourceMeta: "Portier 09:08 • HubSpot 09:16",
          resolutionOptions: [
            { label: "Keep local" },
            { label: "Accept external", active: true },
            { label: "Edit merged value" },
          ],
        },
      ],
    },
  ],
  stripe: [
    {
      label: "Provider unavailable",
      count: 1,
      items: [
        {
          id: "st_error_1",
          fieldName: "user.status",
          changeType: "UPDATE",
          localValue: "active",
          externalValue: "unknown",
          reason: "Static placeholder row for failed upstream preview.",
          entityLabel: "User",
          recordLabel: "PAY-ERR",
          sourceMeta: "Stripe API unavailable",
          resolutionOptions: [{ label: "Retry when provider recovers", active: true }],
        },
      ],
    },
  ],
  slack: [
    {
      label: "Incoming updates",
      count: 2,
      items: [
        {
          id: "sl_sync_1",
          fieldName: "user.role",
          changeType: "UPDATE",
          localValue: "member",
          externalValue: "workspace_admin",
          reason: "Role elevation detected from workspace admin sync.",
          entityLabel: "User",
          recordLabel: "SL-0021",
          sourceMeta: "Slack • Workspace sync",
          resolutionOptions: [{ label: "Preview only", active: true }],
        },
        {
          id: "sl_sync_2",
          fieldName: "key.access_end",
          changeType: "UPDATE",
          localValue: "2026-03-04 17:00",
          externalValue: "2026-03-04 20:00",
          reason: "Shift extension reflected from shift channel roster.",
          entityLabel: "Key",
          recordLabel: "KEY-780",
          sourceMeta: "Slack • On-call roster",
          resolutionOptions: [{ label: "Preview only", active: true }],
        },
      ],
    },
  ],
  zendesk: [
    {
      label: "Review queue preserved",
      count: 1,
      items: [
        {
          id: "zd_wait_1",
          fieldName: "user.email",
          changeType: "UPDATE",
          localValue: "ops@portier.io",
          externalValue: "support@portier.io",
          reason: "Pending from prior successful preview; current provider health blocks refresh.",
          entityLabel: "User",
          recordLabel: "ZD-118",
          sourceMeta: "Last healthy sync • yesterday",
          resolutionOptions: [{ label: "Inspect later", active: true }],
        },
      ],
    },
  ],
  intercom: [
    {
      label: "Safe updates",
      count: 2,
      items: [
        {
          id: "ic_safe_1",
          fieldName: "user.status",
          changeType: "UPDATE",
          localValue: "active",
          externalValue: "active",
          reason: "Conversation owner refresh confirmed existing access status.",
          entityLabel: "User",
          recordLabel: "IC-300",
          sourceMeta: "Intercom conversation sync",
          resolutionOptions: [{ label: "Accept external", active: true }],
        },
        {
          id: "ic_safe_2",
          fieldName: "door.location",
          changeType: "UPDATE",
          localValue: "Bandung HQ",
          externalValue: "Bandung HQ • Annex",
          reason: "Customer support workspace tagged the annex correctly.",
          entityLabel: "Door",
          recordLabel: "D-667",
          sourceMeta: "Intercom custom attribute sync",
          resolutionOptions: [{ label: "Accept external", active: true }],
        },
      ],
    },
  ],
};

const healthSummaryByStatus: Record<Integration["status"], string> = {
  synced: "Source healthy • last run complete • no unresolved review items",
  syncing: "Source healthy • fetching latest upstream changes • preview will refresh when ready",
  conflict: "Source healthy • preview fetched • operator review required before apply",
  error: "Provider degraded • latest preview could not be refreshed • no new changes applied",
};

const pendingByStatus: Record<Integration["status"], number> = {
  synced: 2,
  syncing: 2,
  conflict: 7,
  error: 0,
};

const unresolvedByStatus: Record<Integration["status"], number> = {
  synced: 0,
  syncing: 0,
  conflict: 4,
  error: 0,
};

export function getOverviewMetrics() {
  const needingReview = INTEGRATIONS.filter((integration) => integration.status === "conflict").length;
  const degraded = INTEGRATIONS.filter((integration) => integration.status === "error").length;
  const syncing = INTEGRATIONS.filter((integration) => integration.status === "syncing").length;

  return [
    { label: "Connected integrations", value: String(INTEGRATIONS.length), hint: "Across CRM, payments, support, and comms." },
    { label: "Need review", value: String(needingReview), hint: "Unresolved conflicts waiting on operator approval." },
    { label: "Degraded", value: String(degraded), hint: "Providers that failed preview refresh or sync prep." },
    { label: "Currently syncing", value: String(syncing), hint: "Batches still fetching upstream changes." },
  ] satisfies ConsoleMetric[];
}

export function getPriorityIntegrations() {
  return INTEGRATIONS.filter((integration) => integration.status === "conflict" || integration.status === "error");
}

export function getIntegrationPageModel(integrationId: ApplicationId): IntegrationPageModel {
  const integration = getIntegrationById(integrationId) ?? INTEGRATIONS[0];
  const reviewGroups = reviewGroupSeed[integration.id] ?? reviewGroupSeed.salesforce;
  const history = historySeed[integration.id] ?? historySeed.salesforce;

  const totalChanges = reviewGroups.reduce((total, group) => total + group.count, 0);
  const conflicts = reviewGroups.find((group) => group.label === "Conflicts")?.count ?? unresolvedByStatus[integration.status];
  const safeChanges = Math.max(totalChanges - conflicts, 0);
  const pendingUpdates = pendingByStatus[integration.status] || totalChanges;
  const unresolvedConflicts = unresolvedByStatus[integration.status] || conflicts;

  const previewLines = reviewGroups
    .flatMap((group) => group.items)
    .slice(0, 4)
    .map((item) => {
      const field = parseFieldName(item.fieldName);
      return `${item.entityLabel} • ${field.label} • ${item.reason}`;
    });

  return {
    integration,
    healthSummary: healthSummaryByStatus[integration.status],
    pendingUpdates,
    unresolvedConflicts,
    auditRetention: "90 days",
    previewLines,
    metrics: [
      {
        label: "Total records",
        value: new Intl.NumberFormat("en-US").format(integration.totalRecords ?? 0),
        hint: "Modeled entity count currently mirrored for this connector.",
      },
      {
        label: "Pending updates",
        value: String(pendingUpdates),
        hint: integration.status === "error" ? "Last refresh failed before preview generation." : "Incoming fields queued in the current review batch.",
      },
      {
        label: "Unresolved conflicts",
        value: String(unresolvedConflicts),
        hint: unresolvedConflicts === 0 ? "This connector is currently clear for apply." : "Field decisions still required before merge.",
      },
      {
        label: "Last sync duration",
        value: `${integration.lastSyncDuration ?? 0}s`,
        hint: `Last healthy sync ${formatRelativeTime(integration.lastSynced)}.`,
      },
      {
        label: "Audit retention",
        value: "90 days",
        hint: "Review and history artifacts remain inspectable for operator traceability.",
      },
    ],
    reviewSummary: {
      totalChanges,
      safeChanges,
      conflicts,
      estimatedDuration: `${Math.max(18, totalChanges * 6)}s`,
    },
    reviewGroups,
    history,
  };
}

export function getStatusTone(status: Integration["status"]) {
  switch (status) {
    case "synced":
      return "secondary" as const;
    case "syncing":
      return "outline" as const;
    case "conflict":
      return "destructive" as const;
    case "error":
      return "destructive" as const;
  }
}

export function getStatusSummary(status: Integration["status"]) {
  return getStatusLabel(status);
}

export function getReviewEntitySummary(groups: ReviewGroup[]) {
  return groups
    .flatMap((group) => group.items)
    .reduce<Record<string, number>>((summary, item) => {
      summary[item.entityLabel] = (summary[item.entityLabel] ?? 0) + 1;
      return summary;
    }, {});
}
