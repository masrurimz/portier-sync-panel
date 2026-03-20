import { createFileRoute, notFound } from "@tanstack/react-router";

import { DetailPage } from "../components/sync-console";
import type { ApplicationId } from "../lib/api-types";
import { getIntegrationById } from "../lib/api-types";
import { getIntegrationPageModel } from "../lib/mock-sync-console";

export const Route = createFileRoute("/integration/$integrationId/")({
  component: IntegrationDetailRoute,
});

function IntegrationDetailRoute() {
  const { integrationId } = Route.useParams();
  const integration = getIntegrationById(integrationId as ApplicationId);

  if (!integration) {
    throw notFound();
  }

  const pageModel = getIntegrationPageModel(integration.id);

  return (
    <DetailPage
      integration={pageModel.integration}
      healthSummary={pageModel.healthSummary}
      metrics={pageModel.metrics}
      previewLines={pageModel.previewLines}
      integrationId={pageModel.integration.id}
    />
  );
}
