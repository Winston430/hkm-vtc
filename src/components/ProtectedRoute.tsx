import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Wave } from './loading-ui/wave'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-canvas">
        <Wave className="h-10 w-20 text-ink" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  // account explicitly disabled by an admin
  if (profile && profile.active === false) {
    return (
      <div className="min-h-screen grid place-items-center bg-canvas font-sans px-6">
        <div className="text-center max-w-[320px]">
          <div className="text-[16px] font-extrabold text-ink">Account disabled</div>
          <p className="text-[13px] text-ink-secondary mt-1.5">Your access has been turned off. Please contact your administrator.</p>
          <button onClick={() => logout()} className="mt-5 bg-primary text-on-primary rounded-[20px] px-5 py-2.5 text-[12.5px] font-bold hover:opacity-90 transition">Sign out</button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}