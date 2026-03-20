import type { SyncChange } from '../../types.js'

// Mock sync changes returned by the real API for each integration
export const mockSyncChanges: Record<string, { applicationName: string; changes: SyncChange[] }> = {
  salesforce: {
    applicationName: 'Salesforce',
    changes: [
      { id: 'sf-1', field_name: 'user.role', change_type: 'UPDATE', current_value: 'facility_admin', new_value: 'regional_admin' },
      { id: 'sf-2', field_name: 'door.status', change_type: 'UPDATE', current_value: 'offline', new_value: 'online' },
      { id: 'sf-3', field_name: 'user.email', change_type: 'UPDATE', current_value: 'john@company.com', new_value: 'j.smith@newdomain.com' },
      { id: 'sf-4', field_name: 'user.phone', change_type: 'UPDATE', current_value: '+62 812-9900-100', new_value: '+62 812-9900-101' },
    ],
  },
  hubspot: {
    applicationName: 'HubSpot',
    changes: [
      { id: 'hs-1', field_name: 'user.role', change_type: 'UPDATE', current_value: 'viewer', new_value: 'editor' },
      { id: 'hs-2', field_name: 'user.email', change_type: 'UPDATE', current_value: 'alex@old.com', new_value: 'alex@new.com' },
      { id: 'hs-3', field_name: 'door.location', change_type: 'UPDATE', current_value: 'Floor 2', new_value: 'Floor 3' },
      { id: 'hs-4', field_name: 'key.key_type', change_type: 'UPDATE', current_value: 'standard', new_value: 'master' },
      { id: 'hs-5', field_name: 'user.status', change_type: 'UPDATE', current_value: 'active', new_value: 'suspended' },
    ],
  },
  slack: {
    applicationName: 'Slack',
    changes: [
      { id: 'sl-1', field_name: 'user.name', change_type: 'UPDATE', current_value: 'Jane Doe', new_value: 'Jane Smith' },
      { id: 'sl-2', field_name: 'user.role', change_type: 'UPDATE', current_value: 'member', new_value: 'admin' },
    ],
  },
  intercom: {
    applicationName: 'Intercom',
    changes: [
      { id: 'ic-1', field_name: 'key.status', change_type: 'UPDATE', current_value: 'active', new_value: 'revoked' },
      { id: 'ic-2', field_name: 'user.name', change_type: 'ADD', new_value: 'New User' },
    ],
  },
  // stripe and zendesk are handled by error-handlers (502 and 400 respectively)
  stripe: {
    applicationName: 'Stripe',
    changes: [],
  },
  zendesk: {
    applicationName: 'Zendesk',
    changes: [],
  },
}