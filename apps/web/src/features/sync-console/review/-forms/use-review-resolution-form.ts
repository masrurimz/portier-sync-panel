import * as React from 'react'

import type { ReviewItem, ReviewResolution } from '../../-domain/review'
import { toResolutionFormDefaults, useAppForm } from './resolution-form'

export function useReviewResolutionForm({
  item,
  onSubmit,
}: {
  item: ReviewItem
  onSubmit: (resolution: ReviewResolution) => void
}) {
  const defaults = React.useMemo(() => toResolutionFormDefaults(item), [item])

  return useAppForm({
    defaultValues: defaults,
    validators: {
      onChange: ({ value }) => {
        if (value.kind === 'merged' && !value.mergedValue.trim()) {
          return 'Merged value is required when editing the final result.'
        }
        return undefined
      },
    },
    onSubmit: async ({ value }) => {
      if (value.kind === 'merged') {
        onSubmit({ kind: value.kind, mergedValue: value.mergedValue.trim() })
      } else if (value.kind) {
        onSubmit({ kind: value.kind })
      }
    },
  })
}