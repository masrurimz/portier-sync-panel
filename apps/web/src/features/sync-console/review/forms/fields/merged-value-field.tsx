import { Input } from '@portier-sync/ui/components/input'

import { useFieldContext } from '../resolution-form'

export function MergedValueField() {
  const field = useFieldContext<string>()
  return (
    <div className="flex flex-col gap-2">
      <Input
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder="Enter the merged value for this field"
      />
      {field.state.meta.errors[0] ? (
        <p className="text-xs text-destructive">{String(field.state.meta.errors[0])}</p>
      ) : null}
    </div>
  )
}