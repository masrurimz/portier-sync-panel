import { z } from 'zod';

// Opaque numeric string ID used for routing (e.g. /integration/4).
// Separate from `slug` which is the API application_id param.
export const IntegrationIdSchema = z.string().min(1);
export type IntegrationId = z.infer<typeof IntegrationIdSchema>;

export const SyncStatusSchema = z.enum(['synced', 'syncing', 'conflict', 'error']);
export type SyncStatus = z.infer<typeof SyncStatusSchema>;

// Integration icon configuration with Lucide icon mapping.
// Keys are stable identifiers; lucide field matches lucide-react exports.
export const INTEGRATION_ICONS = {
  cloud: { lucide: 'CloudIcon', label: 'Cloud service' },
  target: { lucide: 'TargetIcon', label: 'CRM/Marketing' },
  'credit-card': { lucide: 'CreditCardIcon', label: 'Payments' },
  'message-square': { lucide: 'MessageSquareIcon', label: 'Messaging' },
  ticket: { lucide: 'TicketIcon', label: 'Support tickets' },
  mail: { lucide: 'MailIcon', label: 'Email' },
} as const;

export type IntegrationIcon = keyof typeof INTEGRATION_ICONS;
export const IntegrationIconSchema = z.enum(Object.keys(INTEGRATION_ICONS) as [IntegrationIcon, ...IntegrationIcon[]]);

export const IntegrationSchema = z.object({
  id: IntegrationIdSchema,
  // slug maps to the external API's application_id param (e.g. "salesforce")
  slug: z.string(),
  name: z.string(),
  icon: IntegrationIconSchema,
  status: SyncStatusSchema,
  lastSynced: z.coerce.date().nullable(),
  version: z.string(),
  lastSyncDuration: z.number().optional(),
});
export type Integration = z.infer<typeof IntegrationSchema>;

// Operator-facing status of one integration's sync lifecycle.
// Distinct from SyncStatus (remote API field) — this is UI/product state.
export const IntegrationOperatorStatusSchema = z.enum([
  'up-to-date',
  'preview-ready',
  'conflicts-need-review',
  'stale-draft',
  'applying-locally',
  'applied-locally',
  'remote-unavailable',
]);
export type IntegrationOperatorStatus = z.infer<typeof IntegrationOperatorStatusSchema>;
