import { createFileRoute } from "@tanstack/react-router";

import { OverviewPage } from "../components/sync-console";
import { INTEGRATIONS } from "../lib/api-types";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return <OverviewPage integrations={INTEGRATIONS} />;
}
