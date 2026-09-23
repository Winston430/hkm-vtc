import { useEffect, useState } from 'react'
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import type { Expense, Role } from '../types'

/** Expenses scoped by role: admin sees all, an agent sees only their branch. */
export function useExpenses(role: Role, branchId: string | null) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const base = collection(db, 'expenses')
    const q = role === 'admin' ? base : query(base, where('branchId', '==', branchId ?? '__none__'))
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Expense, 'id'>) }))
      list.sort((a, b) => b.createdAt - a.createdAt)
      setExpenses(list); setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [role, branchId])
  return { expenses, loading }
}

export async function addExpense(data: Omit<Expense, 'id' | 'createdAt'>): Promise<void> {
  await addDoc(collection(db, 'expenses'), { ...data, createdAt: Date.now() })
}

export async function deleteExpense(id: string): Promise<void> {
  await deleteDoc(doc(db, 'expenses', id))
}