import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@portier-sync/ui/components/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@portier-sync/ui/components/alert";
import { Badge } from "@portier-sync/ui/components/badge";
import { Button } from "@portier-sync/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@portier-sync/ui/components/card";
import { Checkbox } from "@portier-sync/ui/components/checkbox";
import { Separator } from "@portier-sync/ui/components/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@portier-sync/ui/components/tooltip";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Layers2Icon, ShieldAlertIcon, ShieldCheckIcon } from "lucide-react";

import { integrationsListQueryOptions, type IntegrationId } from "@portier-sync/api";
import { useReviewActions, useReviewBatch } from "../-state/review-store";
import { ReviewResolutionForm } from "./review-resolution-form";
import { getItemIndicator } from "./-ui/get-item-indicator";
import { ReviewStat, ValuePanel } from "./-ui";
import { DataPoint, LinkButton, PageShell, SurfaceSection } from "../-ui/ui";

export function ReviewPage({ integrationId }: { integrationId: IntegrationId }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: integrations = [] } = useQuery(integrationsListQueryOptions());
  const integration = integrations.find((item) => item.id === integrationId);
  const draft = useReviewBatch(integrationId);
  const {
    updateReviewDecision,
    toggleReviewSelection,
    stageReadyChanges,
    applyReview,
  } = useReviewActions();

  const [focusedId, setFocusedId] = React.useState(draft?.items[0]?.id ?? "");
  const [showConfirm, setShowConfirm] = React.useState(false);

  // Reset focus to first item when the draft changes (e.g. after a fresh sync).
  React.useEffect(() => {
    setFocusedId(draft?.items[0]?.id ?? "");
  }, [draft?.items]);

  // Guard: integration not yet hydrated in session state
  if (!integration) {
    return (
      <PageShell
        eyebrow="Review queue"
        title="Loading…"
        description="Fetching integration details."
      >
        <div className="rounded-2xl border border-dashed border-border/80 bg-background/30 p-6 text-sm text-muted-foreground">
          Integration is loading or unavailable. If this persists, check your connection and refresh.
        </div>
      </PageShell>
    );
  }

  // Guard: no preview draft available
  if (!draft) {
    return (
      <PageShell
        eyebrow="Review queue"
        title={`${integration.name} review`}
        description="No changes are queued for review."
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-dashed border-border/80 bg-background/30 p-6 text-sm text-muted-foreground">
            No preview has been fetched for this integration yet. Run "Fetch latest" from the detail page to populate the review queue.
          </div>
          <LinkButton to="/integration/$integrationId" params={{ integrationId }} variant="secondary">
            Go to detail page
          </LinkButton>
        </div>
      </PageShell>
    );
  }

  const grouped = {
    pending: draft.items.filter((item) => item.requiresDecision && !item.resolution.kind),
    resolved: draft.items.filter((item) => item.requiresDecision && Boolean(item.resolution.kind)),
    ready: draft.items.filter((item) => !item.requiresDecision),
  };

  const focusItem = draft.items.find((item) => item.id === focusedId) ?? draft.items[0];

  // Counts driving canApply and the apply button.
  // Decided items + directly staged items are included in totalStaged.
  const undecidedItems = grouped.pending.length;
  const decidedItems = grouped.resolved.length;
  const directlyStaged = grouped.ready.filter((i) => i.staged).length;
  const totalStaged = decidedItems + directlyStaged;
  const canApply = draft.status !== 'stale' && totalStaged > 0 && undecidedItems === 0;

  // Auto-stage a decision and advance focus to the next undecided item.
  const handleAutoSave = React.useCallback(
    (resolution: import("../-domain/review").ReviewResolution) => {
      updateReviewDecision(integrationId, focusedId, resolution);
      // Advance to next undecided item (skip the item just decided).
      const next = draft.items.find((item) => item.id !== focusedId && item.requiresDecision && !item.resolution.kind);
      if (next) setFocusedId(next.id);
    },
    [integrationId, focusedId, draft.items, updateReviewDecision],
  );

  const handleConfirmApply = async () => {
    setShowConfirm(false);
    const applied = await applyReview(integrationId, queryClient);
    if (applied) {
      void navigate({ to: "/integration/$integrationId/history", params: { integrationId } });
    }
  };

  return (
    <>
      <PageShell
        eyebrow="Review queue"
        title={`${integration.name} change review`}
        description="Inspect changes, make decisions on flagged items, stage what to apply."
        actions={
          <>
            <Badge variant="outline">{draft.items.length} changes</Badge>
            <Badge variant={grouped.pending.length > 0 ? "destructive" : "secondary"}>
              {grouped.pending.length} need decision
            </Badge>
          </>
        }
      >
        {/* Context banner */}
        {draft && (
          <div className="rounded-2xl border border-border/70 bg-muted/20 px-5 py-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
              <span><span className="font-medium text-foreground">{draft.applicationName}</span> — remote preview</span>
              <span>Base version: <span className="font-mono">{draft.baseVersion}</span></span>
              <span>Proposed: <span className="font-mono">{draft.proposedVersion}</span></span>
              <span>Fetched {new Date(draft.fetchedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        )}

        {/* Stale draft guard */}
        {draft.status === 'stale' && (
          <Alert variant="destructive">
            <ShieldAlertIcon />
            <AlertTitle>Draft is out of date</AlertTitle>
            <AlertDescription>
              Another change updated the local database after this preview was fetched.
              Return to detail and run Fetch latest to create a fresh comparison.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary stats */}
        <div className="grid gap-3 md:grid-cols-3">
          <ReviewStat icon={Layers2Icon} label="Total changes" value={String(draft.items.length)} />
          <ReviewStat icon={ShieldAlertIcon} label="Pending decisions" value={String(grouped.pending.length)} />
          <ReviewStat icon={ShieldCheckIcon} label="Staged" value={String(grouped.resolved.length + grouped.ready.filter(i => i.staged).length)} />
        </div>
        <div className="grid gap-6 xl:grid-cols-[0.76fr_1.24fr]">
          {/* ── Left: change list ── */}
          <SurfaceSection
            title="Changes"
            description="Items needing a decision must be resolved before they can be staged and applied."
            action={
              <Badge variant={undecidedItems > 0 ? "destructive" : "secondary"}>
                {undecidedItems > 0 ? `${undecidedItems} undecided` : `${totalStaged} staged`}
              </Badge>
            }
          >
            <div className="grid gap-3">
              {/* Conflicts needing decision group */}
              {grouped.pending.length > 0 && (
                <Card size="sm" className="border border-border/70 bg-background/40">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-sm">Needs decision</CardTitle>
                      <Badge variant="destructive">{grouped.pending.length}</Badge>
                    </div>
                    <CardDescription>These items are flagged as requiring your choice before they can be staged.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {grouped.pending.map((item) => {
                      const { Icon, color, label } = getItemIndicator(item);
                      return (
                        <button
                          key={item.id}
                          className={`flex flex-col gap-2 rounded-2xl border p-3 text-left transition-colors ${
                            focusItem?.id === item.id
                              ? "border-primary/45 bg-primary/8"
                              : "border-border/70 bg-background/30 hover:bg-accent/30"
                          }`}
                          onClick={() => setFocusedId(item.id)}
                          type="button"
                          aria-label={`${item.fieldLabel} — ${label}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <Icon className={`size-4 shrink-0 ${color}`} aria-label={label} />
                              <span className="font-medium">{item.recordLabel}</span>
                            </div>
                            <Badge variant="outline">{item.entityLabel}</Badge>
                          </div>
                          <span className="text-muted-foreground">{item.fieldLabel}</span>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Resolved conflicts group */}
              {grouped.resolved.length > 0 && (
                <Card size="sm" className="border border-border/70 bg-background/40">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-sm">Decided</CardTitle>
                      <Badge variant="secondary">{grouped.resolved.length}</Badge>
                    </div>
                    <CardDescription>You have made a decision on these items. They will be included when you apply.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {grouped.resolved.map((item) => {
                      const { Icon, color, label } = getItemIndicator(item);
                      return (
                        <button
                          key={item.id}
                          className={`flex flex-col gap-2 rounded-2xl border p-3 text-left transition-colors ${
                            focusItem?.id === item.id
                              ? "border-primary/45 bg-primary/8"
                              : "border-border/70 bg-background/30 hover:bg-accent/30"
                          }`}
                          onClick={() => setFocusedId(item.id)}
                          type="button"
                          aria-label={`${item.fieldLabel} — ${label}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <Icon className={`size-4 shrink-0 ${color}`} aria-label={label} />
                              <span className="font-medium">{item.recordLabel}</span>
                            </div>
                            <Badge variant="outline">{item.entityLabel}</Badge>
                          </div>
                          <span className="text-muted-foreground">{item.fieldLabel}</span>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Ready to apply group */}
              {grouped.ready.length > 0 && (
                <Card size="sm" className="border border-border/70 bg-background/40">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-sm">Staged</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{grouped.ready.length}</Badge>
                        {/* Bulk approval lives next to the group it controls */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            stageReadyChanges(integrationId);
                          }}
                        >
                          Stage all
                        </Button>
                      </div>
                    </div>
                    <CardDescription>These changes are staged and ready to apply. Inspect them in the detail panel.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {grouped.ready.map((item) => {
                      const { Icon, color, label } = getItemIndicator(item);
                      return (
                        <button
                          key={item.id}
                          className={`flex flex-col gap-2 rounded-2xl border p-3 text-left transition-colors ${
                            focusItem?.id === item.id
                              ? "border-primary/45 bg-primary/8"
                              : "border-border/70 bg-background/30 hover:bg-accent/30"
                          }`}
                          onClick={() => setFocusedId(item.id)}
                          type="button"
                          aria-label={`${item.fieldLabel} — ${label}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              {/* Checkbox for ready items — stop propagation so focus and select are independent */}
                              <Checkbox
                                checked={item.staged}
                                onCheckedChange={() => toggleReviewSelection(integrationId, item.id)}
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`${item.staged ? "Deselect" : "Select"} ${item.fieldLabel}`}
                              />
                              <Icon className={`size-4 shrink-0 ${color}`} aria-label={label} />
                              <span className="font-medium">{item.recordLabel}</span>
                            </div>
                            <Badge variant="outline">{item.entityLabel}</Badge>
                          </div>
                          <span className="text-muted-foreground">{item.fieldLabel}</span>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </div>
          </SurfaceSection>

          {/* ── Right: comparison + resolution ── */}
          {focusItem ? (
            <div className="flex flex-col gap-6">
              <SurfaceSection
                title="Field comparison"
                description="Inspect both values side by side before choosing a resolution."
                action={<Badge variant={focusItem.requiresDecision ? "destructive" : "secondary"}>{focusItem.changeType}</Badge>}
              >
                <div className="grid gap-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <DataPoint label="Field" value={focusItem.fieldName} />
                    <DataPoint label="Record" value={focusItem.recordLabel} />
                    <DataPoint label="Source" value={focusItem.sourceMeta} />
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <ValuePanel
                      title="Portier (current)"
                      description="The value currently stored in Portier."
                      value={focusItem.localValue ?? ""}
                      otherValue={focusItem.externalValue ?? ""}
                      highlightColor={focusItem.requiresDecision ? "red" : undefined}
                    />
                    <ValuePanel
                    
                      title={`${draft.applicationName} (incoming)`}
                      description="The value coming from the external provider."
                      value={focusItem.externalValue ?? ""}
                      otherValue={focusItem.localValue ?? ""}
                      highlightColor={focusItem.requiresDecision ? "green" : undefined}
                    />
                  </div>
                  <Card size="sm" className="border border-border/70 bg-muted/20">
                    <CardHeader>
                      <CardTitle className="text-sm">About this change</CardTitle>
                      <CardDescription>{focusItem.reason}</CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </SurfaceSection>

              <SurfaceSection
                title="Resolution"
                description="Choose which value to keep, then the item will be staged automatically."
                action={
                  <Badge variant={focusItem.requiresDecision && !focusItem.resolution.kind ? "destructive" : "outline"}>
                    {focusItem.requiresDecision && !focusItem.resolution.kind
                      ? "Needs decision"
                      : focusItem.resolution.kind === "local"
                        ? "Keep current"
                        : focusItem.resolution.kind === "external"
                          ? "Accept incoming"
                          : focusItem.resolution.kind === "merged"
                            ? "Custom value"
                            : "Staged"
                    }
                  </Badge>
                }
              >
                <ReviewResolutionForm
                  item={focusItem}
                  applicationName={draft.applicationName}
                  onAutoSave={handleAutoSave}
                  onSubmit={(resolution) => updateReviewDecision(integrationId, focusItem.id, resolution)}
                />

                <Separator />

                <div className="flex flex-wrap justify-end gap-2">
                  <Tooltip>
                    <TooltipTrigger>
                      {/* span needed so Tooltip can attach to a disabled button */}
                      <span tabIndex={canApply ? undefined : 0} className="inline-block">
                        <Button
                          onClick={() => setShowConfirm(true)}
                          disabled={!canApply}
                        >
                          Apply locally
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!canApply && (
                      <TooltipContent>
                        {undecidedItems > 0
                          ? `Decide ${undecidedItems} item${undecidedItems !== 1 ? "s" : ""} before applying`
                          : "Stage at least one change to apply"}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>
              </SurfaceSection>
            </div>
          ) : null}
        </div>
      </PageShell>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply locally</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to apply locally{" "}
              <span className="font-medium text-foreground">{totalStaged} change{totalStaged !== 1 ? "s" : ""}</span>
              {decidedItems > 0 && directlyStaged > 0 && (
                <> — {decidedItems} decided item{decidedItems !== 1 ? "s" : ""} and{" "}
                  {directlyStaged} directly staged{directlyStaged !== 1 ? "s" : ""}</>
              )}
              {decidedItems > 0 && directlyStaged === 0 && (
                <> — {decidedItems} decided item{decidedItems !== 1 ? "s" : ""}</>
              )}
              {decidedItems === 0 && directlyStaged > 0 && (
                <> — {directlyStaged} directly staged{directlyStaged !== 1 ? "s" : ""}</>
              )}
              {" "}<span className="font-medium text-foreground">This writes to your local database only</span> and does not affect the remote system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmApply}>Confirm—apply locally</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
