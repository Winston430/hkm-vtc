import type { CSSProperties } from 'react'

/**
 * Skeleton — shimmer placeholder for page-to-page / data loading.
 * Shape it with Tailwind sizing + radius, e.g.:
 *
 *   <Skeleton className="h-4 w-40" />
 *   <Skeleton className="h-32 w-full rounded-card" />
 *   <div className="flex items-center gap-3">
 *     <Skeleton className="h-10 w-10 rounded-full" />
 *     <Skeleton className="h-4 w-32" />
 *   </div>
 */
export function Skeleton({
  className = '',
  style,
}: {
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      className={`hkm-skeleton relative overflow-hidden bg-surface-soft rounded-md ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
}

export default Skeleton