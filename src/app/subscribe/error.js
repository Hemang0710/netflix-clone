'use client'

import ErrorBoundaryWrapper from '@/components/ErrorBoundary/ErrorBoundaryWrapper'

export default function SubscribeError({ error, reset }) {
  return <ErrorBoundaryWrapper error={error} reset={reset} pageName="Subscription" />
}
