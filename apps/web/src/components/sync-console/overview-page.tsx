import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@portier-sync/ui/components/alert";
import { Badge } from "@portier-sync/ui/components/badge";
import { Input } from "@portier-sync/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@portier-sync/ui/components/table";
import { SearchIcon, SirenIcon, SlidersHorizontalIcon } from "lucide-react";

import { formatRelativeTime } from "../../lib/api-types";
import { useSyncConsole } from "../../lib/sync-console-store";
import { LinkButton, MetricGrid, PageShell, StatusBadge, SurfaceSection, DataPoint } from "./shared";

export function OverviewPage() {
  const { integrations, getOverviewMetrics, getPriorityIntegrations, getPendingReviewCount } = useSyncConsole();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "synced" | "syncing" | "conflict" | "error">("all");

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch = integration.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" ? true : integration.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const priorityItems = getPriorityIntegrations();

  return (
    <PageShell
      eyebrow="Portier / Sync Console"
      title="Integration operations overview"
      description="Monitor connector health, spot risky batches quickly, and route directly into the review surfaces that need operator attention."
      actions={
        <>
          <LinkButton to="/integration/$integrationId" params={{ integrationId: "salesforce" }} variant="secondary">
            Salesforce detail
          </LinkButton>
          <LinkButton to="/integration/$integrationId/review" params={{ integrationId: "hubspot" }}>
            Review conflicts
          </LinkButton>
        </>
      }
    >
      <Alert>
        <SirenIcon />
        <AlertTitle>High-trust operational posture</AlertTitle>
        <AlertDescription>
          Status alone is not enough. This overview keeps pending review counts and degraded providers visible so the operator can route attention correctly.
        </AlertDescription>
      </Alert>

      <MetricGrid metrics={getOverviewMetrics()} />

      <SurfaceSection
        title="Priority review queue"
        description="Integrations with conflicts or degraded providers are surfaced first so the operator can address risk before low-priority work."
        action={<Badge variant="outline">{priorityItems.length} items need attention</Badge>}
      >
        <div className="grid gap-3 xl:grid-cols-2">
          {priorityItems.map((integration) => (
            <div key={integration.id} className="rounded-2xl border border-border/70 bg-background/35 p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span aria-hidden="true" className="text-lg">{integration.icon}</span>
                      <h3 className="text-base font-semibold">{integration.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {integration.status === "conflict"
                        ? "Field-level decisions are waiting before this connector can be applied safely."
                        : "Provider health degraded during preview generation. Local data remains unchanged."}
                    </p>
                  </div>
                  <StatusBadge status={integration.status} />
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  <DataPoint label="Pending review" value={`${getPendingReviewCount(integration.id)} fields`} />
                  <DataPoint label="Last sync" value={formatRelativeTime(integration.lastSynced)} />
                  <DataPoint label="Version" value={integration.version} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <LinkButton to="/integration/$integrationId" params={{ integrationId: integration.id }} variant="default">
                    Open detail
                  </LinkButton>
                  {integration.status === "conflict" ? (
                    <LinkButton to="/integration/$integrationId/review" params={{ integrationId: integration.id }}>
                      Review queue
                    </LinkButton>
                  ) : (
                    <LinkButton to="/integration/$integrationId/history" params={{ integrationId: integration.id }}>
                      Inspect history
                    </LinkButton>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SurfaceSection>

      <SurfaceSection
        title="Integration inventory"
        description="Search and filter connectors by current posture before jumping into the detailed workflow for any one integration."
        action={
          <div className="flex items-center gap-2 text-muted-foreground">
            <SlidersHorizontalIcon className="size-4" />
            <span className="text-xs">Search and status filters are live.</span>
          </div>
        }
      >
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search integrations..." className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "synced", "syncing", "conflict", "error"] as const).map((value) => (
              <button
                key={value}
                className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                  statusFilter === value ? "border-primary/50 bg-primary/12 text-foreground" : "border-border/70 bg-background/45 text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                }`}
                onClick={() => setStatusFilter(value)}
                type="button"
              >
                {value === "all" ? "All status" : value.charAt(0).toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Integration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pending review</TableHead>
              <TableHead>Last sync</TableHead>
              <TableHead>Version</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIntegrations.map((integration) => (
              <TableRow key={integration.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="text-lg">{integration.icon}</span>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{integration.name}</span>
                      <span className="text-muted-foreground">{integration.totalRecords?.toLocaleString("en-US")} modeled records</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={integration.status} />
                </TableCell>
                <TableCell>{getPendingReviewCount(integration.id)}</TableCell>
                <TableCell>{formatRelativeTime(integration.lastSynced)}</TableCell>
                <TableCell>{integration.version}</TableCell>
                <TableCell className="text-right">
                  <LinkButton to="/integration/$integrationId" params={{ integrationId: integration.id }}>
                    Open
                  </LinkButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SurfaceSection>
    </PageShell>
  );
}
