'use client'

import ErrorBoundaryWrapper from '@/components/ErrorBoundary/ErrorBoundaryWrapper'

export default function BrowseError({ error, reset }) {
  return <ErrorBoundaryWrapper error={error} reset={reset} pageName="Browse" />
} 