/**
 * Lightweight, dependency-free charts themed with the app's design tokens.
 * Colors are passed as CSS var() strings so they repaint automatically on
 * light/dark toggle. Native <title> gives hover tooltips.
 */

export interface Slice { label: string; value: number; color: string }

/** Vertical bar chart (flex-based, responsive). */
export function BarChart({
  data, height = 200, color = 'var(--color-ink)', formatValue,
}: {
  data: { label: string; value: number }[]
  height?: number
  color?: string
  formatValue?: (n: number) => string
}) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const fmt = (n: number) => (formatValue ? formatValue(n) : String(n))
  if (data.length === 0) return <EmptyChart height={height} />
  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end gap-1.5 px-1" style={{ height: height - 24 }}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full min-w-0" title={`${d.label}: ${fmt(d.value)}`}>
            <div className="text-[9px] font-bold text-ink-muted mb-1 tabular-nums leading-none">{d.value > 0 ? fmt(d.value) : ''}</div>
            <div className="w-full max-w-[36px] rounded-t-[5px]" style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 4 : 0, background: color }} />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 px-1 mt-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[9px] font-semibold text-ink-muted truncate min-w-0" title={d.label}>{d.label}</div>
        ))}
      </div>
    </div>
  )
}

/** Horizontal bar chart — better when labels are long (e.g. course names). */
export function HBarChart({
  data, color = 'var(--color-ink)', formatValue,
}: {
  data: { label: string; value: number }[]
  color?: string
  formatValue?: (n: number) => string
}) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const fmt = (n: number) => (formatValue ? formatValue(n) : String(n))
  if (data.length === 0) return <EmptyChart height={160} />
  return (
    <div className="flex flex-col gap-2.5 py-1">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3" title={`${d.label}: ${fmt(d.value)}`}>
          <div className="w-[38%] shrink-0 text-[11px] font-semibold text-ink-secondary truncate text-right">{d.label}</div>
          <div className="flex-1 h-[18px] rounded-[5px] bg-surface-soft overflow-hidden">
            <div className="h-full rounded-[5px]" style={{ width: `${Math.max(3, (d.value / max) * 100)}%`, background: color }} />
          </div>
          <div className="w-9 shrink-0 text-[11px] font-extrabold text-ink tabular-nums">{fmt(d.value)}</div>
        </div>
      ))}
    </div>
  )
}

/** Multi-series line chart with soft area fill. */
export function LineChart({
  labels, series, height = 210, formatValue,
}: {
  labels: string[]
  series: { name: string; color: string; points: number[] }[]
  height?: number
  formatValue?: (n: number) => string
}) {
  const all = series.flatMap((s) => s.points)
  const max = Math.max(1, ...all)
  const fmt = (n: number) => (formatValue ? formatValue(n) : String(n))
  const W = 600, H = 220, padL = 6, padR = 6, padT = 12, padB = 26
  const innerW = W - padL - padR, innerH = H - padT - padB
  const n = labels.length
  const x = (i: number) => padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const y = (v: number) => padT + innerH - (v / max) * innerH
  const baseY = padT + innerH
  if (n === 0) return <EmptyChart height={height} />

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
        {/* gridlines */}
        {[0, 0.5, 1].map((g) => (
          <line key={g} x1={padL} x2={W - padR} y1={padT + innerH * g} y2={padT + innerH * g} stroke="var(--color-hair)" strokeWidth={1} />
        ))}
        {series.map((s) => {
          const line = s.points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ')
          const area = `${line} L ${x(n - 1)} ${baseY} L ${x(0)} ${baseY} Z`
          return (
            <g key={s.name}>
              <path d={area} fill={s.color} opacity={0.1} />
              <path d={line} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
              {s.points.map((v, i) => (
                <circle key={i} cx={x(i)} cy={y(v)} r={3} fill="var(--color-surface)" stroke={s.color} strokeWidth={2}>
                  <title>{`${labels[i]} · ${s.name}: ${fmt(v)}`}</title>
                </circle>
              ))}
            </g>
          )
        })}
        {labels.map((l, i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize={9} fontWeight={600} fill="var(--color-ink-muted)">{l}</text>
        ))}
      </svg>
      {series.length > 1 && (
        <div className="flex items-center gap-4 justify-center mt-1">
          {series.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-secondary">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />{s.name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Donut / pie chart with legend and centre total. */
export function DonutChart({
  data, size = 168, thickness = 24, centerLabel,
}: {
  data: Slice[]
  size?: number
  thickness?: number
  centerLabel?: string
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const r = (size - thickness) / 2
  const c = size / 2
  const circ = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="flex items-center gap-5 flex-wrap">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          {total === 0 && <circle cx={c} cy={c} r={r} fill="none" stroke="var(--color-surface-soft)" strokeWidth={thickness} />}
          {data.map((d, i) => {
            if (d.value === 0) return null
            const len = (d.value / total) * circ
            const el = (
              <circle key={i} cx={c} cy={c} r={r} fill="none" stroke={d.color} strokeWidth={thickness}
                strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-offset} strokeLinecap="butt">
                <title>{`${d.label}: ${d.value}`}</title>
              </circle>
            )
            offset += len
            return el
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-[22px] font-extrabold text-ink tabular-nums leading-none">{total}</div>
            {centerLabel && <div className="text-[9px] font-bold text-ink-muted mt-1">{centerLabel}</div>}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 flex-1 min-w-[120px]">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-[12px]">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="font-semibold text-ink-secondary">{d.label}</span>
            <span className="ml-auto font-extrabold tabular-nums text-ink">{d.value}</span>
            <span className="text-ink-muted font-semibold text-[10.5px] tabular-nums w-9 text-right">{total ? Math.round((d.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyChart({ height }: { height: number }) {
  return <div className="w-full grid place-items-center text-[11.5px] font-semibold text-ink-muted" style={{ height }}>—</div>
}