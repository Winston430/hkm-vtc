import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import type { Payment, Role } from '../types'

/** Live payments, scoped by role (admin = all branches, agent = own branch). */
export function usePayments(role: Role, branchId: string | null) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const base = collection(db, 'payments')
    const q = role === 'admin' ? base : query(base, where('branchId', '==', branchId ?? '__none__'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Payment, 'id'>) }))
        list.sort((a, b) => b.createdAt - a.createdAt)
        setPayments(list)
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [role, branchId])
  return { payments, loading }
}