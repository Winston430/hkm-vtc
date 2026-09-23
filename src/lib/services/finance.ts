import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import type { Payment, Expense } from '../types'

/** Subscribes to all payments + expenses (admin only) for financial reporting. */
export function useFinance() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [ready, setReady] = useState({ p: false, e: false })
  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'payments'), (snap) => {
      setPayments(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Payment, 'id'>) })))
      setReady((r) => ({ ...r, p: true }))
    })
    const u2 = onSnapshot(collection(db, 'expenses'), (snap) => {
      setExpenses(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Expense, 'id'>) })))
      setReady((r) => ({ ...r, e: true }))
    })
    return () => { u1(); u2() }
  }, [])

  const totalBalance = payments.reduce((s, p) => s + p.amount, 0) // all money in via students

  function sumIn(from: number, to: number, branchId?: string | null) {
    const inRange = (t: number) => t >= from && t <= to
    const pay = payments.filter((p) => inRange(p.createdAt) && (!branchId || p.branchId === branchId))
    const exp = expenses.filter((e) => inRange(e.createdAt) && (!branchId || e.branchId === branchId))
    const income = pay.reduce((s, p) => s + p.amount, 0)
    const spent = exp.reduce((s, e) => s + e.amount, 0)
    return { income, expenses: spent, profit: income - spent }
  }

  return { payments, expenses, totalBalance, sumIn, loading: !(ready.p && ready.e) }
}