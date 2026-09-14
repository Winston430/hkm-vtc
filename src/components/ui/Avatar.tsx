const AV_COLORS = ['#7C6BAE', '#4E8FB0', '#C79A4A', '#5CA06E', '#B0625C', '#5B7BB4', '#A0688F']

export function avatarColor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h)
  return AV_COLORS[Math.abs(h) % AV_COLORS.length]
}

export function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function Avatar({
  name,
  size = 32,
  className = '',
}: {
  name: string
  size?: number
  className?: string
}) {
  return (
    <span
      className={`inline-grid place-items-center rounded-full text-white font-bold shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: avatarColor(name),
      }}
    >
      {initialsOf(name)}
    </span>
  )
}