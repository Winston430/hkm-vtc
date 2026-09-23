import type { Course, DurationUnit } from './types'

export function courseDurationValue(c: Pick<Course, 'durationValue' | 'durationMonths'>): number {
  return c.durationValue ?? c.durationMonths ?? 1
}
export function courseDurationUnit(c: Pick<Course, 'durationUnit'>): DurationUnit {
  return c.durationUnit ?? 'months'
}
/** "3 months" / "6 weeks" */
export function durationLabel(
  c: Pick<Course, 'durationValue' | 'durationMonths' | 'durationUnit'>
): string {
  const v = courseDurationValue(c)
  const u = courseDurationUnit(c)
  const noun = u === 'weeks' ? (v === 1 ? 'week' : 'weeks') : v === 1 ? 'month' : 'months'
  return `${v} ${noun}`
}