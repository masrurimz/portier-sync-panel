import { useStore } from "@tanstack/react-store";
import { Button } from "@portier-sync/ui/components/button";
import { Input } from "@portier-sync/ui/components/input";

import type { ReviewItem, ReviewResolution } from "../../domain/review";
import { useReviewResolutionForm } from "../forms/use-review-resolution-form";

export function ReviewResolutionForm({
  item,
  applicationName,
  onAutoSave,
  onSubmit,
}: {
  item: ReviewItem;
  applicationName: string;
  onAutoSave: (resolution: ReviewResolution) => void;
  onSubmit: (resolution: ReviewResolution) => void;
}) {
  const form = useReviewResolutionForm({ item, onSubmit: (resolution) => onSubmit(resolution) });
  const canSubmit = useStore(form.store, (state) => state.canSubmit);
  const errors = useStore(form.store, (state) => state.errors);

  const currentKind = item.resolution.kind;

  return (
    <form
      key={item.id}
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field name="kind">
        {(field) => (
          <div className="grid gap-3 lg:grid-cols-3">
            <button
              className={`rounded-2xl border p-4 text-left transition-colors ${
                currentKind === "local"
                  ? "border-primary/45 bg-primary/8 text-foreground"
                  : "border-border/70 bg-background/40 text-muted-foreground hover:bg-accent/35 hover:text-foreground"
              }`}
              onClick={() => {
                onAutoSave({ kind: "local" });
              }}
              type="button"
            >
              <div className="text-sm font-medium">Keep Portier Value</div>
              <div className="mt-1 text-xs leading-5">
                {currentKind === "local"
                  ? "Currently selected for the focused field."
                  : "Available choice for the focused field."}
              </div>
            </button>
            <button
              className={`rounded-2xl border p-4 text-left transition-colors ${
                currentKind === "external"
                  ? "border-primary/45 bg-primary/8 text-foreground"
                  : "border-border/70 bg-background/40 text-muted-foreground hover:bg-accent/35 hover:text-foreground"
              }`}
              onClick={() => {
                onAutoSave({ kind: "external" });
              }}
              type="button"
            >
              <div className="text-sm font-medium">Use {applicationName} Value</div>
              <div className="mt-1 text-xs leading-5">
                {currentKind === "external"
                  ? "Currently selected for the focused field."
                  : "Available choice for the focused field."}
              </div>
            </button>
            <button
              className={`rounded-2xl border p-4 text-left transition-colors ${
                currentKind === "merged"
                  ? "border-primary/45 bg-primary/8 text-foreground"
                  : "border-border/70 bg-background/40 text-muted-foreground hover:bg-accent/35 hover:text-foreground"
              }`}
              onClick={() => {
                field.handleChange("merged");
              }}
              type="button"
            >
              <div className="text-sm font-medium">Create Custom Value</div>
              <div className="mt-1 text-xs leading-5">
                {currentKind === "merged"
                  ? "Currently selected for the focused field."
                  : "Available choice for the focused field."}
              </div>
            </button>
          </div>
        )}
      </form.Field>

      <form.Field name="mergedValue">
        {(field) =>
          form.state.values.kind === "merged" || currentKind === "merged" ? (
            <div className="flex flex-col gap-2">
              <Input
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Enter the merged value for this field"
              />
              {field.state.meta.errors[0] ? <p className="text-xs text-destructive">{String(field.state.meta.errors[0])}</p> : null}
            </div>
          ) : null
        }
      </form.Field>

      {errors[0] ? <p className="text-xs text-destructive">{String(errors[0])}</p> : null}

      {(form.state.values.kind === "merged" || currentKind === "merged") && (
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={!canSubmit}>
            Confirm Custom Value
          </Button>
        </div>
      )}
    </form>
  );
}