import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/integration/$integrationId")({
  component: IntegrationLayoutRoute,
});

function IntegrationLayoutRoute() {
  return <Outlet />;
}
