/**
 * API Types for Portier Sync Panel
 * Based on API discovery from https://portier-takehometest.onrender.com
 */

// ============================================
// API Response Types
// ============================================

export type ApiResponseCode = "SUCCESS";

export type ApiErrorCode =
  | "missing_parameter"
  | "invalid_application_id"
  | "internal_error";

export interface ApiSuccessResponse<T> {
  code: ApiResponseCode;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  error: string;
  code: ApiErrorCode;
  message: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================
// Sync Data Types
// ============================================

export type ChangeType = "UPDATE" | "ADD" | "DELETE";

export interface SyncChange {
  id: string;
  field_name: string;
  change_type: ChangeType;
  current_value?: string;
  new_value?: string;
}

export interface SyncApproval {
  application_name: string;
  changes: SyncChange[];
}

export interface SyncMetadata {
  [key: string]: unknown;
}

export interface SyncData {
  sync_approval: SyncApproval;
  metadata: SyncMetadata;
}

// ============================================
// Application Types
// ============================================

export type ApplicationId =
  | "salesforce"
  | "hubspot"
  | "stripe"
  | "slack"
  | "zendesk"
  | "intercom";

export type SyncStatus = "synced" | "syncing" | "conflict" | "error";

export interface Integration {
  id: ApplicationId;
  name: string;
  icon: string;
  status: SyncStatus;
  lastSynced: Date | null;
  version: string;
  totalRecords?: number;
  lastSyncDuration?: number; // in seconds
}

// ============================================
// Entity Types (from instruction.md)
// ============================================

export type UserStatus = "active" | "suspended";
export type DoorStatus = "online" | "offline";
export type KeyStatus = "active" | "revoked";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Door {
  id: string;
  name: string;
  location: string;
  device_id: string;
  status: DoorStatus;
  battery_level: number;
  last_seen: string;
  created_at: string;
}

export interface Key {
  id: string;
  user_id: string;
  door_id: string;
  key_type: string;
  access_start: string;
  access_end: string;
  status: KeyStatus;
  created_at: string;
}

// ============================================
// Sync History Types
// ============================================

export type SyncSource = "user" | "system";

export interface SyncHistoryEntry {
  id: string;
  integrationId: ApplicationId;
  timestamp: Date;
  source: SyncSource;
  version: string;
  summary: string;
  details?: string;
  changesCount?: number;
  addedCount?: number;
  updatedCount?: number;
  deletedCount?: number;
}

// ============================================
// Field Utilities
// ============================================

export type EntityType = "user" | "door" | "key";

export interface FieldInfo {
  entity: EntityType;
  field: string;
  label: string;
}

/** Parse field_name like "user.email" into entity and field */
export function parseFieldName(fieldName: string): FieldInfo {
  const [entity, field] = fieldName.split(".") as [EntityType, string];
  return {
    entity,
    field,
    label: formatFieldLabel(entity, field),
  };
}

/** Format field name for display */
export function formatFieldLabel(entity: EntityType, field: string): string {
  const entityLabels: Record<EntityType, string> = {
    user: "User",
    door: "Door",
    key: "Key",
  };

  const fieldLabels: Record<string, string> = {
    email: "Email",
    name: "Name",
    phone: "Phone",
    role: "Role",
    status: "Status",
    location: "Location",
    device_id: "Device ID",
    battery_level: "Battery Level",
    last_seen: "Last Seen",
    key_type: "Key Type",
    access_start: "Access Start",
    access_end: "Access End",
    id: "ID",
  };

  return `${entityLabels[entity]} ${fieldLabels[field] || field}`;
}

// ============================================
// Change Utilities
// ============================================

export function getChangeTypeLabel(type: ChangeType): string {
  const labels: Record<ChangeType, string> = {
    UPDATE: "Updated",
    ADD: "Added",
    DELETE: "Deleted",
  };
  return labels[type];
}

export function getChangeTypeColor(type: ChangeType): string {
  const colors: Record<ChangeType, string> = {
    UPDATE: "text-yellow-500",
    ADD: "text-green-500",
    DELETE: "text-red-500",
  };
  return colors[type];
}

// ============================================
// Integration Utilities
// ============================================

export const INTEGRATIONS: Integration[] = [
  {
    id: "salesforce",
    name: "Salesforce",
    icon: "☁️",
    status: "synced",
    lastSynced: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
    version: "v2.4.1",
    totalRecords: 12453,
    lastSyncDuration: 45,
  },
  {
    id: "hubspot",
    name: "HubSpot",
    icon: "🎯",
    status: "conflict",
    lastSynced: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
    version: "v1.8.3",
    totalRecords: 8521,
    lastSyncDuration: 32,
  },
  {
    id: "stripe",
    name: "Stripe",
    icon: "💳",
    status: "error",
    lastSynced: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
    version: "v3.1.0",
    totalRecords: 3200,
    lastSyncDuration: 28,
  },
  {
    id: "slack",
    name: "Slack",
    icon: "💬",
    status: "synced",
    lastSynced: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
    version: "v1.2.5",
    totalRecords: 450,
    lastSyncDuration: 12,
  },
  {
    id: "zendesk",
    name: "Zendesk",
    icon: "🎫",
    status: "error",
    lastSynced: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    version: "v2.0.8",
    totalRecords: 7234,
    lastSyncDuration: 55,
  },
  {
    id: "intercom",
    name: "Intercom",
    icon: "💡",
    status: "synced",
    lastSynced: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
    version: "v1.5.2",
    totalRecords: 2890,
    lastSyncDuration: 18,
  },
];

export function getIntegrationById(id: ApplicationId): Integration | undefined {
  return INTEGRATIONS.find((i) => i.id === id);
}

export function formatRelativeTime(date: Date | null): string {
  if (!date) return "Never";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minutes ago`;
    }
    return `${diffHours} hours ago`;
  }

  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

export function getStatusColor(status: SyncStatus): string {
  const colors: Record<SyncStatus, string> = {
    synced: "bg-green-500",
    syncing: "bg-blue-500",
    conflict: "bg-yellow-500",
    error: "bg-red-500",
  };
  return colors[status];
}

export function getStatusLabel(status: SyncStatus): string {
  const labels: Record<SyncStatus, string> = {
    synced: "Synced",
    syncing: "Syncing",
    conflict: "Conflict",
    error: "Error",
  };
  return labels[status];
}