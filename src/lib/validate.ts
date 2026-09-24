/** Field validators shared by registration and student editing. */

/** Full name: at least two words, letters only (spaces, ' - . allowed). */
export function isFullName(v: string): boolean {
  return /^[A-Za-z][A-Za-z'’.-]*(?:\s+[A-Za-z'’.-]+)+$/.test(v.trim())
}

export function normalizePhone(v: string): string {
  return v.replace(/[\s-]/g, '')
}

/** Tanzanian mobile: 07XXXXXXXX / 06XXXXXXXX, or +255 / 255 7XXXXXXXX. */
export function isPhone(v: string): boolean {
  return /^(?:\+?255|0)[67]\d{8}$/.test(normalizePhone(v))
}

/** NIDA — 20 digits (dashes/spaces ignored). */
export function isNida(v: string): boolean {
  return v.replace(/\D/g, '').length === 20
}

/** TIN — 9 digits (dashes/spaces ignored). */
export function isTin(v: string): boolean {
  return v.replace(/\D/g, '').length === 9
}