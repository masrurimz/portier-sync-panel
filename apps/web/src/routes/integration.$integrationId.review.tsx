import { createFileRoute } from "@tanstack/react-router";

import { ReviewPage } from "../features/sync-console";
import type { ApplicationId } from "../lib/api-types";

export const Route = createFileRoute("/integration/$integrationId/review")({
  component: IntegrationReviewRoute,
});

function IntegrationReviewRoute() {
  const { integrationId } = Route.useParams();
  return <ReviewPage integrationId={integrationId as ApplicationId} />;
}
