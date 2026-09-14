import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore'
import type { Query } from 'firebase/firestore'
import { db } from '../firebase'
import type {
  Role,
  Student,
  Enrollment,
  Payment,
  Branch,
  AppNotification,
} from '../types'

export async function markNotificationRead(id: string): Promise<void> {
  await updateDoc(doc(db, 'notifications', id), { read: true })
}

export interface RecentRow {
  id: string
  name: string
  regNo: string
  branchName: string
  courseName: string
  amountPaid: number
  status: 'paid' | 'due'
}

export interface CoursePopularity {
  name: string
  enrolled: number
  pct: number
}

export interface BranchSummary {
  id: string
  name: string
  students: number
}

export interface DashboardData {
  loading: boolean
  totalStudents: number
  feesThisMonth: number
  outstanding: number
  recent: RecentRow[]
  popularCourses: CoursePopularity[]
  branchSummaries: BranchSummary[]
  notifications: AppNotification[]
  todaysPayments: Payment[]
}

function scoped(name: string, role: Role, branchId: string | null): Query {
  const base = collection(db, name)
  return role === 'admin'
    ? (base as unknown as Query)
    : query(base, where('branchId', '==', branchId ?? '__none__'))
}

export function useDashboardData(role: Role, branchId: string | null): DashboardData {
  const [students, setStudents] = useState<Student[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [ready, setReady] = useState({ s: false, e: false, p: false })

  useEffect(() => {
    const u1 = onSnapshot(scoped('students', role, branchId), (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, 'id'>) })))
      setReady((r) => ({ ...r, s: true }))
    })
    const u2 = onSnapshot(scoped('enrollments', role, branchId), (snap) => {
      setEnrollments(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Enrollment, 'id'>) })))
      setReady((r) => ({ ...r, e: true }))
    })
    const u3 = onSnapshot(scoped('payments', role, branchId), (snap) => {
      setPayments(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Payment, 'id'>) })))
      setReady((r) => ({ ...r, p: true }))
    })
    const u4 = onSnapshot(collection(db, 'branches'), (snap) => {
      setBranches(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Branch, 'id'>) })))
    })
    const u5 = onSnapshot(scoped('notifications', role, branchId), (snap) => {
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AppNotification, 'id'>) })))
    })
    return () => {
      u1(); u2(); u3(); u4(); u5()
    }
  }, [role, branchId])

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

  const feesThisMonth = payments
    .filter((p) => p.createdAt >= monthStart)
    .reduce((s, p) => s + p.amount, 0)

  const outstanding = enrollments
    .filter((e) => e.status === 'active')
    .reduce((s, e) => s + Math.max(0, e.balance), 0)

  // recent registrations (join student -> its enrollment)
  const enrollByStudent = new Map<string, Enrollment>()
  enrollments.forEach((e) => {
    const cur = enrollByStudent.get(e.studentId)
    if (!cur || e.createdAt > cur.createdAt) enrollByStudent.set(e.studentId, e)
  })
  const recent: RecentRow[] = [...students]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5)
    .map((s) => {
      const e = enrollByStudent.get(s.id)
      const firstPay = payments
        .filter((p) => p.studentId === s.id)
        .reduce((sum, p) => sum + p.amount, 0)
      return {
        id: s.id,
        name: s.fullName,
        regNo: s.regNo,
        branchName: s.branchName,
        courseName: e?.courseName ?? '—',
        amountPaid: firstPay,
        status: (e && e.balance <= 0 ? 'paid' : 'due') as 'paid' | 'due',
      }
    })

  // popular courses
  const counts = new Map<string, number>()
  enrollments.forEach((e) => counts.set(e.courseName, (counts.get(e.courseName) ?? 0) + 1))
  const maxCount = Math.max(1, ...counts.values())
  const popularCourses: CoursePopularity[] = [...counts.entries()]
    .map(([name, enrolled]) => ({ name, enrolled, pct: Math.round((enrolled / maxCount) * 100) }))
    .sort((a, b) => b.enrolled - a.enrolled)
    .slice(0, 4)

  // branch summaries
  const branchSummaries: BranchSummary[] = branches
    .map((b) => ({
      id: b.id,
      name: b.name,
      students: students.filter((s) => s.branchId === b.id).length,
    }))
    .sort((a, b) => b.students - a.students)

  const notificationsSorted = [...notifications]
    .filter((n) => !n.read)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 12)

  const todaysPayments = payments
    .filter((p) => p.createdAt >= dayStart)
    .sort((a, b) => b.createdAt - a.createdAt)

  return {
    loading: !(ready.s && ready.e && ready.p),
    totalStudents: students.length,
    feesThisMonth,
    outstanding,
    recent,
    popularCourses,
    branchSummaries,
    notifications: notificationsSorted,
    todaysPayments,
  }
}

/** Live enrollments, scoped by role — used by the students list for balances. */
export function useEnrollments(role: Role, branchId: string | null) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  useEffect(() => {
    const base = collection(db, 'enrollments')
    const q = role === 'admin' ? (base as unknown as Query) : query(base, where('branchId', '==', branchId ?? '__none__'))
    const unsub = onSnapshot(q, (snap) => {
      setEnrollments(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Enrollment, 'id'>) })))
    })
    return unsub
  }, [role, branchId])
  return { enrollments }
}