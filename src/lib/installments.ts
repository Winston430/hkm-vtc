import type { Course } from './types'

export interface InstallmentPlan {
  count: number
  /** amount for each installment; the last absorbs any rounding remainder so the sum is exact */
  amounts: number[]
  /** true when installments are fortnightly (1-month courses), false when monthly */
  fortnightly: boolean
}

/**
 * Installment rule for HKM:
 *  - a 1-month course  -> 2 installments, one every 2 weeks
 *  - an N-month course -> N installments, one per month
 * The fee is divided equally; the final installment absorbs any rounding remainder.
 */
export function installmentPlan(course: Course): InstallmentPlan {
  const fortnightly = course.durationMonths <= 1
  const count = fortnightly ? 2 : course.durationMonths
  const base = Math.floor(course.price / count)
  const amounts = Array.from({ length: count }, (_, i) =>
    i === count - 1 ? course.price - base * (count - 1) : base
  )
  return { count, amounts, fortnightly }
}