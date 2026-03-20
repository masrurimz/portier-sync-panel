import { createFileRoute, notFound } from "@tanstack/react-router";

import { IntegrationDetailScreen } from "../features/sync-console/detail/screens/integration-detail-screen";
import type { ApplicationId } from "../lib/api-types";
import { getIntegrationById } from "../lib/api-types";

export const Route = createFileRoute("/integration/$integrationId/")({
  component: IntegrationDetailRoute,
});

function IntegrationDetailRoute() {
  const { integrationId } = Route.useParams();

  if (!getIntegrationById(integrationId as ApplicationId)) {
    throw notFound();
  }

  return <IntegrationDetailScreen integrationId={integrationId as ApplicationId} />;
}
