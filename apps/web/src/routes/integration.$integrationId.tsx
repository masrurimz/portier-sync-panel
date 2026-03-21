import { integrationDetailQueryOptions } from "@portier-sync/api";
import { buttonVariants } from "@portier-sync/ui/components/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@portier-sync/ui/components/breadcrumb";
import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";

import { StatusBadge, useSyncSession } from "../features/sync-console";

export const Route = createFileRoute("/integration/$integrationId")({
  ssr: false,
  component: IntegrationLayoutRoute,
});

function IntegrationLayoutRoute() {
  const { integrationId } = Route.useParams();
  const { integrations } = useSyncSession();
  const { data: detailData, isLoading } = useQuery(integrationDetailQueryOptions({ input: { id: integrationId } }));
  const integration = integrations.find((item) => item.id === integrationId) ?? detailData;

  if (!integration) {
    return (
      <div className="border-b border-border/80 px-5 py-4 text-sm text-muted-foreground sm:px-8 lg:px-10">
        {isLoading ? "Loading integration…" : "Integration not found."}
      </div>
    );
  }

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