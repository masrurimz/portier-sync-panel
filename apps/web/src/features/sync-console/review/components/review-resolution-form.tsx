import type { ReviewItem, ReviewResolution } from '../../domain/review'
import { useReviewResolutionForm } from '../forms/use-review-resolution-form'

export function ReviewResolutionForm({
  item,
  applicationName,
  onAutoSave,
  onSubmit,
}: {
  item: ReviewItem
  applicationName: string
  onAutoSave: (resolution: ReviewResolution) => void
  onSubmit: (resolution: ReviewResolution) => void
}) {
  const form = useReviewResolutionForm({ item, onSubmit: (resolution) => onSubmit(resolution) })
  const currentKind = item.resolution.kind

  return (
    <form
      key={item.id}
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <form.AppField name="kind">
        {(field) => (
          <field.ResolutionChoiceField
            applicationName={applicationName}
            currentKind={currentKind}
            onAutoSave={onAutoSave}
          />
        )}
      </form.AppField>

      <form.Subscribe selector={(s) => s.values.kind}>
        {(kind) =>
          kind === 'merged' || currentKind === 'merged' ? (
            <form.AppField name="mergedValue">
              {(field) => <field.MergedValueField />}
            </form.AppField>
          ) : null
        }
      </form.Subscribe>

      <form.AppForm>
        <form.FormProgress />
      </form.AppForm>

      <form.Subscribe selector={(s) => s.values.kind}>
        {(kind) =>
          kind === 'merged' || currentKind === 'merged' ? (
            <div className="flex flex-wrap gap-2">
              <form.AppForm>
                <form.SubmitButton label="Confirm Custom Value" />
              </form.AppForm>
            </div>
          ) : null
        }
      </form.Subscribe>
    </form>
  )
}