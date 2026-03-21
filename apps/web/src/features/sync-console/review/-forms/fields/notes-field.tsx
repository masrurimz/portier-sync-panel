import { Input } from '@portier-sync/ui/components/input'

import { useFieldContext } from '../resolution-form'

export function NotesField({ label }: { label?: string }) {
  const field = useFieldContext<string>()
  return (
    <div className="flex flex-col gap-1.5">
      {label ? <label className="text-xs text-muted-foreground">{label}</label> : null}
      <Input
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder="Optional notes for this resolution"
      />
    </div>
  )
}