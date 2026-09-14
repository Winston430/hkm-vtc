import { useEffect, useState } from 'react'
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { collection, onSnapshot, query, where, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db, firebaseConfig } from '../firebase'

export interface Agent {
  uid: string
  name: string
  email: string
  branchId: string
  active: boolean
  createdAt?: number
}

/** Live list of all agent accounts (admin only). */
export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'agent'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<Agent, 'uid'>) }))
        list.sort((a, b) => a.name.localeCompare(b.name))
        setAgents(list)
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [])
  return { agents, loading }
}

/**
 * Create an agent account.
 * Uses a SECONDARY Firebase app so creating the auth user does not sign the
 * admin out. Role + branch live in the user's Firestore doc (which the security
 * rules read), so no Cloud Function / custom claims are required.
 */
export async function createAgent(params: {
  name: string
  email: string
  password: string
  branchId: string
}): Promise<void> {
  const secondary = initializeApp(firebaseConfig, `secondary-${Date.now()}`)
  try {
    const secAuth = getAuth(secondary)
    const cred = await createUserWithEmailAndPassword(secAuth, params.email.trim(), params.password)
    const uid = cred.user.uid
    // write the profile doc via the PRIMARY db (admin is signed in -> rules allow)
    await setDoc(doc(db, 'users', uid), {
      name: params.name.trim(),
      email: params.email.trim(),
      role: 'agent',
      branchId: params.branchId,
      active: true,
      createdAt: Date.now(),
    })
    await signOut(secAuth)
  } finally {
    await deleteApp(secondary)
  }
}

export async function setAgentActive(uid: string, active: boolean): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { active })
}

/** Revokes app access by removing the profile doc (the auth login can't be
 *  removed from the client — see the note in the UI). */
export async function removeAgent(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid))
}