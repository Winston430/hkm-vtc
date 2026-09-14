import type { Role } from './AuthContext'
export type { Role }

export interface Branch {
  id: string
  name: string
  location?: string
  phone?: string
  createdAt?: number
}

export interface Course {
  id: string
  name: string
  code: string
  category: string
  durationMonths: number
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

export type EnrollmentStatus = 'active' | 'completed' | 'dropped'

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
  installmentCount?: number
  installmentAmount?: number
  durationMonths?: number
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