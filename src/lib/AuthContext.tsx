import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from './firebase'

export type Role = 'admin' | 'agent'

export interface UserProfile {
  uid: string
  name: string
  email: string
  role: Role
  branchId: string | null
  active: boolean
}

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubProfile: () => void = () => {}
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u)
      unsubProfile()
      unsubProfile = () => {}
      if (u) {
        // live subscription so name changes / disable take effect immediately
        unsubProfile = onSnapshot(
          doc(db, 'users', u.uid),
          (snap) => {
            if (snap.exists()) {
              const d = snap.data()
              setProfile({
                uid: u.uid,
                name: d.name ?? '',
                email: u.email ?? '',
                role: d.role,
                branchId: d.branchId ?? null,
                active: d.active ?? true,
              })
            } else {
              setProfile(null)
            }
            setLoading(false)
          },
          (err) => {
            console.error('profile subscription failed', err)
            setProfile(null)
            setLoading(false)
          }
        )
      } else {
        setProfile(null)
        setLoading(false)
      }
    })
    return () => {
      unsubProfile()
      unsubAuth()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }
  const logout = async () => {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within an AuthProvider')
  return ctx
}