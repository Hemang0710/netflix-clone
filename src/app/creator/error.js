'use client'

import ErrorBoundaryWrapper from '@/components/ErrorBoundary/ErrorBoundaryWrapper'

export default function CreatorError({ error, reset }) {
  return <ErrorBoundaryWrapper error={error} reset={reset} pageName="Creator Hub" />
}
