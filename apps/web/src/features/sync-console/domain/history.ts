import type { ApplicationId, SyncHistoryEntry } from "../../../lib/api-types";
import type { ReviewItem } from "./review";

export const historySeed: Record<ApplicationId, SyncHistoryEntry[]> = {
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

export function createInitialHistories() {
  return Object.fromEntries(
    (Object.keys(historySeed) as ApplicationId[]).map((integrationId) => [
      integrationId,
      historySeed[integrationId].map((entry) => ({ ...entry })),
    ]),
  ) as Record<ApplicationId, SyncHistoryEntry[]>;
}

export function buildAppliedHistoryEntry({
  integrationId,
  version,
  selectedItems,
}: {
  integrationId: ApplicationId;
  version: string;
  selectedItems: ReviewItem[];
}): SyncHistoryEntry {
  const conflicts = selectedItems.filter((item) => item.conflict).length;
  return {
    id: `hist-${integrationId}-${Date.now()}`,
    integrationId,
    timestamp: new Date(),
    source: "user",
    version,
    summary: `Manual review applied${conflicts > 0 ? ` with ${conflicts} conflict resolution${conflicts > 1 ? "s" : ""}` : ""}`,
    details: `${selectedItems.length} selected field${selectedItems.length === 1 ? "" : "s"} were applied after operator review.`,
    changesCount: selectedItems.length,
    addedCount: selectedItems.filter((item) => item.changeType === "ADD").length,
    updatedCount: selectedItems.filter((item) => item.changeType === "UPDATE").length,
    deletedCount: selectedItems.filter((item) => item.changeType === "DELETE").length,
  };
}
