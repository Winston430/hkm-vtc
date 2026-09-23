import { useEffect, useState } from 'react'
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db, firebaseConfig } from '../firebase'
import type { Role } from '../types'
import { addExpense } from './expenses'

export interface Staff {
  uid: string
  name: string
  email: string
  role: Role
  branchId: string | null
  active: boolean
  createdAt?: number
}

/** Live list of all staff accounts — admins and agents (admin only). */
export function useStaff() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const list = snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<Staff, 'uid'>) }))
      list.sort((a, b) => a.name.localeCompare(b.name))
      setStaff(list); setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [])
  return { staff, loading }
}

/**
 * Create a staff account (admin or agent). Uses a secondary Firebase app so the
 * current admin is not signed out. Role + branch live in the Firestore user doc.
 */
export async function createStaff(params: {
  name: string; email: string; password: string; role: Role; branchId: string | null
}): Promise<void> {
  const secondary = initializeApp(firebaseConfig, `secondary-${Date.now()}`)
  try {
    const secAuth = getAuth(secondary)
    const cred = await createUserWithEmailAndPassword(secAuth, params.email.trim(), params.password)
    await setDoc(doc(db, 'users', cred.user.uid), {
      name: params.name.trim(),
      email: params.email.trim(),
      role: params.role,
      branchId: params.role === 'admin' ? null : params.branchId,
      active: true,
      createdAt: Date.now(),
    })
    await signOut(secAuth)
  } finally {
    await deleteApp(secondary)
  }
}

export async function setStaffActive(uid: string, active: boolean): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { active })
}

export async function removeStaff(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid))
}

/** Record a salary or advance payment to a staff member — logged as an expense. */
export async function payStaff(params: {
  staff: Staff; kind: 'salary' | 'advance'; amount: number; note?: string; recordedBy: string
}): Promise<void> {
  await addExpense({
    title: `${params.kind === 'salary' ? 'Salary' : 'Advance'} — ${params.staff.name}${params.note ? ` (${params.note})` : ''}`,
    amount: params.amount,
    category: params.kind === 'salary' ? 'Staff Salary' : 'Staff Advance',
    kind: params.kind,
    branchId: params.staff.branchId,
    staffId: params.staff.uid,
    staffName: params.staff.name,
    recordedBy: params.recordedBy,
  })
}