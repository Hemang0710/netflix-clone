'use client'

import ErrorBoundaryWrapper from '@/components/ErrorBoundary/ErrorBoundaryWrapper'

export default function LearnError({ error, reset }) {
  return <ErrorBoundaryWrapper error={error} reset={reset} pageName="Learning" />
}
