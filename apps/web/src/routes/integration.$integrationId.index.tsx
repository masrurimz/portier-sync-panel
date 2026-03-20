import { createFileRoute } from "@tanstack/react-router";

import { IntegrationDetailScreen } from "../features/sync-console/detail/screens/integration-detail-screen";
import type { ApplicationId } from "../lib/api-types";

export const Route = createFileRoute("/integration/$integrationId/")({
  component: IntegrationDetailRoute,
});

function IntegrationDetailRoute() {
  const { integrationId } = Route.useParams();
  return <IntegrationDetailScreen integrationId={integrationId as ApplicationId} />;
}