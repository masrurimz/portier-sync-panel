import { createFileRoute, notFound } from "@tanstack/react-router";

import { IntegrationReviewScreen } from "../features/sync-console/review/screens/integration-review-screen";
import type { ApplicationId } from "../lib/api-types";
import { getIntegrationById } from "../lib/api-types";

export const Route = createFileRoute("/integration/$integrationId/review")({
  component: IntegrationReviewRoute,
});

function IntegrationReviewRoute() {
  const { integrationId } = Route.useParams();

  if (!getIntegrationById(integrationId as ApplicationId)) {
    throw notFound();
  }

  return <IntegrationReviewScreen integrationId={integrationId as ApplicationId} />;
}
