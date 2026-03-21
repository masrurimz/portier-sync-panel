import { useFieldContext } from '../resolution-form'
import type { ReviewResolution } from '../../../-domain/review'

export function ResolutionChoiceField({
  applicationName: _applicationName,
  currentKind,
  onAutoSave,
}: {
  applicationName: string
  currentKind: ReviewResolution['kind']
  onAutoSave: (resolution: ReviewResolution) => void
}) {
  const field = useFieldContext<ReviewResolution['kind']>()

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <button
        className={`rounded-2xl border p-4 text-left transition-colors ${
          currentKind === 'local'
            ? 'border-primary/45 bg-primary/8 text-foreground'
            : 'border-border/70 bg-background/40 text-muted-foreground hover:bg-accent/35 hover:text-foreground'
        }`}
        onClick={() => {
          onAutoSave({ kind: 'local' })
        }}
        type="button"
      >
        <div className="text-sm font-medium">Keep local</div>
        <div className="mt-1 text-xs leading-5">
          {currentKind === 'local'
            ? 'Currently selected for the focused field.'
            : 'Available choice for the focused field.'}
        </div>
      </button>
      <button
        className={`rounded-2xl border p-4 text-left transition-colors ${
          currentKind === 'external'
            ? 'border-primary/45 bg-primary/8 text-foreground'
            : 'border-border/70 bg-background/40 text-muted-foreground hover:bg-accent/35 hover:text-foreground'
        }`}
        onClick={() => {
          onAutoSave({ kind: 'external' })
        }}
        type="button"
      >
        <div className="text-sm font-medium">Accept remote</div>
        <div className="mt-1 text-xs leading-5">
          {currentKind === 'external'
            ? 'Currently selected for the focused field.'
            : 'Available choice for the focused field.'}
        </div>
      </button>
      <button
        className={`rounded-2xl border p-4 text-left transition-colors ${
          currentKind === 'merged'
            ? 'border-primary/45 bg-primary/8 text-foreground'
            : 'border-border/70 bg-background/40 text-muted-foreground hover:bg-accent/35 hover:text-foreground'
        }`}
        onClick={() => {
          field.handleChange('merged')
        }}
        type="button"
      >
        <div className="text-sm font-medium">Custom value</div>
        <div className="mt-1 text-xs leading-5">
          {currentKind === 'merged'
            ? 'Currently selected for the focused field.'
            : 'Available choice for the focused field.'}
        </div>
      </button>
    </div>
  )
}