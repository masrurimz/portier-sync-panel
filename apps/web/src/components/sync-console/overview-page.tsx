import * as React from "react";
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
import { SearchIcon, SlidersHorizontalIcon } from "lucide-react";

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
      description="Track connector health, spot risky batches, and jump into the right workflow fast."
      actions={undefined}
    >

      <MetricGrid metrics={getOverviewMetrics()} />

      {priorityItems.length > 0 && (
        <SurfaceSection
          title="Priority review queue"
          description="Connectors with conflicts or degraded health are shown first."
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
                          ? "Pending field decisions must be resolved before apply."
                          : "Provider health is degraded. Local data is unchanged."}
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
                    <LinkButton to="/integration/$integrationId" params={{ integrationId: integration.id }} variant="outline">
                      Manage
                    </LinkButton>
                    {integration.status === "conflict" ? (
                      <LinkButton to="/integration/$integrationId/review" params={{ integrationId: integration.id }}>
                        Review updates
                      </LinkButton>
                    ) : (
                      <LinkButton to="/integration/$integrationId/history" params={{ integrationId: integration.id }} variant="ghost">
                        View history
                      </LinkButton>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SurfaceSection>
      )}

      <SurfaceSection
        title="Integration inventory"
        description="Search and filter connectors before opening detailed workflows."
        action={
          <div className="flex items-center gap-2 text-muted-foreground">
            <SlidersHorizontalIcon className="size-4" />
            <span className="text-xs">Search and status filters update immediately.</span>
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
                  {integration.status === "conflict" ? (
                    <LinkButton to="/integration/$integrationId/review" params={{ integrationId: integration.id }} variant="default">
                      Review updates
                    </LinkButton>
                  ) : integration.status === "error" ? (
                    <LinkButton to="/integration/$integrationId" params={{ integrationId: integration.id }} variant="secondary">
                      View logs
                    </LinkButton>
                  ) : integration.status === "syncing" ? (
                    <LinkButton to="/integration/$integrationId" params={{ integrationId: integration.id }} variant="ghost" className="pointer-events-none opacity-50">
                      Syncing…
                    </LinkButton>
                  ) : (
                    <LinkButton to="/integration/$integrationId" params={{ integrationId: integration.id }} variant="ghost">
                      Manage
                    </LinkButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SurfaceSection>
    </PageShell>
  );
}
