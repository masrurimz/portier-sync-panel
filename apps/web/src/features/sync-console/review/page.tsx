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
import { Badge } from "@portier-sync/ui/components/badge";
import { Button } from "@portier-sync/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@portier-sync/ui/components/card";
import { Checkbox } from "@portier-sync/ui/components/checkbox";
import { Separator } from "@portier-sync/ui/components/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@portier-sync/ui/components/tooltip";
import { useNavigate } from "@tanstack/react-router";
import { Layers2Icon, ShieldAlertIcon, ShieldCheckIcon } from "lucide-react";

import type { IntegrationId } from "@portier-sync/api";
import { useSyncSession } from "../-state/sync-session-provider";
import { ReviewResolutionForm } from "./review-resolution-form";
import { getItemIndicator } from "./-ui/get-item-indicator";
import { ReviewStat, ValuePanel } from "./-ui";
import { DataPoint, LinkButton, PageShell, SurfaceSection } from "../-ui/ui";

export function ReviewPage({ integrationId }: { integrationId: IntegrationId }) {
  const navigate = useNavigate();
  const {
    integrations,
    reviewBatches,
    updateReviewDecision,
    toggleReviewSelection,
    approveSafeChanges,
    applyReview,
  } = useSyncSession();

  const integration = integrations.find((item) => item.id === integrationId);
  const batch = reviewBatches[integrationId];

  const [focusedId, setFocusedId] = React.useState(batch?.items[0]?.id ?? "");
  const [showConfirm, setShowConfirm] = React.useState(false);

  // Reset focus to first item when the batch changes (e.g. after a fresh sync).
  React.useEffect(() => {
    setFocusedId(batch?.items[0]?.id ?? "");
  }, [batch?.items]);

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

  // Guard: no preview batch available
  if (!batch) {
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
    safe: batch.items.filter((item) => !item.conflict),
    conflicts: batch.items.filter((item) => item.conflict),
  };

  const focusItem = batch.items.find((item) => item.id === focusedId) ?? batch.items[0];

  // Counts driving canApply and the commit button label.
  // Conflicts are included when resolved; safe items when selected.
  const resolvedConflicts = grouped.conflicts.filter((i) => i.resolution.kind).length;
  const selectedSafe = grouped.safe.filter((i) => i.selected).length;
  const unresolvedConflicts = grouped.conflicts.filter((i) => !i.resolution.kind).length;
  const totalToApply = resolvedConflicts + selectedSafe;
  const canApply = totalToApply > 0 && unresolvedConflicts === 0;

  // Auto-save a resolution and advance focus to the next unresolved conflict.
  const handleAutoSave = React.useCallback(
    (resolution: import("../-domain/review").ReviewResolution) => {
      updateReviewDecision(integrationId, focusedId, resolution);
      // Advance to next unresolved conflict (skip the item just resolved).
      const next = batch.items.find((item) => item.id !== focusedId && item.conflict && !item.resolution.kind);
      if (next) setFocusedId(next.id);
    },
    [integrationId, focusedId, batch.items, updateReviewDecision],
  );

  const handleConfirmApply = () => {
    setShowConfirm(false);
    const applied = applyReview(integrationId);
    if (applied) {
      void navigate({ to: "/integration/$integrationId/history", params: { integrationId } });
    }
  };

  return (
    <>
      <PageShell
        eyebrow="Review queue"
        title={`${integration.name} change review`}
        description="Resolve conflicts, approve safe updates, then commit."
        actions={
          <>
            <Badge variant="outline">{batch.items.length} changes</Badge>
            <Badge variant={grouped.conflicts.length > 0 ? "destructive" : "secondary"}>
              {grouped.conflicts.length} conflicts
            </Badge>
          </>
        }
      >
        {/* Summary stats */}
        <div className="grid gap-3 md:grid-cols-3">
          <ReviewStat icon={Layers2Icon} label="Total changes" value={String(batch.items.length)} />
          <ReviewStat icon={ShieldCheckIcon} label="Safe updates" value={String(grouped.safe.length)} />
          <ReviewStat icon={ShieldAlertIcon} label="Conflicts" value={String(grouped.conflicts.length)} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.76fr_1.24fr]">
          {/* ── Left: change list ── */}
          <SurfaceSection
            title="Change groups"
            description="Resolve conflicts first, then approve safe updates."
            action={
              <Badge variant={unresolvedConflicts > 0 ? "destructive" : "secondary"}>
                {unresolvedConflicts > 0 ? `${unresolvedConflicts} unresolved` : `${totalToApply} ready`}
              </Badge>
            }
          >
            <div className="grid gap-3">
              {/* Conflicts group */}
              {grouped.conflicts.length > 0 && (
                <Card size="sm" className="border border-border/70 bg-background/40">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-sm">Conflicts</CardTitle>
                      <Badge variant="destructive">{grouped.conflicts.length}</Badge>
                    </div>
                    <CardDescription>Fields where the system cannot safely choose a winner automatically.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {grouped.conflicts.map((item) => {
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

              {/* Safe updates group */}
              {grouped.safe.length > 0 && (
                <Card size="sm" className="border border-border/70 bg-background/40">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-sm">Safe updates</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{grouped.safe.length}</Badge>
                        {/* Bulk approval lives next to the group it controls */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            approveSafeChanges(integrationId);
                          }}
                        >
                          Approve all
                        </Button>
                      </div>
                    </div>
                    <CardDescription>Low-risk changes that can still be inspected before committing.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {grouped.safe.map((item) => {
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
                              {/* Checkbox for safe items — stop propagation so focus and select are independent */}
                              <Checkbox
                                checked={item.selected}
                                onCheckedChange={() => toggleReviewSelection(integrationId, item.id)}
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`${item.selected ? "Deselect" : "Select"} ${item.fieldLabel}`}
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
                action={<Badge variant={focusItem.conflict ? "destructive" : "secondary"}>{focusItem.changeType}</Badge>}
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
                      highlightColor={focusItem.conflict ? "red" : undefined}
                    />
                    <ValuePanel
                      title={`${batch.applicationName} (incoming)`}
                      description="The value coming from the external provider."
                      value={focusItem.externalValue ?? ""}
                      otherValue={focusItem.localValue ?? ""}
                      highlightColor={focusItem.conflict ? "green" : undefined}
                    />
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
                title="Resolution"
                description="Choose how this field should be resolved."
                action={
                  <Badge variant={focusItem.conflict && !focusItem.resolution.kind ? "destructive" : "outline"}>
                    {focusItem.conflict && !focusItem.resolution.kind
                      ? "Needs decision"
                      : focusItem.resolution.kind === "local"
                        ? "Keep Portier Value"
                        : focusItem.resolution.kind === "external"
                          ? `Use ${batch.applicationName} Value`
                          : focusItem.resolution.kind === "merged"
                            ? "Custom value"
                            : "Approved"}
                  </Badge>
                }
              >
                <ReviewResolutionForm
                  item={focusItem}
                  applicationName={batch.applicationName}
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
                          Commit {totalToApply} update{totalToApply !== 1 ? "s" : ""}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!canApply && (
                      <TooltipContent>
                        {unresolvedConflicts > 0
                          ? `Resolve ${unresolvedConflicts} conflict${unresolvedConflicts !== 1 ? "s" : ""} before committing`
                          : "Select at least one change to commit"}
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
            <AlertDialogTitle>Commit changes</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to apply{" "}
              <span className="font-medium text-foreground">{totalToApply} change{totalToApply !== 1 ? "s" : ""}</span>
              {resolvedConflicts > 0 && selectedSafe > 0 && (
                <> — {resolvedConflicts} resolved conflict{resolvedConflicts !== 1 ? "s" : ""} and{" "}
                  {selectedSafe} safe update{selectedSafe !== 1 ? "s" : ""}</>
              )}
              {resolvedConflicts > 0 && selectedSafe === 0 && (
                <> — {resolvedConflicts} resolved conflict{resolvedConflicts !== 1 ? "s" : ""}</>
              )}
              {resolvedConflicts === 0 && selectedSafe > 0 && (
                <> — {selectedSafe} safe update{selectedSafe !== 1 ? "s" : ""}</>
              )}
              {" "}. <span className="font-medium text-foreground">This cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmApply}>Commit changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
