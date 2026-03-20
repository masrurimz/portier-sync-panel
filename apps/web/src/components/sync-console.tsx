import { Badge } from "@portier-sync/ui/components/badge";
import { Button, buttonVariants } from "@portier-sync/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@portier-sync/ui/components/card";
import { Alert, AlertDescription, AlertTitle } from "@portier-sync/ui/components/alert";
import { Separator } from "@portier-sync/ui/components/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@portier-sync/ui/components/table";
import { cn } from "@portier-sync/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  Clock3Icon,
  DatabaseZapIcon,
  ExternalLinkIcon,
  GitCompareArrowsIcon,
  HistoryIcon,
  Layers2Icon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  SirenIcon,
  WorkflowIcon,
} from "lucide-react";

import type { ApplicationId, Integration, SyncHistoryEntry } from "../lib/api-types";
import type { ConsoleMetric, ReviewGroup } from "../lib/mock-sync-console";
import { formatRelativeTime } from "../lib/api-types";
import {
  getOverviewMetrics,
  getPriorityIntegrations,
  getReviewEntitySummary,
  getStatusSummary,
  getStatusTone,
} from "../lib/mock-sync-console";

function PageShell({ eyebrow, title, description, actions, children }: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 border border-border/80 bg-card/70 p-5 backdrop-blur-sm sm:flex-row sm:items-end sm:justify-between">
          <div className="flex max-w-3xl flex-col gap-2">
            <div className="text-[10px] font-medium tracking-[0.35em] text-muted-foreground uppercase">{eyebrow}</div>
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
        <div className="flex flex-col gap-8">{children}</div>
      </div>
    </div>
  );
}

function SurfaceSection({ title, description, action, children }: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="border border-border/80 bg-card/80 shadow-2xl shadow-black/10">
      <CardHeader className="border-b border-border/80">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {action ? <CardAction>{action}</CardAction> : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-4">{children}</CardContent>
    </Card>
  );
}

function MetricGrid({ metrics }: { metrics: ConsoleMetric[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label} size="sm" className="border border-border/70 bg-card/60">
          <CardHeader>
            <CardDescription className="text-[11px] uppercase tracking-[0.2em]">{metric.label}</CardDescription>
            <CardTitle className="text-2xl">{metric.value}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{metric.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: Integration["status"] }) {
  const Icon =
    status === "synced"
      ? CheckCircle2Icon
      : status === "syncing"
        ? CircleDashedIcon
        : status === "conflict"
          ? ShieldAlertIcon
          : AlertTriangleIcon;

  return (
    <Badge variant={getStatusTone(status)}>
      <Icon data-icon="inline-start" />
      {getStatusSummary(status)}
    </Badge>
  );
}

function LinkButton({ to, params, children, variant = "outline" }: {
  to: string;
  params?: Record<string, string>;
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
}) {
  return (
    <Link className={buttonVariants({ variant })} to={to} params={params as never}>
      {children}
    </Link>
  );
}

function IntegrationLinkSet({ integrationId, current }: { integrationId: ApplicationId; current: "overview" | "review" | "history"; }) {
  const links = [
    { key: "overview", label: "Overview", to: "/integration/$integrationId" },
    { key: "review", label: "Review queue", to: "/integration/$integrationId/review" },
    { key: "history", label: "History", to: "/integration/$integrationId/history" },
  ] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.key}
          to={link.to}
          params={{ integrationId }}
          className={buttonVariants({ variant: current === link.key ? "secondary" : "outline" })}
        >
          {link.label}
        </Link>
      ))}
      <Button variant="ghost" disabled>
        Settings
      </Button>
    </div>
  );
}

function PriorityQueue() {
  const priorityItems = getPriorityIntegrations();

  return (
    <SurfaceSection
      title="Priority review queue"
      description="Start with integrations that either require operator review or failed to fetch a fresh preview."
      action={<Badge variant="outline">{priorityItems.length} items</Badge>}
    >
      <div className="grid gap-3 xl:grid-cols-2">
        {priorityItems.map((integration) => (
          <Card key={integration.id} className="border border-border/70 bg-background/40">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span aria-hidden="true" className="text-lg">{integration.icon}</span>
                    {integration.name}
                  </CardTitle>
                  <CardDescription>
                    {integration.status === "conflict"
                      ? "Field-level decisions are waiting before apply."
                      : "The latest provider refresh did not complete successfully."}
                  </CardDescription>
                </div>
                <StatusBadge status={integration.status} />
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <DataPoint label="Pending review" value={integration.status === "conflict" ? "7 fields" : "Unavailable"} />
                <DataPoint label="Last sync" value={formatRelativeTime(integration.lastSynced)} />
                <DataPoint label="Version" value={integration.version} />
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <LinkButton to="/integration/$integrationId" params={{ integrationId: integration.id }} variant="default">
                Open surface
              </LinkButton>
              {integration.status === "conflict" ? (
                <LinkButton to="/integration/$integrationId/review" params={{ integrationId: integration.id }}>
                  Review queue
                </LinkButton>
              ) : (
                <Button variant="outline" disabled>
                  Retry preview
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </SurfaceSection>
  );
}

function DataPoint({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border border-border/70 bg-muted/20 p-3">
      <span className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export function OverviewPage({ integrations }: { integrations: Integration[] }) {
  return (
    <PageShell
      eyebrow="Portier / Sync Console"
      title="Operational sync review surfaces"
      description="Static design-first pages for the take-home app. This pass focuses on layout, hierarchy, and trust signals rather than live behavior."
      actions={
        <>
          <LinkButton to="/integration/$integrationId" params={{ integrationId: "salesforce" }} variant="secondary">
            Sample detail
          </LinkButton>
          <LinkButton to="/integration/$integrationId/review" params={{ integrationId: "hubspot" }}>
            Sample review
          </LinkButton>
        </>
      }
    >
      <Alert>
        <WorkflowIcon />
        <AlertTitle>Design-first pass</AlertTitle>
        <AlertDescription>
          These pages are intentionally non-interactive mockups. Navigation is enabled so you can inspect the UI, but sync actions and filters are presentation-only in this iteration.
        </AlertDescription>
      </Alert>

      <MetricGrid metrics={getOverviewMetrics()} />
      <PriorityQueue />

      <SurfaceSection
        title="Integration inventory"
        description="Every connector is visible with status, last sync, pending review, and the next operator action."
        action={<Badge variant="outline">Static table composition</Badge>}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Integration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pending review</TableHead>
              <TableHead>Last sync</TableHead>
              <TableHead>Version</TableHead>
              <TableHead className="text-right">Route</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {integrations.map((integration) => (
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
                <TableCell>
                  {integration.status === "conflict" ? "7 fields" : integration.status === "syncing" ? "2 fields" : "0"}
                </TableCell>
                <TableCell>{formatRelativeTime(integration.lastSynced)}</TableCell>
                <TableCell>{integration.version}</TableCell>
                <TableCell className="text-right">
                  <LinkButton to="/integration/$integrationId" params={{ integrationId: integration.id }}>
                    View
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

export function DetailPage({
  integration,
  healthSummary,
  metrics,
  previewLines,
  integrationId,
}: {
  integration: Integration;
  healthSummary: string;
  metrics: ConsoleMetric[];
  previewLines: string[];
  integrationId: ApplicationId;
}) {
  return (
    <PageShell
      eyebrow="Integration detail"
      title={`${integration.name} sync surface`}
      description="A static, high-context detail page that keeps health, pending work, and audit access close to the primary sync trigger."
      actions={
        <>
          <StatusBadge status={integration.status} />
          <Button variant="default" disabled>
            Sync now
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <LinkButton to="/">All integrations</LinkButton>
        <IntegrationLinkSet integrationId={integrationId} current="overview" />
      </div>

      <Alert>
        <ShieldCheckIcon />
        <AlertTitle>{healthSummary}</AlertTitle>
        <AlertDescription>
          This screen is intentionally static. The composition prioritizes truthful health messaging, dense metrics, and a clear route into review and history.
        </AlertDescription>
      </Alert>

      <MetricGrid metrics={metrics} />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <SurfaceSection
          title="Incoming changes preview"
          description="Preview copy is grouped and summarized so operators know what the next review screen will contain."
          action={
            <LinkButton to="/integration/$integrationId/review" params={{ integrationId }} variant="secondary">
              Review queue
            </LinkButton>
          }
        >
          <div className="flex flex-col gap-3">
            {previewLines.map((line) => (
              <div key={line} className="flex items-start gap-3 border border-border/70 bg-background/40 p-3">
                <GitCompareArrowsIcon className="mt-0.5 size-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{line}</p>
              </div>
            ))}
          </div>
        </SurfaceSection>

        <SurfaceSection
          title="Audit access"
          description="Operators should never lose the path to history while deciding what to do next."
          action={
            <LinkButton to="/integration/$integrationId/history" params={{ integrationId }}>
              Open history
            </LinkButton>
          }
        >
          <div className="flex flex-col gap-3">
            <Card size="sm" className="border border-border/70 bg-background/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <HistoryIcon className="size-4 text-muted-foreground" />
                  Recent versions
                </CardTitle>
                <CardDescription>Keep version lineage visible from the operational surface.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <DataPoint label="Current version" value={integration.version} />
                <DataPoint label="Last synced" value={formatRelativeTime(integration.lastSynced)} />
                <DataPoint label="Review posture" value={integration.status === "conflict" ? "Operator approval required" : "Clear for review"} />
              </CardContent>
            </Card>
            <Card size="sm" className="border border-border/70 bg-background/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <DatabaseZapIcon className="size-4 text-muted-foreground" />
                  Source notes
                </CardTitle>
                <CardDescription>Static placeholder copy for integration-specific operating notes.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Keep escalation notes, provider caveats, and known sync boundaries close to the page that operators visit most often.
                </p>
              </CardContent>
            </Card>
          </div>
        </SurfaceSection>
      </div>
    </PageShell>
  );
}

export function ReviewPage({
  integration,
  groups,
  integrationId,
  summary,
}: {
  integration: Integration;
  groups: ReviewGroup[];
  integrationId: ApplicationId;
  summary: { totalChanges: number; safeChanges: number; conflicts: number; estimatedDuration: string };
}) {
  const conflictGroup = groups.find((group) => group.label === "Conflicts") ?? groups[0];
  const focusItem = conflictGroup.items[0];
  const entitySummary = getReviewEntitySummary(groups);

  return (
    <PageShell
      eyebrow="Review queue"
      title={`${integration.name} change review`}
      description="The core design surface: operators inspect grouped changes, compare local and external values, and make explicit merge decisions."
      actions={
        <>
          <Badge variant="outline">{summary.totalChanges} changes</Badge>
          <Badge variant={summary.conflicts > 0 ? "destructive" : "secondary"}>{summary.conflicts} conflicts</Badge>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <LinkButton to="/integration/$integrationId" params={{ integrationId }}>Back to detail</LinkButton>
        <IntegrationLinkSet integrationId={integrationId} current="review" />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <ReviewStat icon={Layers2Icon} label="Total changes" value={String(summary.totalChanges)} />
        <ReviewStat icon={ShieldCheckIcon} label="Safe updates" value={String(summary.safeChanges)} />
        <ReviewStat icon={ShieldAlertIcon} label="Conflicts" value={String(summary.conflicts)} />
        <ReviewStat icon={Clock3Icon} label="Est. duration" value={summary.estimatedDuration} />
      </div>

      <Alert variant={summary.conflicts > 0 ? "destructive" : "default"}>
        <SirenIcon />
        <AlertTitle>
          {summary.conflicts > 0
            ? "Conflicts are presented before low-risk updates."
            : "This batch is clear for low-risk approval."}
        </AlertTitle>
        <AlertDescription>
          This is a static composition, but the page shows the intended hierarchy: grouped changes on the left, focused comparison on the right, and an always-visible completion state at the bottom.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <SurfaceSection
          title="Change groups"
          description="Group by review posture first, then let the operator scan by entity."
          action={<Badge variant="outline">Static left rail</Badge>}
        >
          <div className="grid gap-3">
            {groups.map((group) => (
              <Card key={group.label} size="sm" className="border border-border/70 bg-background/40">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-sm">{group.label}</CardTitle>
                    <Badge variant={group.label === "Conflicts" ? "destructive" : "secondary"}>{group.count}</Badge>
                  </div>
                  <CardDescription>
                    {group.label === "Conflicts"
                      ? "Ambiguous fields that require explicit operator choice."
                      : "Low-risk updates that can still be inspected before apply."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {group.items.map((item) => (
                    <div key={item.id} className={cn("flex flex-col gap-1 border p-3", item.id === focusItem.id ? "border-foreground/40 bg-muted/30" : "border-border/70 bg-background/30")}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">{item.recordLabel}</span>
                        <Badge variant="outline">{item.entityLabel}</Badge>
                      </div>
                      <span className="text-muted-foreground">{item.fieldName}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
            <Card size="sm" className="border border-border/70 bg-background/40">
              <CardHeader>
                <CardTitle className="text-sm">Entity distribution</CardTitle>
                <CardDescription>Helpful for skimming batch shape before deeper review.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {Object.entries(entitySummary).map(([entity, count]) => (
                  <DataPoint key={entity} label={entity} value={`${count} field${count > 1 ? "s" : ""}`} />
                ))}
              </CardContent>
            </Card>
          </div>
        </SurfaceSection>

        <div className="flex flex-col gap-6">
          <SurfaceSection
            title="Focused comparison"
            description="The active field gets the most space so the operator can decide with context instead of scanning noisy rows."
            action={<Badge variant="outline">{focusItem.changeType}</Badge>}
          >
            <div className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-3">
                <DataPoint label="Field" value={focusItem.fieldName} />
                <DataPoint label="Record" value={focusItem.recordLabel} />
                <DataPoint label="Source" value={focusItem.sourceMeta} />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <ValuePanel title="Local value" value={focusItem.localValue ?? "—"} description="Current Portier record shown as the operator-facing baseline." />
                <ValuePanel title="External value" value={focusItem.externalValue ?? "—"} description="Incoming provider value that cannot be trusted automatically." />
              </div>
              <Card size="sm" className="border border-border/70 bg-muted/20">
                <CardHeader>
                  <CardTitle className="text-sm">Why this is risky</CardTitle>
                  <CardDescription>{focusItem.reason}</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </SurfaceSection>

          <SurfaceSection
            title="Resolution controls"
            description="Explicit choices make the merge posture legible before the operator commits the batch."
            action={<Badge variant="outline">No mutation in this pass</Badge>}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              {focusItem.resolutionOptions.map((option) => (
                <Card key={option.label} size="sm" className={cn("border", option.active ? "border-foreground/40 bg-background" : "border-border/70 bg-background/40")}>
                  <CardHeader>
                    <CardTitle className="text-sm">{option.label}</CardTitle>
                    <CardDescription>
                      {option.active ? "Shown as the currently highlighted decision state." : "Available choice for the focused conflict."}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
            <Separator />
            <div className="flex flex-wrap gap-2">
              <Button variant="default" disabled>
                Apply {summary.totalChanges} decisions
              </Button>
              <Button variant="outline" disabled>
                Approve safe changes
              </Button>
              <Button variant="ghost" disabled>
                Export diff
              </Button>
            </div>
          </SurfaceSection>
        </div>
      </div>
    </PageShell>
  );
}

function ReviewStat({ icon: Icon, label, value }: { icon: typeof Layers2Icon; label: string; value: string }) {
  return (
    <Card size="sm" className="border border-border/70 bg-card/70">
      <CardHeader>
        <CardDescription className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
          <Icon className="size-3.5 text-muted-foreground" />
          {label}
        </CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function ValuePanel({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <Card className="border border-border/70 bg-background/40">
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="min-h-28 border border-border/70 bg-muted/20 p-4 text-sm leading-6">{value}</div>
      </CardContent>
    </Card>
  );
}

export function HistoryPage({
  integration,
  history,
  integrationId,
}: {
  integration: Integration;
  history: SyncHistoryEntry[];
  integrationId: ApplicationId;
}) {
  const [latest] = history;

  return (
    <PageShell
      eyebrow="History and audit"
      title={`${integration.name} version history`}
      description="A dense audit-oriented surface that exposes trigger source, result, version, and changed field counts without forcing operators to dig through a plain log table."
      actions={
        <>
          <Badge variant="outline">{history.length} events</Badge>
          <Button variant="outline" disabled>
            Export audit
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <LinkButton to="/integration/$integrationId" params={{ integrationId }}>Back to detail</LinkButton>
        <IntegrationLinkSet integrationId={integrationId} current="history" />
      </div>

      <Alert>
        <HistoryIcon />
        <AlertTitle>History should answer what changed, who approved it, and when.</AlertTitle>
        <AlertDescription>
          This static page replaces the thin reference log with an audit-friendly timeline that keeps event results, versions, and changed-field counts readable at a glance.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SurfaceSection
          title="Version timeline"
          description="Collapsed rows still surface enough information to scan results quickly."
          action={<Badge variant="outline">Audit-first layout</Badge>}
        >
          <div className="flex flex-col gap-3">
            {history.map((entry) => (
              <Card key={entry.id} className="border border-border/70 bg-background/40">
                <CardHeader>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex flex-col gap-1">
                      <CardTitle className="text-sm">{entry.summary}</CardTitle>
                      <CardDescription>
                        {entry.timestamp.toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" • "}
                        {entry.source === "user" ? "Triggered by operator" : "Triggered by system"}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{entry.version}</Badge>
                      <Badge variant={entry.summary.toLowerCase().includes("error") || entry.summary.toLowerCase().includes("paused") ? "destructive" : "outline"}>
                        {entry.summary.toLowerCase().includes("error") || entry.summary.toLowerCase().includes("paused") ? "Requires attention" : "Completed"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-4">
                  <DataPoint label="Changed fields" value={String(entry.changesCount ?? 0)} />
                  <DataPoint label="Added" value={String(entry.addedCount ?? 0)} />
                  <DataPoint label="Updated" value={String(entry.updatedCount ?? 0)} />
                  <DataPoint label="Deleted" value={String(entry.deletedCount ?? 0)} />
                </CardContent>
                <CardFooter>
                  <p className="text-muted-foreground">{entry.details}</p>
                </CardFooter>
              </Card>
            ))}
          </div>
        </SurfaceSection>

        <div className="flex flex-col gap-6">
          <SurfaceSection
            title="Expanded event view"
            description="Static snapshot of how an expanded audit item can reveal additional operator context."
            action={<Badge variant="outline">{latest.version}</Badge>}
          >
            <div className="grid gap-3">
              <DataPoint label="Trigger" value={latest.source === "user" ? "Manual review" : "Scheduled sync"} />
              <DataPoint label="Result" value={latest.summary} />
              <DataPoint label="Changed fields" value={String(latest.changesCount ?? 0)} />
            </div>
            <Separator />
            <Card size="sm" className="border border-border/70 bg-background/40">
              <CardHeader>
                <CardTitle className="text-sm">Before / after context</CardTitle>
                <CardDescription>Compact placeholder showing the level of audit detail the final product should expose.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex items-center justify-between border border-border/70 bg-muted/20 p-3">
                  <span className="font-medium">user.email</span>
                  <span className="text-muted-foreground">old@company.com → new@company.com</span>
                </div>
                <div className="flex items-center justify-between border border-border/70 bg-muted/20 p-3">
                  <span className="font-medium">key.status</span>
                  <span className="text-muted-foreground">active → revoked</span>
                </div>
              </CardContent>
            </Card>
          </SurfaceSection>

          <SurfaceSection
            title="Navigation posture"
            description="History should support movement back into the operational flow without losing orientation."
          >
            <div className="flex flex-col gap-2">
              <Link className={buttonVariants({ variant: "secondary" })} to="/integration/$integrationId/review" params={{ integrationId }}>
                Return to review queue
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
              <Link className={buttonVariants({ variant: "outline" })} to="/integration/$integrationId" params={{ integrationId }}>
                Back to detail
                <ExternalLinkIcon data-icon="inline-end" />
              </Link>
            </div>
          </SurfaceSection>
        </div>
      </div>
    </PageShell>
  );
}
