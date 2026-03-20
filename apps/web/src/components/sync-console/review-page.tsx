import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@portier-sync/ui/components/alert";
import { Badge } from "@portier-sync/ui/components/badge";
import { Button } from "@portier-sync/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@portier-sync/ui/components/card";
import { Checkbox } from "@portier-sync/ui/components/checkbox";
import { Separator } from "@portier-sync/ui/components/separator";
import { useNavigate } from "@tanstack/react-router";
import { Layers2Icon, ShieldAlertIcon, ShieldCheckIcon, SirenIcon, TimerResetIcon } from "lucide-react";

import type { ApplicationId } from "../../lib/api-types";
import { ReviewResolutionForm } from "../../features/sync-console/review/components/review-resolution-form";
import { useSyncConsole } from "../../lib/sync-console-store";
import { DataPoint, IntegrationLinkSet, LinkButton, PageShell, SurfaceSection } from "./shared";

function ReviewStat({ icon: Icon, label, value }: { icon: typeof Layers2Icon; label: string; value: string }) {
  return (
    <Card size="sm" className="border border-border/70 bg-card/70">
      <CardHeader>
        <CardDescription className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] uppercase">
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
        <div className="min-h-28 rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm leading-6">{value || "—"}</div>
      </CardContent>
    </Card>
  );
}

export function ReviewPage({ integrationId }: { integrationId: ApplicationId }) {
  const navigate = useNavigate();
  const {
    integrations,
    getReviewBatch,
    updateReviewDecision,
    toggleReviewSelection,
    approveSafeChanges,
    applyReview,
  } = useSyncConsole();

  const integration = integrations.find((item) => item.id === integrationId);
  const batch = getReviewBatch(integrationId);
  const [focusedId, setFocusedId] = React.useState(batch.items[0]?.id ?? "");

  React.useEffect(() => {
    setFocusedId(batch.items[0]?.id ?? "");
  }, [batch.items]);

  if (!integration) {
    return null;
  }

  const grouped = {
    safe: batch.items.filter((item) => !item.conflict),
    conflicts: batch.items.filter((item) => item.conflict),
  };

  const focusItem = batch.items.find((item) => item.id === focusedId) ?? batch.items[0];
  const selectedCount = batch.items.filter((item) => item.selected).length;
  const unresolved = batch.items.filter((item) => item.selected && item.conflict && !item.resolution.kind).length;
  const canApply = selectedCount > 0 && unresolved === 0;


  const handleApply = () => {
    const applied = applyReview(integrationId);
    if (applied) {
      void navigate({ to: "/integration/$integrationId/history", params: { integrationId } });
    }
  };

  return (
    <PageShell
      eyebrow="Review queue"
      title={`${integration.name} change review`}
      description="Inspect grouped changes, compare local and external values, and make explicit merge choices before applying a batch."
      actions={
        <>
          <Badge variant="outline">{batch.items.length} changes</Badge>
          <Badge variant={grouped.conflicts.length > 0 ? "destructive" : "secondary"}>{grouped.conflicts.length} conflicts</Badge>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <LinkButton to="/integration/$integrationId" params={{ integrationId }}>Back to detail</LinkButton>
        <IntegrationLinkSet integrationId={integrationId} current="review" />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <ReviewStat icon={Layers2Icon} label="Total changes" value={String(batch.items.length)} />
        <ReviewStat icon={ShieldCheckIcon} label="Safe updates" value={String(grouped.safe.length)} />
        <ReviewStat icon={ShieldAlertIcon} label="Conflicts" value={String(grouped.conflicts.length)} />
        <ReviewStat icon={TimerResetIcon} label="Est. duration" value={batch.estimatedDuration} />
      </div>

      <Alert variant={grouped.conflicts.length > 0 ? "destructive" : "default"}>
        <SirenIcon />
        <AlertTitle>
          {grouped.conflicts.length > 0
            ? "Conflicts are promoted above low-risk updates."
            : "This batch is clear for low-risk approval."}
        </AlertTitle>
        <AlertDescription>
          Operators should always be able to tell how many changes are selected, how many conflicts remain unresolved, and what the final apply action will do.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 xl:grid-cols-[0.76fr_1.24fr]">
        <SurfaceSection
          title="Change groups"
          description="Work from risk first, then scan by entity or record when the batch is larger."
          action={<Badge variant="outline">{selectedCount} selected</Badge>}
        >
          <div className="grid gap-3">
            {([
              { label: "Conflicts", items: grouped.conflicts },
              { label: "Safe updates", items: grouped.safe },
            ] as const).map((group) => (
              <Card key={group.label} size="sm" className="border border-border/70 bg-background/40">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-sm">{group.label}</CardTitle>
                    <Badge variant={group.label === "Conflicts" ? "destructive" : "secondary"}>{group.items.length}</Badge>
                  </div>
                  <CardDescription>
                    {group.label === "Conflicts"
                      ? "Fields where the system cannot safely choose a winner automatically."
                      : "Low-risk changes that can still be inspected before apply."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      className={`flex flex-col gap-2 rounded-2xl border p-3 text-left transition-colors ${
                        focusItem?.id === item.id ? "border-primary/45 bg-primary/8" : "border-border/70 bg-background/30 hover:bg-accent/30"
                      }`}
                      onClick={() => setFocusedId(item.id)}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Checkbox checked={item.selected} onCheckedChange={() => toggleReviewSelection(integrationId, item.id)} />
                          <span className="font-medium">{item.recordLabel}</span>
                        </div>
                        <Badge variant="outline">{item.entityLabel}</Badge>
                      </div>
                      <span className="text-muted-foreground">{item.fieldLabel}</span>
                    </button>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </SurfaceSection>

        {focusItem ? (
          <div className="flex flex-col gap-6">
            <SurfaceSection
              title="Focused comparison"
              description="The active field gets the most space so the operator can decide with context instead of scanning noisy rows."
              action={<Badge variant={focusItem.conflict ? "destructive" : "secondary"}>{focusItem.changeType}</Badge>}
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
                    <CardTitle className="text-sm">Why this needs attention</CardTitle>
                    <CardDescription>{focusItem.reason}</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </SurfaceSection>

            <SurfaceSection
              title="Resolution controls"
              description="Per-field resolution is explicit so the batch outcome is always explainable after the fact."
              action={<Badge variant="outline">{focusItem.selected ? "Selected" : "Ignored"}</Badge>}
            >
              <ReviewResolutionForm item={focusItem} onSubmit={(resolution) => updateReviewDecision(integrationId, focusItem.id, resolution)} />
              <Separator />

              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => approveSafeChanges(integrationId)}>
                  Approve safe changes
                </Button>
                <Button onClick={handleApply} disabled={!canApply}>
                  Apply {selectedCount} decision{selectedCount === 1 ? "" : "s"}
                </Button>
              </div>
            </SurfaceSection>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
