import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@portier-sync/ui/components/card';

/**
 * Find common prefix/suffix between two strings and isolate the differing middle.
 * Used to highlight exactly what changed between local and external values.
 */
function inlineDiff(a: string, b: string): { prefix: string; mid: string; suffix: string } {
  let prefixLen = 0;
  while (prefixLen < a.length && prefixLen < b.length && a[prefixLen] === b[prefixLen]) prefixLen++;
  let suffixLen = 0;
  const maxSuffix = Math.min(a.length - prefixLen, b.length - prefixLen);
  while (suffixLen < maxSuffix && a[a.length - 1 - suffixLen] === b[b.length - 1 - suffixLen]) suffixLen++;
  return {
    prefix: a.slice(0, prefixLen),
    mid: a.slice(prefixLen, suffixLen > 0 ? a.length - suffixLen : a.length),
    suffix: suffixLen > 0 ? a.slice(a.length - suffixLen) : '',
  };
}

export function ValuePanel({
  title,
  description,
  value,
  otherValue,
  highlightColor,
}: {
  title: string;
  description: string;
  value: string;
  otherValue?: string;
  highlightColor?: 'red' | 'green';
}) {
  const diff = highlightColor && value && otherValue ? inlineDiff(value, otherValue) : null;
  return (
    <Card className="border border-border/70 bg-background/40">
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="min-h-28 rounded-2xl border border-border/70 bg-muted/20 p-4 font-mono text-sm leading-6 break-all">
          {value ? (
            diff ? (
              <>
                <span>{diff.prefix}</span>
                <span className={
                  highlightColor === 'red'
                    ? 'rounded px-0.5 bg-red-500/15 text-red-700 dark:text-red-400'
                    : 'rounded px-0.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                }>
                  {diff.mid}
                </span>
                <span>{diff.suffix}</span>
              </>
            ) : (
              value
            )
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}