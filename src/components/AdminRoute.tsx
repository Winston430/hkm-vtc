import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Wave } from './loading-ui/wave'

/**
 * Wrap admin-only routes. Agents (or anyone without an admin profile) are sent
 * back to the dashboard — prevents an agent ever landing on admin screens,
 * even by typing the URL directly.
 */
export default function AdminRoute({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-canvas">
        <Wave className="h-10 w-20 text-ink" />
      </div>
    )
  }
  if (profile?.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}