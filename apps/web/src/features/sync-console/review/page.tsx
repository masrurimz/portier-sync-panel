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

  // Guard: fetch failed - show error with retry option
  if (draft.status === "failed") {
    const error = draft.lastError;
    return (
      <PageShell
        eyebrow="Review queue"
        title={`${integration.name} review`}
        description="Unable to load preview for review."
      >
        <div className="flex flex-col gap-4">
          <Alert variant="destructive">
            <ShieldAlertIcon />
            <AlertTitle>{error?.title ?? "Failed to fetch preview"}</AlertTitle>
            <AlertDescription>
              {error?.message ?? "The sync preview could not be loaded. Your local data has not changed."}
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <LinkButton to="/integration/$integrationId" params={{ integrationId }} variant="secondary">
              Go to detail page
            </LinkButton>
          </div>
        </div>
      </PageShell>
    );
  }

  const grouped = {
    pending: draft.items.filter((item) => !item.resolution.kind),
    resolved: draft.items.filter((item) => Boolean(item.resolution.kind)),
  };

  const focusItem = draft.items.find((item) => item.id === focusedId) ?? draft.items[0];

  // Counts driving canApply and the apply button.
  const undecidedItems = grouped.pending.length;
  const decidedItems = grouped.resolved.length;
  const canApply = draft.status !== 'stale' && draft.pendingCount === 0 && draft.reviewedCount > 0;

  // Auto-stage a decision and advance focus to the next undecided item.
  const handleAutoSave = React.useCallback(
    (resolution: import("../-domain/review").ReviewResolution) => {
      updateReviewDecision(integrationId, focusedId, resolution);
      // Advance to next undecided item (skip the item just decided).
      const next = draft.items.find((item) => item.id !== focusedId && !item.resolution.kind);
      if (next) setFocusedId(next.id);
    },
    [integrationId, focusedId, draft.items, updateReviewDecision],
  );

  const handleConfirmApply = async () => {
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
        description="Review each difference and choose Keep Current or Accept Incoming. Apply unlocks when all are decided."
        actions={
          <>
<Badge variant="outline">{draft.items.length} differences</Badge>
            <Badge variant={grouped.pending.length > 0 ? "destructive" : "secondary"}>
{grouped.pending.length} pending
            </Badge>
          </>
        }
      >
        {/* Context banner */}
        {draft && (
          <div className="rounded-2xl border border-border/70 bg-muted/20 px-5 py-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
              <span><span className="font-medium text-foreground">{draft.applicationName}</span> — remote preview</span>
              <span>Local revision: <span className="font-mono">r{draft.baseRevision}</span></span>
              <span>Fetched {draft.fetchedAt ? new Date(draft.fetchedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'pending'}</span>
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
          <ReviewStat icon={ShieldCheckIcon} label="Reviewed" value={String(draft.reviewedCount)} />
        </div>
        <div className="grid gap-6 xl:grid-cols-[0.76fr_1.24fr]">
          {/* ── Left: change list ── */}
          <SurfaceSection
            title="Changes"
            description="Make a decision on every difference. Apply is enabled only when all are decided."
            action={
              <Badge variant={undecidedItems > 0 ? "destructive" : "secondary"}>
                {undecidedItems > 0 ? `${undecidedItems} pending` : `${decidedItems} reviewed`}
              </Badge>
            }
          >
            <div className="grid gap-3">
              {/* Conflicts needing decision group */}
              {grouped.pending.length > 0 && (
                <Card size="sm" className="border border-border/70 bg-background/40">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
<CardTitle className="text-sm">Pending Review</CardTitle>
                      <Badge variant="destructive">{grouped.pending.length}</Badge>
                    </div>
<CardDescription>Each of these differences requires an explicit Keep Current or Accept Incoming choice.</CardDescription>
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
                              <Icon className={`size-4 shrink-0 ${color}`} aria-hidden />
                              <span className="font-medium">{item.recordLabel}</span>
                            </div>
                            <Badge variant="outline">{item.entityLabel}</Badge>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-muted-foreground">{item.fieldLabel}</span>
                            <span className={`text-xs font-medium ${color}`}>{label}</span>
                          </div>
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
<CardTitle className="text-sm">Reviewed</CardTitle>
                      <Badge variant="secondary">{grouped.resolved.length}</Badge>
                    </div>
<CardDescription>You have made a decision on these differences. They will be applied using your choices.</CardDescription>
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
                              <Icon className={`size-4 shrink-0 ${color}`} aria-hidden />
                              <span className="font-medium">{item.recordLabel}</span>
                            </div>
                            <Badge variant="outline">{item.entityLabel}</Badge>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-muted-foreground">{item.fieldLabel}</span>
                            <span className={`text-xs font-medium ${color}`}>{label}</span>
                          </div>
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
                action={<Badge variant={!focusItem.resolution.kind ? "destructive" : "secondary"}>{focusItem.changeType}</Badge>}
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
                      highlightColor={!focusItem.resolution.kind ? "red" : undefined}
                    />
                    <ValuePanel
                      title={`${draft.applicationName} (incoming)`}
                      description="The value coming from the external provider."
                      value={focusItem.externalValue ?? ""}
                      otherValue={focusItem.localValue ?? ""}
                      highlightColor={!focusItem.resolution.kind ? "green" : undefined}
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
                description="Choose which value to keep. All reviewed differences will be applied."
                action={
                  <Badge variant={!focusItem.resolution.kind ? "destructive" : "outline"}>
                    {!focusItem.resolution.kind
                      ? "Pending"
                      : focusItem.resolution.kind === "local"
                        ? "Keep current"
                        : focusItem.resolution.kind === "external"
                          ? "Accept incoming"
                          : focusItem.resolution.kind === "merged"
                            ? "Custom value"
                            : "Reviewed"
                    }
                  </Badge>
                }
              >
                <ReviewResolutionForm
                  key={focusItem.id}
                  item={focusItem}
                  applicationName={draft.applicationName}
                  onAutoSave={handleAutoSave}
                  onSubmit={(resolution) => updateReviewDecision(integrationId, focusItem.id, resolution)}
                />

                <Separator />

                <div className="flex flex-wrap justify-end gap-2">
                  <Tooltip>
                    <TooltipTrigger
                      render={<span className="inline-block" />}
                      tabIndex={canApply ? undefined : 0}
                    >
                      <Button
                        onClick={() => setShowConfirm(true)}
                        disabled={!canApply}
                      >
                        Apply decisions
                      </Button>
                    </TooltipTrigger>
                    {!canApply && (
                      <TooltipContent>
                        {undecidedItems > 0
                          ? `Decide ${undecidedItems} item${undecidedItems !== 1 ? "s" : ""} before applying`
                          : "Make at least one decision to apply"}
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
<AlertDialogTitle>Confirm decisions</AlertDialogTitle>
            <AlertDialogDescription>
You are about to apply{" "}
              <span className="font-medium text-foreground">{draft.reviewedCount} decision{draft.reviewedCount !== 1 ? "s" : ""}</span>
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
