import { useStore } from "@tanstack/react-store";
import { Button } from "@portier-sync/ui/components/button";
import { Input } from "@portier-sync/ui/components/input";

import type { ReviewItem, ReviewResolution } from "../../domain/review";
import { useReviewResolutionForm } from "../forms/use-review-resolution-form";

export function ReviewResolutionForm({
  item,
  onSubmit,
}: {
  item: ReviewItem;
  onSubmit: (resolution: ReviewResolution) => void;
}) {
  const form = useReviewResolutionForm({ item, onSubmit });
  const canSubmit = useStore(form.store, (state) => state.canSubmit);
  const errors = useStore(form.store, (state) => state.errors);

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
            {([
              { label: "Keep local", value: "local" },
              { label: "Accept external", value: "external" },
              { label: "Edit merged value", value: "merged" },
            ] as const).map((option) => (
              <button
                key={option.value}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  field.state.value === option.value
                    ? "border-primary/45 bg-primary/8 text-foreground"
                    : "border-border/70 bg-background/40 text-muted-foreground hover:bg-accent/35 hover:text-foreground"
                }`}
                onClick={() => field.handleChange(option.value)}
                type="button"
              >
                <div className="text-sm font-medium">{option.label}</div>
                <div className="mt-1 text-xs leading-5">
                  {field.state.value === option.value
                    ? "Currently selected for the focused field."
                    : "Available choice for the focused field."}
                </div>
              </button>
            ))}
          </div>
        )}
      </form.Field>

      <form.Field name="mergedValue">
        {(field) =>
          form.state.values.kind === "merged" ? (
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

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!canSubmit}>
          Save resolution
        </Button>
      </div>
    </form>
  );
}
