import { createFileRoute, notFound } from "@tanstack/react-router";

import { HistoryPage } from "../components/sync-console";
import type { ApplicationId } from "../lib/api-types";
import { getIntegrationById } from "../lib/api-types";
import { getIntegrationPageModel } from "../lib/mock-sync-console";

export const Route = createFileRoute("/integration/$integrationId/history")({
  component: IntegrationHistoryRoute,
});

function IntegrationHistoryRoute() {
  const { integrationId } = Route.useParams();
  const integration = getIntegrationById(integrationId as ApplicationId);

  if (!integration) {
    throw notFound();
  }

  const pageModel = getIntegrationPageModel(integration.id);

  return (
    <HistoryPage
      integration={pageModel.integration}
      history={pageModel.history}
      integrationId={pageModel.integration.id}
    />
  );
}
