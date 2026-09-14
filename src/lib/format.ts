/** 240000 -> "240,000" */
export function formatMoney(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}

/** 18400000 -> "18.4M", 240000 -> "240,000" */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 10_000) return (n / 1_000).toFixed(0) + 'K'
  return formatMoney(n)
}

/** relative time: 2m, 3h, 5d */
export function timeAgo(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000)
  if (s < 60) return 'now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  return `${d}d`
}

/** 1725000000000 -> "10 Sep 2026" */
export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}