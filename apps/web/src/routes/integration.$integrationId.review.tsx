import { createFileRoute, notFound } from "@tanstack/react-router";

import { ReviewPage } from "../components/sync-console";
import type { ApplicationId } from "../lib/api-types";
import { getIntegrationById } from "../lib/api-types";
import { getIntegrationPageModel } from "../lib/mock-sync-console";

export const Route = createFileRoute("/integration/$integrationId/review")({
  component: IntegrationReviewRoute,
});

function IntegrationReviewRoute() {
  const { integrationId } = Route.useParams();
  const integration = getIntegrationById(integrationId as ApplicationId);

  if (!integration) {
    throw notFound();
  }

  const pageModel = getIntegrationPageModel(integration.id);

  return (
    <ReviewPage
      integration={pageModel.integration}
      groups={pageModel.reviewGroups}
      integrationId={pageModel.integration.id}
      summary={pageModel.reviewSummary}
    />
  );
}
