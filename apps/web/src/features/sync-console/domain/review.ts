import type { ApplicationId, Integration, SyncChange } from "../../../lib/api-types";

export interface ReviewResolution {
  kind: "local" | "external" | "merged";
  mergedValue?: string;
}

export interface ReviewItem {
  id: string;
  fieldName: string;
  changeType: SyncChange["change_type"];
  entityLabel: string;
  fieldLabel: string;
  recordLabel: string;
  localValue?: string;
  externalValue?: string;
  reason: string;
  sourceMeta: string;
  conflict: boolean;
  selected: boolean;
  resolution: ReviewResolution;
}

export interface ReviewBatch {
  integrationId: ApplicationId;
  applicationName: string;
  source: "seed" | "live";
  versionBefore: string;
  versionAfter: string;
  estimatedDuration: string;
  fetchedAt: string;
  items: ReviewItem[];
}

function makeSeedItem(input: Omit<ReviewItem, "selected" | "resolution">): ReviewItem {
  return {
    ...input,
    selected: true,
    resolution: { kind: input.conflict ? "local" : "external" },
  };
}

export const seededBatches: Record<ApplicationId, ReviewBatch> = {
  salesforce: {
    integrationId: "salesforce",
    applicationName: "Salesforce",
    source: "seed",
    versionBefore: "v2.4.1",
    versionAfter: "v2.4.2",
    estimatedDuration: "30s",
    fetchedAt: new Date().toISOString(),
    items: [
      makeSeedItem({
        id: "sf-safe-role",
        fieldName: "user.role",
        changeType: "UPDATE",
        entityLabel: "User",
        fieldLabel: "Role",
        recordLabel: "USR-1042",
        localValue: "facility_admin",
        externalValue: "regional_admin",
        reason: "CRM ownership changed and the role mapping resolved cleanly.",
        sourceMeta: "Salesforce owner sync • 08:27",
        conflict: false,
      }),
      makeSeedItem({
        id: "sf-safe-door",
        fieldName: "door.status",
        changeType: "UPDATE",
        entityLabel: "Door",
        fieldLabel: "Status",
        recordLabel: "D-220 / Lobby East",
        localValue: "offline",
        externalValue: "online",
        reason: "Hardware heartbeat restored before this batch was prepared.",
        sourceMeta: "Device poller • 08:28",
        conflict: false,
      }),
      makeSeedItem({
        id: "sf-conflict-email",
        fieldName: "user.email",
        changeType: "UPDATE",
        entityLabel: "User",
        fieldLabel: "Email",
        recordLabel: "USR-1028",
        localValue: "john@company.com",
        externalValue: "j.smith@newdomain.com",
        reason: "Changed in both Portier and Salesforce during the same review window.",
        sourceMeta: "Portier 09:12 • Salesforce 09:15",
        conflict: true,
      }),
      makeSeedItem({
        id: "sf-conflict-phone",
        fieldName: "user.phone",
        changeType: "UPDATE",
        entityLabel: "User",
        fieldLabel: "Phone",
        recordLabel: "USR-1028",
        localValue: "+62 812-9900-100",
        externalValue: "+62 812-9900-101",
        reason: "Support staff and CRM import updated the phone number in parallel.",
        sourceMeta: "Portier 09:13 • Salesforce 09:15",
        conflict: true,
      }),
    ],
  },
  hubspot: {
    integrationId: "hubspot",
    applicationName: "HubSpot",
    source: "seed",
    versionBefore: "v1.8.3",
    versionAfter: "v1.8.4",
    estimatedDuration: "42s",
    fetchedAt: new Date().toISOString(),
    items: [
      makeSeedItem({
        id: "hs-safe-role",
        fieldName: "user.role",
        changeType: "UPDATE",
        entityLabel: "User",
        fieldLabel: "Role",
        recordLabel: "LEAD-045",
        localValue: "sales_rep",
        externalValue: "sales_manager",
        reason: "Ownership changed upstream with a matching role policy.",
        sourceMeta: "HubSpot lifecycle rule • 07:55",
        conflict: false,
      }),
      makeSeedItem({
        id: "hs-safe-door",
        fieldName: "door.location",
        changeType: "ADD",
        entityLabel: "Door",
        fieldLabel: "Location",
        recordLabel: "D-884 / South Lift",
        externalValue: "Jakarta HQ • Floor 12",
        reason: "New office access point discovered from CRM asset import.",
        sourceMeta: "HubSpot asset sync • 07:56",
        conflict: false,
      }),
      makeSeedItem({
        id: "hs-safe-key",
        fieldName: "key.access_end",
        changeType: "UPDATE",
        entityLabel: "Key",
        fieldLabel: "Access End",
        recordLabel: "KEY-1189",
        localValue: "2026-03-12 18:00",
        externalValue: "2026-03-19 18:00",
        reason: "Contract extension matches the approved customer term.",
        sourceMeta: "HubSpot contract renewal • 07:58",
        conflict: false,
      }),
      makeSeedItem({
        id: "hs-conflict-email",
        fieldName: "user.email",
        changeType: "UPDATE",
        entityLabel: "User",
        fieldLabel: "Email",
        recordLabel: "LEAD-045",
        localValue: "john@company.com",
        externalValue: "j.smith@newdomain.com",
        reason: "Customer email changed locally while HubSpot pushed a domain migration.",
        sourceMeta: "Portier 09:12 • HubSpot 09:15",
        conflict: true,
      }),
      makeSeedItem({
        id: "hs-conflict-status",
        fieldName: "user.status",
        changeType: "UPDATE",
        entityLabel: "User",
        fieldLabel: "Status",
        recordLabel: "LEAD-045",
        localValue: "active",
        externalValue: "suspended",
        reason: "CRM compliance hold conflicts with local access reinstatement.",
        sourceMeta: "Portier 09:10 • HubSpot 09:14",
        conflict: true,
      }),
      makeSeedItem({
        id: "hs-conflict-door",
        fieldName: "door.status",
        changeType: "UPDATE",
        entityLabel: "Door",
        fieldLabel: "Status",
        recordLabel: "D-551 / East Corridor",
        localValue: "online",
        externalValue: "offline",
        reason: "Asset retirement import conflicts with recent telemetry.",
        sourceMeta: "Portier 09:07 • HubSpot 09:11",
        conflict: true,
      }),
      makeSeedItem({
        id: "hs-conflict-key",
        fieldName: "key.status",
        changeType: "UPDATE",
        entityLabel: "Key",
        fieldLabel: "Status",
        recordLabel: "KEY-1189",
        localValue: "active",
        externalValue: "revoked",
        reason: "External revocation request arrived after on-site reactivation.",
        sourceMeta: "Portier 09:08 • HubSpot 09:16",
        conflict: true,
      }),
    ],
  },
  stripe: {
    integrationId: "stripe",
    applicationName: "Stripe",
    source: "seed",
    versionBefore: "v3.1.0",
    versionAfter: "v3.1.1",
    estimatedDuration: "0s",
    fetchedAt: new Date().toISOString(),
    items: [],
  },
  slack: {
    integrationId: "slack",
    applicationName: "Slack",
    source: "seed",
    versionBefore: "v1.2.5",
    versionAfter: "v1.2.6",
    estimatedDuration: "18s",
    fetchedAt: new Date().toISOString(),
    items: [
      makeSeedItem({
        id: "sl-safe-role",
        fieldName: "user.role",
        changeType: "UPDATE",
        entityLabel: "User",
        fieldLabel: "Role",
        recordLabel: "SL-0021",
        localValue: "member",
        externalValue: "workspace_admin",
        reason: "Role elevation detected from workspace admin sync.",
        sourceMeta: "Slack workspace sync",
        conflict: false,
      }),
      makeSeedItem({
        id: "sl-safe-key",
        fieldName: "key.access_end",
        changeType: "UPDATE",
        entityLabel: "Key",
        fieldLabel: "Access End",
        recordLabel: "KEY-780",
        localValue: "2026-03-04 17:00",
        externalValue: "2026-03-04 20:00",
        reason: "Shift extension reflected from the shift roster.",
        sourceMeta: "Slack on-call roster",
        conflict: false,
      }),
    ],
  },
  zendesk: {
    integrationId: "zendesk",
    applicationName: "Zendesk",
    source: "seed",
    versionBefore: "v2.0.8",
    versionAfter: "v2.0.9",
    estimatedDuration: "0s",
    fetchedAt: new Date().toISOString(),
    items: [
      makeSeedItem({
        id: "zd-seed-email",
        fieldName: "user.email",
        changeType: "UPDATE",
        entityLabel: "User",
        fieldLabel: "Email",
        recordLabel: "ZD-118",
        localValue: "ops@portier.io",
        externalValue: "support@portier.io",
        reason: "Last healthy preview preserved this unresolved support alias change.",
        sourceMeta: "Last healthy sync • yesterday",
        conflict: true,
      }),
    ],
  },
  intercom: {
    integrationId: "intercom",
    applicationName: "Intercom",
    source: "seed",
    versionBefore: "v1.5.2",
    versionAfter: "v1.5.3",
    estimatedDuration: "14s",
    fetchedAt: new Date().toISOString(),
    items: [
      makeSeedItem({
        id: "ic-safe-status",
        fieldName: "user.status",
        changeType: "UPDATE",
        entityLabel: "User",
        fieldLabel: "Status",
        recordLabel: "IC-300",
        localValue: "active",
        externalValue: "active",
        reason: "Conversation owner refresh confirmed the existing access posture.",
        sourceMeta: "Intercom conversation sync",
        conflict: false,
      }),
      makeSeedItem({
        id: "ic-safe-location",
        fieldName: "door.location",
        changeType: "UPDATE",
        entityLabel: "Door",
        fieldLabel: "Location",
        recordLabel: "D-667",
        localValue: "Bandung HQ",
        externalValue: "Bandung HQ • Annex",
        reason: "Customer support workspace tagged the annex correctly.",
        sourceMeta: "Intercom custom attribute sync",
        conflict: false,
      }),
    ],
  },
};

const conflictFieldSet = new Set(["user.email", "user.phone", "user.status", "door.status", "key.status"]);

export function cloneBatch(batch: ReviewBatch): ReviewBatch {
  return {
    ...batch,
    items: batch.items.map((item) => ({
      ...item,
      resolution: { ...item.resolution },
    })),
  };
}

export function createInitialReviewBatches() {
  return Object.fromEntries(
    (Object.keys(seededBatches) as ApplicationId[]).map((integrationId) => [integrationId, cloneBatch(seededBatches[integrationId])]),
  ) as Record<ApplicationId, ReviewBatch>;
}

export function createInitialPreviewMap() {
  return Object.fromEntries(
    (Object.keys(seededBatches) as ApplicationId[]).map((integrationId) => [integrationId, seededBatches[integrationId].source]),
  ) as Record<ApplicationId, string | null>;
}

function inferRecordLabel(change: SyncChange, index: number) {
  const entity = change.field_name.split(".")[0];
  if (entity === "user") return `USR-${String(index + 101).padStart(4, "0")}`;
  if (entity === "door") return `DOOR-${String(index + 41).padStart(3, "0")}`;
  return `KEY-${String(index + 801).padStart(4, "0")}`;
}

function toEntityLabel(fieldName: string) {
  const [entity] = fieldName.split(".");
  if (entity === "door") return "Door";
  if (entity === "key") return "Key";
  return "User";
}

function toFieldLabel(fieldName: string) {
  const [, field] = fieldName.split(".");
  return field
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function buildBatchFromApi(integrationId: ApplicationId, integration: Integration, changes: SyncChange[], applicationName: string): ReviewBatch {
  const currentBatch = seededBatches[integrationId];
  const items = changes.map((change, index) => {
    const conflict = integrationId === "hubspot"
      ? conflictFieldSet.has(change.field_name)
      : integrationId === "salesforce"
        ? change.field_name === "user.email" || change.field_name === "user.phone"
        : false;

    return {
      id: change.id,
      fieldName: change.field_name,
      changeType: change.change_type,
      entityLabel: toEntityLabel(change.field_name),
      fieldLabel: toFieldLabel(change.field_name),
      recordLabel: inferRecordLabel(change, index),
      localValue: change.current_value,
      externalValue: change.new_value,
      reason: conflict
        ? "Detected as a conflict because both systems may have authoritative changes for this field."
        : "This change can be previewed directly from the external payload.",
      sourceMeta: `${applicationName} • fetched ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`,
      conflict,
      selected: true,
      resolution: { kind: conflict ? "local" : "external" },
    } satisfies ReviewItem;
  });

  return {
    integrationId,
    applicationName,
    source: "live",
    versionBefore: integration.version,
    versionAfter: bumpVersion(currentBatch?.versionAfter ?? integration.version),
    estimatedDuration: `${Math.max(16, items.length * 5)}s`,
    fetchedAt: new Date().toISOString(),
    items,
  };
}

export function bumpVersion(version: string) {
  const match = /v(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match) return version;
  return `v${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}

export function selectedItems(items: ReviewItem[]) {
  return items.filter((item) => item.selected);
}

export function conflictItems(items: ReviewItem[]) {
  return items.filter((item) => item.conflict);
}

export function applyStatusFromBatch(integration: Integration, batch: ReviewBatch): Integration {
  const conflicts = conflictItems(batch.items).length;
  return {
    ...integration,
    status: conflicts > 0 ? "conflict" : "synced",
    lastSynced: conflicts > 0 ? integration.lastSynced : new Date(),
  };
}

export function getPreviewLines(batch: ReviewBatch) {
  return batch.items.slice(0, 4).map((item) => `${item.entityLabel} • ${item.fieldLabel} • ${item.reason}`);
}
