import { CheckCircle, Clock, Prohibit } from '@phosphor-icons/react'

type Kind = 'paid' | 'due' | 'dropped'

export function StatusBadge({ kind, label }: { kind: Kind; label: string }) {
  const map = {
    paid: { Icon: CheckCircle, cls: 'bg-[rgba(88,166,108,0.13)] text-success' },
    due: { Icon: Clock, cls: 'bg-[rgba(229,154,53,0.14)] text-warning' },
    dropped: { Icon: Prohibit, cls: 'bg-black/[0.05] text-ink-muted' },
  } as const
  const { Icon, cls } = map[kind]
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold px-2.5 py-1 rounded-full ${cls}`}>
      <Icon size={14} weight="fill" />
      {label}
    </span>
  )
}