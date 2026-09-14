import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { MagnifyingGlass, DownloadSimple, Wallet, Receipt, CalendarBlank } from '@phosphor-icons/react'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../lib/i18n'
import { usePayments } from '../../lib/services/payments'
import { useBranches } from '../../lib/services/catalog'
import { Avatar } from '../../components/ui/Avatar'
import { Dropdown } from '../../components/ui/Dropdown'
import { Skeleton } from '../../components/ui/skeleton'
import { formatMoney, formatCompact, formatDate } from '../../lib/format'

type Range = 'all' | 'today' | 'week' | 'month'

function rangeStart(r: Range): number {
  const now = new Date()
  if (r === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  if (r === 'week') return now.getTime() - 7 * 24 * 60 * 60 * 1000
  if (r === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  return 0
}

export default function Payments() {
  const { profile } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const role = profile?.role ?? 'admin'
  const isAdmin = role === 'admin'
  const { payments, loading } = usePayments(role, profile?.branchId ?? null)
  const { branches } = useBranches()

  const [range, setRange] = useState<Range>('all')
  const [search, setSearch] = useState('')
  const [branchId, setBranchId] = useState('all')

  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? '—'

  const filtered = useMemo(() => {
    const start = rangeStart(range)
    const q = search.trim().toLowerCase()
    return payments.filter((p) => {
      if (p.createdAt < start) return false
      if (isAdmin && branchId !== 'all' && p.branchId !== branchId) return false
      if (q && !(p.studentName.toLowerCase().includes(q) || p.bankRef.toLowerCase().includes(q))) return false
      return true
    })
  }, [payments, range, search, branchId, isAdmin])

  const total = filtered.reduce((s, p) => s + p.amount, 0)
  const todayStart = rangeStart('today')
  const todayTotal = payments.filter((p) => p.createdAt >= todayStart).reduce((s, p) => s + p.amount, 0)

  const ranges: { key: Range; label: string }[] = [
    { key: 'all', label: t('payments.all') },
    { key: 'today', label: t('payments.today') },
    { key: 'week', label: t('payments.week') },
    { key: 'month', label: t('payments.month') },
  ]

  function exportCsv() {
    const header = ['Date', 'Student', 'Branch', 'Installment', 'Receipt', 'Amount']
    const rows = filtered.map((p) => [formatDate(p.createdAt), p.studentName, branchName(p.branchId), p.period, p.bankRef, String(p.amount)])
    const csv = [header, ...rows].map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hkm-payments-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[19px] font-extrabold tracking-[-0.3px]">{t('payments.title')}</h1>
          <p className="text-[12.5px] text-ink-secondary mt-1">{t('payments.subtitle')}</p>
        </div>
        <button onClick={exportCsv} disabled={filtered.length === 0} className="inline-flex items-center gap-1.5 bg-surface-soft hover:bg-[#EEE] rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold text-ink-secondary transition disabled:opacity-40">
          <DownloadSimple size={15} /> {t('payments.export')}
        </button>
      </div>

      {/* summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <StatCard tone="yellow" Icon={Wallet} label={t('payments.collected')} value={loading ? null : `TSh ${formatCompact(total)}`} />
        <StatCard tone="blue" Icon={Receipt} label={t('payments.count')} value={loading ? null : String(filtered.length)} />
        <StatCard tone="purple" Icon={CalendarBlank} label={t('payments.todayCollected')} value={loading ? null : `TSh ${formatCompact(todayTotal)}`} />
      </div>

      {/* controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="inline-flex bg-surface-soft rounded-[20px] p-1">
          {ranges.map((r) => (
            <button key={r.key} onClick={() => setRange(r.key)} className={`px-3.5 py-1.5 rounded-[16px] text-[12px] font-bold transition ${range === r.key ? 'bg-white text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]' : 'text-ink-muted hover:text-ink'}`}>
              {r.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('payments.search')}
            className="w-full text-[13px] font-medium text-ink bg-surface-soft rounded-md py-2.5 pl-10 pr-3.5 outline-none transition placeholder:text-ink-muted focus:bg-white focus:shadow-[0_0_0_3px_rgba(23,23,23,0.07),inset_0_0_0_1.5px_rgba(23,23,23,0.12)]" />
        </div>

        {isAdmin && branches.length > 0 && (
          <div className="w-[180px]">
            <Dropdown value={branchId} onChange={setBranchId}
              options={[{ value: 'all', label: t('payments.allBranches') }, ...branches.map((b) => ({ value: b.id, label: b.name }))]} />
          </div>
        )}
      </div>

      {/* table */}
      <div className="bg-surface rounded-[18px] shadow-soft px-1 py-1.5">
        {loading ? (
          <div className="p-4 flex flex-col gap-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-40" /><Skeleton className="h-4 w-24 ml-auto" /></div>
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-surface-soft grid place-items-center mx-auto text-ink-muted mb-3"><Wallet size={24} /></div>
            <div className="font-extrabold text-[15px]">{t('payments.empty')}</div>
            <div className="text-[12.5px] text-ink-secondary mt-1">{t('payments.emptyHint')}</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center text-[13px] text-ink-muted font-semibold">{t('payments.noResults')}</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-[10.5px] font-bold text-ink-muted px-4 pt-3 pb-2.5">{t('dash.colStudent')}</th>
                {isAdmin && <th className="text-left text-[10.5px] font-bold text-ink-muted px-4 pt-3 pb-2.5">{t('dash.colBranch')}</th>}
                <th className="text-left text-[10.5px] font-bold text-ink-muted px-4 pt-3 pb-2.5">{t('payments.colInstallment')}</th>
                <th className="text-left text-[10.5px] font-bold text-ink-muted px-4 pt-3 pb-2.5">{t('payments.colReceipt')}</th>
                <th className="text-left text-[10.5px] font-bold text-ink-muted px-4 pt-3 pb-2.5">{t('payments.colDate')}</th>
                <th className="text-right text-[10.5px] font-bold text-ink-muted px-4 pt-3 pb-2.5 pr-5">{t('payments.colAmount')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => navigate(`/students/${p.studentId}`)}
                  className={`cursor-pointer hover:bg-surface-soft transition ${i === 0 ? '' : 'border-t border-[#F1F1F1]'}`}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={p.studentName} size={30} />
                      <span className="font-bold text-[12.5px]">{p.studentName}</span>
                    </div>
                  </td>
                  {isAdmin && <td className="px-4 py-2.5 text-[12.5px] text-ink-secondary">{branchName(p.branchId)}</td>}
                  <td className="px-4 py-2.5 text-[12.5px] text-ink-secondary">{p.period}</td>
                  <td className="px-4 py-2.5 text-[12px] text-ink-muted font-semibold tabular-nums">#{p.bankRef}</td>
                  <td className="px-4 py-2.5 text-[12.5px] text-ink-secondary tabular-nums">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-2.5 text-right pr-5 font-extrabold text-[12.5px] tabular-nums text-success">+TSh {formatMoney(p.amount)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({ tone, Icon, label, value }: {
  tone: 'yellow' | 'blue' | 'purple'; Icon: React.ComponentType<{ size?: number }>; label: string; value: string | null
}) {
  const bg = { yellow: 'bg-accent-yellow', blue: 'bg-accent-blue', purple: 'bg-accent-purple' }[tone]
  return (
    <div className={`relative rounded-[18px] p-[18px] min-h-[96px] flex flex-col justify-between ${bg}`}>
      <div className="text-[12px] font-bold text-black/[0.62]">{label}</div>
      {value === null ? <Skeleton className="h-7 w-24 bg-black/10" /> : <div className="text-[24px] font-extrabold tracking-[-0.5px] text-ink">{value}</div>}
      <div className="absolute right-4 top-4 w-[30px] h-[30px] rounded-full bg-white/70 grid place-items-center text-ink"><Icon size={15} /></div>
    </div>
  )
}