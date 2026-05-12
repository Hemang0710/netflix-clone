'use client'

import ErrorBoundaryWrapper from '@/components/ErrorBoundary/ErrorBoundaryWrapper'

export default function ProfileError({ error, reset }) {
  return <ErrorBoundaryWrapper error={error} reset={reset} pageName="Profile" />
}
