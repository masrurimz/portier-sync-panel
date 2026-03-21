import { http, HttpResponse } from 'msw';
import { localSnapshotStore } from '../data/local-snapshots';
import { localAuditLog } from '../data/local-history';
import type { AuditEntry } from '../../schema/index';

interface ApplyReviewBody {
  proposedVersion: string;
  selectedCount: number;
  conflictResolutionCount: number;
  applicationName: string;
}

// Local test infrastructure endpoints — clearly distinct from /api/v1/... remote endpoints.
// These represent the MSW-backed local DB; not production backend APIs.
export const localHandlers = [
  http.get('/local/integrations/:id/snapshot', ({ params }) => {
    const { id } = params as { id: string };
    const snapshot = localSnapshotStore[id];

    if (!snapshot) {
      return HttpResponse.json(
        { error: 'Not found', message: `No local snapshot for integration ${id}` },
        { status: 404 },
      );
    }

    return HttpResponse.json({ data: snapshot });
  }),

  http.put('/local/integrations/:id/apply-review', async ({ params, request }) => {
    const { id } = params as { id: string };
    const snapshot = localSnapshotStore[id];

    if (!snapshot) {
      return HttpResponse.json(
        { error: 'Not found', message: `No local snapshot for integration ${id}` },
        { status: 404 },
      );
    }

    const body = (await request.json()) as ApplyReviewBody;
    const baseVersion = snapshot.localVersion;

    // Mutate local DB in place — intentional side effect.
    snapshot.localVersion = body.proposedVersion;
    snapshot.updatedAt = new Date().toISOString();
    snapshot.recordCount = Math.max(0, snapshot.recordCount + body.selectedCount - body.conflictResolutionCount);

    const auditEntry: AuditEntry = {
      id: `local-${id}-${Date.now()}`,
      integrationId: id,
      origin: 'local',
      eventType: 'apply-local',
      summary: `Applied ${body.selectedCount} change${body.selectedCount === 1 ? '' : 's'} from ${body.applicationName} to local DB`,
      details: body.conflictResolutionCount > 0
        ? `${body.conflictResolutionCount} conflict${body.conflictResolutionCount === 1 ? '' : 's'} resolved`
        : undefined,
      timestamp: new Date(),
      baseVersion,
      resultVersion: body.proposedVersion,
      localVersion: body.proposedVersion,
    };

    localAuditLog.unshift(auditEntry);

    return HttpResponse.json({ data: { snapshot, auditEntry } });
  }),

  http.get('/local/history', ({ request }) => {
    const url = new URL(request.url);
    const integrationId = url.searchParams.get('integrationId');

    const entries = integrationId
      ? localAuditLog.filter((e) => e.integrationId === integrationId)
      : localAuditLog;

    return HttpResponse.json({ data: entries });
  }),
];