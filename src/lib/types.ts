import type { Role } from './AuthContext'
export type { Role }

export interface Branch {
  id: string
  name: string
  location?: string
  phone?: string
  createdAt?: number
}

export type DurationUnit = 'months' | 'weeks'

export interface Course {
  id: string
  name: string
  code: string
  category: string
  durationValue?: number
  durationUnit?: DurationUnit
  durationMonths?: number // legacy — read as months when durationValue absent
  price: number
  active: boolean
}

export interface NextOfKin {
  name: string
  relationship: string
  residence: string
  phone: string
}

export interface Student {
  id: string
  regNo: string
  branchId: string
  branchName: string
  fullName: string
  gender: string
  phone: string
  nida: string
  tin?: string
  residence: string
  nextOfKin: NextOfKin
  photoURL?: string
  createdBy: string
  createdAt: number
}

export type EnrollmentStatus = 'active' | 'dropped'

export interface Enrollment {
  id: string
  studentId: string
  studentName: string
  courseId: string
  courseName: string
  branchId: string
  totalDue: number
  balance: number
  status: EnrollmentStatus
  finished?: boolean          // student has finished/graduated their studies
  finishedAt?: number
  durationValue?: number
  durationUnit?: DurationUnit
  createdAt: number
}

export interface Payment {
  id: string
  enrollmentId: string
  studentId: string
  studentName: string
  branchId: string
  amount: number
  period: string
  bankRef: string
  createdAt: number
}

export type ExpenseKind = 'expense' | 'salary' | 'advance'

export interface Expense {
  id: string
  title: string
  amount: number
  category: string
  kind: ExpenseKind
  branchId: string | null   // null = general / centre-wide
  staffId?: string          // set for salary / advance
  staffName?: string
  bankRef?: string
  recordedBy: string
  createdAt: number
}

export interface AppNotification {
  id: string
  studentId: string
  studentName: string
  courseName: string
  branchId: string
  branchName: string
  bankRef: string
  read: boolean
  createdAt: number
}