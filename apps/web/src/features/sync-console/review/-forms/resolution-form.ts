import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
import { z } from 'zod'

import type { ReviewItem } from '../../-domain/review'
import { MergedValueField } from './fields/merged-value-field'
import { NotesField } from './fields/notes-field'
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
    NotesField,
  },
  formComponents: {
    SubmitButton,
    FormProgress,
  },
})

export const resolutionFormSchema = z.object({
  kind: z.enum(['local', 'external', 'merged']).optional(),
  mergedValue: z.string(),
  notes: z.string().optional(),
})

export type ResolutionFormValues = z.infer<typeof resolutionFormSchema>

export function toResolutionFormDefaults(item: ReviewItem): ResolutionFormValues {
  return {
    kind: item.conflict && !item.resolution.kind ? undefined : item.resolution.kind,
    mergedValue: item.resolution.mergedValue ?? item.externalValue ?? item.localValue ?? '',
    notes: '',
  }
}