import { Button } from '@portier-sync/ui/components/button'

import { useFormContext } from './resolution-form'

export function SubmitButton({ label }: { label: string }) {
  const form = useFormContext()
  return (
    <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
      {([canSubmit, isSubmitting]) => (
        <Button type="submit" disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? 'Applying...' : label}
        </Button>
      )}
    </form.Subscribe>
  )
}