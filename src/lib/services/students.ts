import { useEffect, useState } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  runTransaction,
  updateDoc,
  writeBatch,
  getDocs,
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import { withTimeout, UploadError } from '../async'
import type { Course, NextOfKin, Student, Enrollment, Payment, Role } from '../types'
import { installmentPlan } from '../installments'

export interface RegisterStudentInput {
  branchId: string
  branchName: string
  fullName: string
  gender: string
  phone: string
  nida: string
  tin?: string
  residence: string
  nextOfKin: NextOfKin
  course: Course
  firstPayment: { amount: number; period: string; bankRef: string }
  createdBy: string
}

/** Short code used in the registration number, e.g. DRV for Basic Driving. */
export function courseCode(course: Course): string {
  if (course.code && course.code.trim()) return course.code.trim().toUpperCase()
  return course.name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'GEN'
}

/**
 * Registers a student atomically. The registration number is per-course:
 *   HKM/VTC/<CODE>/<0001>
 * Each course code keeps its own running sequence in counters/<CODE>.
 */
export async function registerStudent(
  input: RegisterStudentInput,
  photoFile: File | null
): Promise<{ regNo: string; studentId: string }> {
  let photoURL = ''
  if (photoFile) {
    try {
      const path = `students/${Date.now()}_${photoFile.name.replace(/\s+/g, '_')}`
      const r = storageRef(storage, path)
      await withTimeout(uploadBytes(r, photoFile), 15000, () => new UploadError())
      photoURL = await withTimeout(getDownloadURL(r), 10000, () => new UploadError())
    } catch {
      // storage not configured / offline / too slow -> surface a clear error
      throw new UploadError()
    }
  }

  const code = courseCode(input.course)
  const plan = installmentPlan(input.course)
  const totalDue = input.course.price
  const paid = input.firstPayment.amount
  const balance = Math.max(0, totalDue - paid)

  return runTransaction(db, async (tx) => {
    const counterRef = doc(db, 'counters', code)
    const counterSnap = await tx.get(counterRef)
    let seq = 1
    if (counterSnap.exists()) {
      const d = counterSnap.data() as { seq?: number }
      seq = (d.seq ?? 0) + 1
    }
    const regNo = `HKM/VTC/${code}/${String(seq).padStart(4, '0')}`
    tx.set(counterRef, { seq })

    const studentRef = doc(collection(db, 'students'))
    const enrollRef = doc(collection(db, 'enrollments'))
    const paymentRef = doc(collection(db, 'payments'))
    const notifRef = doc(collection(db, 'notifications'))
    const now = Date.now()

    tx.set(studentRef, {
      regNo,
      branchId: input.branchId,
      branchName: input.branchName,
      fullName: input.fullName,
      gender: input.gender,
      phone: input.phone,
      nida: input.nida,
      tin: input.tin ?? '',
      residence: input.residence,
      nextOfKin: input.nextOfKin,
      photoURL,
      createdBy: input.createdBy,
      createdAt: now,
    })
    tx.set(enrollRef, {
      studentId: studentRef.id,
      studentName: input.fullName,
      courseId: input.course.id,
      courseName: input.course.name,
      branchId: input.branchId,
      totalDue,
      balance,
      status: 'active',
      installmentCount: plan.count,
      installmentAmount: plan.amounts[0],
      durationMonths: input.course.durationMonths,
      createdAt: now,
    })
    tx.set(paymentRef, {
      enrollmentId: enrollRef.id,
      studentId: studentRef.id,
      studentName: input.fullName,
      branchId: input.branchId,
      amount: paid,
      period: input.firstPayment.period,
      bankRef: input.firstPayment.bankRef,
      createdAt: now,
    })
    tx.set(notifRef, {
      studentId: studentRef.id,
      studentName: input.fullName,
      courseName: input.course.name,
      branchId: input.branchId,
      branchName: input.branchName,
      bankRef: input.firstPayment.bankRef,
      read: false,
      createdAt: now,
    })

    return { regNo, studentId: studentRef.id }
  })
}

/** Record a follow-up installment against an enrollment, paying down the balance. */
export async function recordPayment(
  enrollmentId: string,
  amount: number,
  period: string,
  bankRef: string
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const enrRef = doc(db, 'enrollments', enrollmentId)
    const snap = await tx.get(enrRef)
    if (!snap.exists()) throw new Error('Enrollment not found')
    const e = snap.data() as Enrollment
    const newBalance = Math.max(0, (e.balance ?? 0) - amount)
    const payRef = doc(collection(db, 'payments'))
    tx.set(payRef, {
      enrollmentId,
      studentId: e.studentId,
      studentName: e.studentName,
      branchId: e.branchId,
      amount,
      period,
      bankRef,
      createdAt: Date.now(),
    })
    tx.update(enrRef, { balance: newBalance, status: newBalance <= 0 ? 'completed' : 'active' })
  })
}

/** Edit an existing student's editable fields. */
export async function updateStudent(id: string, patch: Partial<Student>): Promise<void> {
  await updateDoc(doc(db, 'students', id), patch as Record<string, unknown>)
}

/** Mark a student's enrollment as dropped (keeps the record). */
export async function dropStudent(enrollmentId: string): Promise<void> {
  await updateDoc(doc(db, 'enrollments', enrollmentId), { status: 'dropped' })
}

/** Permanently remove a student and all their enrollments + payments (admin only). */
export async function deleteStudent(studentId: string): Promise<void> {
  const batch = writeBatch(db)
  const enr = await getDocs(query(collection(db, 'enrollments'), where('studentId', '==', studentId)))
  enr.forEach((d) => batch.delete(d.ref))
  const pay = await getDocs(query(collection(db, 'payments'), where('studentId', '==', studentId)))
  pay.forEach((d) => batch.delete(d.ref))
  batch.delete(doc(db, 'students', studentId))
  await batch.commit()
}

/** Live student list, scoped by role. */
export function useStudents(role: Role, branchId: string | null) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const base = collection(db, 'students')
    const q = role === 'admin' ? base : query(base, where('branchId', '==', branchId ?? '__none__'))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, 'id'>) }))
        list.sort((a, b) => b.createdAt - a.createdAt)
        setStudents(list)
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [role, branchId])
  return { students, loading }
}

/** One student with their enrollments and payments. */
export function useStudentDetail(id: string) {
  const [student, setStudent] = useState<Student | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u1 = onSnapshot(doc(db, 'students', id), (snap) => {
      setStudent(snap.exists() ? { id: snap.id, ...(snap.data() as Omit<Student, 'id'>) } : null)
      setLoading(false)
    })
    const u2 = onSnapshot(query(collection(db, 'enrollments'), where('studentId', '==', id)), (snap) => {
      setEnrollments(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Enrollment, 'id'>) })))
    })
    const u3 = onSnapshot(query(collection(db, 'payments'), where('studentId', '==', id)), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Payment, 'id'>) }))
      list.sort((a, b) => b.createdAt - a.createdAt)
      setPayments(list)
    })
    return () => {
      u1(); u2(); u3()
    }
  }, [id])

  return { student, enrollments, payments, loading }
}