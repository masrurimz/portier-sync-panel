import type { SyncChange, Integration, IntegrationId } from '@portier-sync/api';
import type { SyncFetchError } from './errors.js';

export interface ReviewResolution {
  kind?: "local" | "external" | "merged";
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
  resolution: ReviewResolution;
}

export interface ReviewBatch {
  integrationId: IntegrationId;
  applicationName: string;
  source: "seed" | "live";
  versionBefore: string;
  versionAfter: string;
  estimatedDuration: string;
  fetchedAt: string;
  items: ReviewItem[];
}

export function cloneBatch(batch: ReviewBatch): ReviewBatch {
  return {
    ...batch,
    items: batch.items.map((item) => ({
      ...item,
      resolution: { ...item.resolution },
    })),
  };
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

export function buildBatchFromApi(integrationId: IntegrationId, integration: Integration, changes: SyncChange[], applicationName: string): ReviewBatch {
  // Filter out rows where values are equal - they don't need review
  const filteredChanges = changes.filter((c) => (c.current_value ?? null) !== (c.new_value ?? null));

  const items = filteredChanges.map((change, index) => {
    return {
      id: change.id,
      fieldName: change.field_name,
      changeType: change.change_type,
      entityLabel: toEntityLabel(change.field_name),
      fieldLabel: toFieldLabel(change.field_name),
      recordLabel: inferRecordLabel(change, index),
      localValue: change.current_value,
      externalValue: change.new_value,
      reason: "This field has a different incoming value. Choose which value to keep.",
      sourceMeta: `${applicationName} • fetched ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`,
      resolution: {} as ReviewResolution,
    } satisfies ReviewItem;
  });

  return {
    integrationId,
    applicationName,
    source: "live",
    versionBefore: integration.version,
    versionAfter: bumpVersion(integration.version),
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

/**
 * Returns items that are pending review (no resolution chosen yet).
 */
export function pendingItems(items: ReviewItem[]) {
  return items.filter((item) => !item.resolution.kind);
}

/**
 * Returns items that have been reviewed (resolution chosen).
 */
export function reviewedItems(items: ReviewItem[]) {
  return items.filter((item) => !!item.resolution.kind);
}

export function applyStatusFromBatch(integration: Integration, batch: ReviewBatch): Integration {
  const conflicts = pendingItems(batch.items).length;
  return {
    ...integration,
    status: conflicts > 0 ? "conflict" : "synced", // kept for SyncStatus compat until bead .q5b.4
    lastSynced: conflicts > 0 ? integration.lastSynced : new Date(),
  };
}

export function getPreviewLines(batch: { items: ReviewItem[] }) {
  return batch.items.slice(0, 4).map((item) => `${item.entityLabel} • ${item.fieldLabel} • ${item.reason}`);
}

// ---------------------------------------------------------------------------
// Three-source domain model (added in bead .9)
// ---------------------------------------------------------------------------

// LocalSnapshot: current locally-accepted state for one integration.
// Source: MSW-backed local DB (packages/api/src/msw/).
// Resets on app start. localVersion advances with each local apply.
export interface LocalSnapshot {
  integrationId: IntegrationId;
  localVersion: string;
  recordCount: number;
  updatedAt: string; // ISO string
}

// PreviewSession: immutable remote-derived comparison snapshot.
// Created by Fetch latest. Never mutated after creation.
// Invariant: items here are the raw remote payload, not operator decisions.
export interface PreviewSession {
  integrationId: IntegrationId;
  baseVersion: string; // localVersion at time of fetch
  proposedVersion: string;
  fetchedAt: string; // ISO string
  applicationName: string;
  source: 'remote';
  items: ReviewItem[]; // raw, unmodified from preview response
}

// DraftStatus: lifecycle state of one integration's mutable operator review work.
export type DraftStatus =
  | 'idle'
  | 'fetching'
  | 'ready'
  | 'stale'
  | 'applying'
  | 'applied'
  | 'failed';

// DraftSession: mutable operator work derived from a PreviewSession.
// Invariant: valid only while LocalSnapshot.localVersion === DraftSession.baseVersion.
// When baseVersion diverges, status becomes 'stale' and apply is blocked.
export interface DraftSession {
  integrationId: IntegrationId;
  baseVersion: string;
  proposedVersion: string;
  status: DraftStatus;
  items: ReviewItem[]; // mutable: operator may change resolution
  pendingCount: number; // items without resolution.kind
  reviewedCount: number; // items with resolution.kind
  applicationName: string;
  fetchedAt: string;
  lastError?: SyncFetchError;
}