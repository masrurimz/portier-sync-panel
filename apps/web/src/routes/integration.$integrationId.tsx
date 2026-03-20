import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@portier-sync/ui/components/breadcrumb";
import { buttonVariants } from "@portier-sync/ui/components/button";
import { Link, Outlet, createFileRoute, notFound } from "@tanstack/react-router";

import { StatusBadge } from "../components/sync-console/shared";
import type { ApplicationId } from "../lib/api-types";
import { getIntegrationById } from "../lib/api-types";

export const Route = createFileRoute("/integration/$integrationId")({
  beforeLoad: ({ params }) => {
    const integration = getIntegrationById(params.integrationId as ApplicationId);
    if (!integration) {
      throw notFound();
    }
  },
  component: IntegrationLayoutRoute,
});

function IntegrationLayoutRoute() {
  const { integrationId } = Route.useParams();
  const integration = getIntegrationById(integrationId as ApplicationId)!;

  return (
    <>
      <div className="border-b border-border/80 px-5 py-4 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to="/" />}>Integrations</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{integration.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold">{integration.name}</h1>
              <StatusBadge status={integration.status} />
            </div>
            <div className="flex gap-2">
              <Link
                to="/integration/$integrationId"
                params={{ integrationId }}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
                activeProps={{ className: "bg-secondary text-foreground" }}
                activeOptions={{ exact: true }}
              >
                Overview
              </Link>
              <Link
                to="/integration/$integrationId/review"
                params={{ integrationId }}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
                activeProps={{ className: "bg-secondary text-foreground" }}
                activeOptions={{ exact: false }}
              >
                Review queue
              </Link>
              <Link
                to="/integration/$integrationId/history"
                params={{ integrationId }}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
                activeProps={{ className: "bg-secondary text-foreground" }}
                activeOptions={{ exact: false }}
              >
                History
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Outlet />
    </>
  );
}