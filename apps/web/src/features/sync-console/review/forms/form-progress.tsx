import { useFormContext } from './resolution-form'

export function FormProgress() {
  const form = useFormContext()
  return (
    <form.Subscribe selector={(s) => ({ isDirty: s.isDirty, isValid: s.isValid, errors: s.errors })}>
      {({ isDirty, isValid, errors }) =>
        isDirty && !isValid && errors[0] ? (
          <p className="text-xs text-destructive">{String(errors[0])}</p>
        ) : null
      }
    </form.Subscribe>
  )
}