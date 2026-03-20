import * as React from 'react'

type MSWState = 'pending' | 'ready'

// Lazily starts MSW worker in development. Renders children immediately
// in production (worker is never started).
export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<MSWState>(
    import.meta.env.DEV ? 'pending' : 'ready'
  )

  React.useEffect(() => {
    if (!import.meta.env.DEV) return
    // Dynamic import so MSW is tree-shaken in production build
    void import('../../mocks/browser').then(({ worker }) =>
      worker.start({ onUnhandledRequest: 'bypass' })
    ).then(() => setState('ready'))
  }, [])

  if (state === 'pending') return null
  return <>{children}</>
}