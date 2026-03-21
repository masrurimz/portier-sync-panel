import { createFormHook, createFormHookContexts } from '@tanstack/react-form'

import type { ReviewItem } from '../../-domain/review'
import { MergedValueField } from './fields/merged-value-field'
import { ResolutionChoiceField } from './fields/resolution-choice-field'
import { FormProgress } from './form-progress'
import { SubmitButton } from './submit-button'

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    ResolutionChoiceField,
    MergedValueField,
  },
  formComponents: {
    SubmitButton,
    FormProgress,
  },
})

export function toResolutionFormDefaults(item: ReviewItem) {
  return {
    kind: item.resolution.kind,
    mergedValue: item.resolution.mergedValue ?? item.externalValue ?? item.localValue ?? '',
  }
}