import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Printer, TrendUp, Wallet, Bank, FileText } from '@phosphor-icons/react'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../lib/toast'
import { useStudents } from '../../lib/services/students'
import { useEnrollments } from '../../lib/services/dashboard'
import { useFinance } from '../../lib/services/finance'
import { useBranches } from '../../lib/services/catalog'
import { Dropdown } from '../../components/ui/Dropdown'
import { BarChart, HBarChart, LineChart, DonutChart } from '../../components/ui/Charts'
import { printReport } from '../../lib/print'
import type { PrintColumn } from '../../lib/print'
import { formatMoney, formatCompact, formatDate } from '../../lib/format'

type Period = 'week' | 'month' | 'year' | 'all' | 'custom'
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY = 864e5

function periodRange(p: Period, from: string, to: string, earliest: number): { start: number; end: number } {
  const now = Date.now(); const n = new Date()
  if (p === 'week') return { start: now - 7 * DAY, end: now }
  if (p === 'month') return { start: new Date(n.getFullYear(), n.getMonth(), 1).getTime(), end: now }
  if (p === 'year') return { start: new Date(n.getFullYear(), 0, 1).getTime(), end: now }
  if (p === 'custom') return { start: from ? new Date(from + 'T00:00:00').getTime() : earliest, end: to ? new Date(to + 'T23:59:59').getTime() : now }
  return { start: earliest, end: now }
}

interface Bucket { label: string; start: number; end: number }
function makeBuckets(start: number, end: number): Bucket[] {
  const span = end - start
  const out: Bucket[] = []
  if (span <= 0) return out
  const multiYear = new Date(start).getFullYear() !== new Date(end).getFullYear()
  if (span <= 8 * DAY) {
    for (let t = start; t < end; t += DAY) { const d = new Date(t); out.push({ start: t, end: t + DAY, label: `${d.getDate()} ${MON[d.getMonth()]}` }) }
  } else if (span <= 80 * DAY) {
    for (let t = start; t < end; t += 7 * DAY) { const d = new Date(t); out.push({ start: t, end: t + 7 * DAY, label: `${d.getDate()} ${MON[d.getMonth()]}` }) }
  } else {
    const d = new Date(new Date(start).getFullYear(), new Date(start).getMonth(), 1)
    while (d.getTime() < end) {
      const ns = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      out.push({ start: d.getTime(), end: ns.getTime(), label: multiYear ? `${MON[d.getMonth()]} '${String(d.getFullYear()).slice(2)}` : MON[d.getMonth()] })
      d.setMonth(d.getMonth() + 1)
    }
  }
  return out.length > 18 ? out.slice(out.length - 18) : out
}

export default function Reports() {
  const { profile } = useAuth()
  const { t } = useI18n()
  const toast = useToast()
  const role = profile?.role ?? 'admin'
  const isAdmin = role === 'admin'
  const { students } = useStudents(role, profile?.branchId ?? null)
  const { enrollments } = useEnrollments(role, profile?.branchId ?? null)
  const { branches } = useBranches()
  const [branchId, setBranchId] = useState('all')
  const [period, setPeriod] = useState<Period>('year')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  // statements have their OWN registration-date filter, independent of the charts period
  const [sPeriod, setSPeriod] = useState<Period>('all')
  const [sFrom, setSFrom] = useState('')
  const [sTo, setSTo] = useState('')

  const earliest = useMemo(() => (students.length ? Math.min(...students.map((s) => s.createdAt)) : Date.now() - 180 * DAY), [students])
  const range = periodRange(period, from, to, earliest)
  const buckets = useMemo(() => makeBuckets(range.start, range.end), [range.start, range.end])
  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? '—'
  const selectedBranchName = branchId === 'all' ? undefined : branchName(branchId)
  const scopeBranchId = isAdmin && branchId !== 'all' ? branchId : null

  const enrollByStudent = useMemo(() => {
    const m = new Map<string, (typeof enrollments)[number]>()
    enrollments.forEach((e) => { const cur = m.get(e.studentId); if (!cur || e.createdAt > cur.createdAt) m.set(e.studentId, e) })
    return m
  }, [enrollments])
  const scoped = useMemo(() => (scopeBranchId ? students.filter((s) => s.branchId === scopeBranchId) : students), [students, scopeBranchId])
  const sRange = periodRange(sPeriod, sFrom, sTo, earliest)
  const scopedInRange = useMemo(() => scoped.filter((s) => s.createdAt >= sRange.start && s.createdAt <= sRange.end), [scoped, sRange.start, sRange.end])
  const rangeLabel = sPeriod === 'all' ? '' : ` · ${formatDate(sRange.start)} – ${formatDate(sRange.end)}`

  // ---- chart datasets ----
  const regData = useMemo(
    () => buckets.map((b) => ({ label: b.label, value: scoped.filter((s) => s.createdAt >= b.start && s.createdAt < b.end).length })),
    [buckets, scoped]
  )
  const statusData = useMemo(() => {
    let paid = 0, owing = 0, dropped = 0
    scoped.forEach((s) => { const e = enrollByStudent.get(s.id); if (!e) return; if (e.status === 'dropped') dropped++; else if (e.balance > 0) owing++; else paid++ })
    return [
      { label: t('reports.statusPaid'), value: paid, color: 'var(--color-success)' },
      { label: t('reports.statusOwing'), value: owing, color: 'var(--color-warning)' },
      { label: t('reports.statusDropped'), value: dropped, color: 'var(--color-ink-muted)' },
    ]
  }, [scoped, enrollByStudent, t])
  const courseData = useMemo(() => {
    const counts = new Map<string, number>()
    scoped.forEach((s) => { const e = enrollByStudent.get(s.id); if (e) counts.set(e.courseName, (counts.get(e.courseName) ?? 0) + 1) })
    return [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6)
  }, [scoped, enrollByStudent])
  const branchData = useMemo(
    () => branches.map((b) => ({ label: b.name, value: students.filter((s) => s.branchId === b.id).length })).sort((a, b) => b.value - a.value),
    [branches, students]
  )

  // ---- statements (printable, filtered) ----
  const meta = () => ({ generatedLabel: t('reports.generated'), countLabel: t('reports.countLabel'), totalLabel: t('reports.totalLabel'), branchLabel: t('reports.colBranch'), branch: selectedBranchName })
  const statusText = (dropped: boolean, balance: number) => (dropped ? t('reports.statusDropped') : balance <= 0 ? t('reports.statusPaid') : t('reports.statusOwing'))
  const guard = (ok: boolean) => { if (!ok) toast.error(t('reports.popupBlocked')) }

  function printAllStudents() {
    const columns: PrintColumn[] = [{ key: '_n', label: t('reports.colNo') }, { key: 'reg', label: t('reports.colReg') }, { key: 'name', label: t('reports.colName') }, { key: 'gender', label: t('reports.colGender') }, { key: 'phone', label: t('reports.colPhone') }, { key: 'branch', label: t('reports.colBranch') }, { key: 'course', label: t('reports.colCourse') }]
    const rows = scopedInRange.map((s) => { const e = enrollByStudent.get(s.id); return { reg: s.regNo, name: s.fullName, gender: s.gender, phone: s.phone, branch: s.branchName, course: e?.courseName ?? '—' } })
    guard(printReport({ title: t('reports.allStudents') + rangeLabel, columns, rows, meta: meta() }))
  }
  function printOutstanding() {
    const columns: PrintColumn[] = [{ key: '_n', label: t('reports.colNo') }, { key: 'reg', label: t('reports.colReg') }, { key: 'name', label: t('reports.colName') }, { key: 'course', label: t('reports.colCourse') }, { key: 'total', label: t('reports.colTotal'), align: 'right' }, { key: 'paid', label: t('reports.colPaid'), align: 'right' }, { key: 'balance', label: t('reports.colBalance'), align: 'right' }]
    let st = 0, sp = 0, sb = 0
    const rows = scopedInRange.map((s) => ({ s, e: enrollByStudent.get(s.id) })).filter(({ e }) => e && e.status !== 'dropped' && e.balance > 0)
      .map(({ s, e }) => { const total = e!.totalDue, balance = e!.balance, paid = total - balance; st += total; sp += paid; sb += balance; return { reg: s.regNo, name: s.fullName, course: e!.courseName, total: `TSh ${formatMoney(total)}`, paid: `TSh ${formatMoney(paid)}`, balance: `TSh ${formatMoney(balance)}` } })
    guard(printReport({ title: t('reports.outstanding') + rangeLabel, columns, rows, totals: { total: `TSh ${formatMoney(st)}`, paid: `TSh ${formatMoney(sp)}`, balance: `TSh ${formatMoney(sb)}` }, meta: meta() }))
  }
  function printFinished() {
    const columns: PrintColumn[] = [{ key: '_n', label: t('reports.colNo') }, { key: 'reg', label: t('reports.colReg') }, { key: 'name', label: t('reports.colName') }, { key: 'branch', label: t('reports.colBranch') }, { key: 'course', label: t('reports.colCourse') }, { key: 'status', label: t('reports.colStatus') }]
    const rows = scopedInRange.map((s) => ({ s, e: enrollByStudent.get(s.id) })).filter(({ e }) => e?.finished).map(({ s, e }) => ({ reg: s.regNo, name: s.fullName, branch: s.branchName, course: e!.courseName, status: statusText(false, e!.balance) }))
    guard(printReport({ title: t('reports.finishedReport') + rangeLabel, columns, rows, meta: meta() }))
  }
  function printByMonth() {
    const inRange = scopedInRange
    const counts = new Map<string, number>()
    inRange.forEach((s) => { const d = new Date(s.createdAt); const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; counts.set(k, (counts.get(k) ?? 0) + 1) })
    const columns: PrintColumn[] = [{ key: '_n', label: t('reports.colNo') }, { key: 'month', label: t('reports.colMonth') }, { key: 'count', label: t('reports.count'), align: 'right' }]
    const rows = [...counts.entries()].sort().map(([k, v]) => { const [y, m] = k.split('-'); return { month: `${MON[Number(m) - 1]} ${y}`, count: String(v) } })
    guard(printReport({ title: t('reports.byMonth') + rangeLabel, columns, rows, totals: { count: String(inRange.length) }, meta: meta() }))
  }

  const statements = [
    { title: t('reports.allStudents'), count: scopedInRange.length, action: printAllStudents },
    { title: t('reports.outstanding'), count: scopedInRange.filter((s) => { const e = enrollByStudent.get(s.id); return e && e.status !== 'dropped' && e.balance > 0 }).length, action: printOutstanding },
    { title: t('reports.finishedReport'), count: scopedInRange.filter((s) => enrollByStudent.get(s.id)?.finished).length, action: printFinished },
    { title: t('reports.byMonth'), count: scopedInRange.length, action: printByMonth },
  ]

  const periods: { key: Period; label: string }[] = [{ key: 'week', label: t('reports.week') }, { key: 'month', label: t('reports.month') }, { key: 'year', label: t('reports.year') }, { key: 'all', label: t('reports.all') }, { key: 'custom', label: t('reports.custom') }]
  const sTabs: { key: Period; label: string }[] = [{ key: 'all', label: t('reports.all') }, { key: 'month', label: t('reports.month') }, { key: 'year', label: t('reports.year') }, { key: 'custom', label: t('reports.custom') }]
  const dateInput = 'text-[12.5px] font-semibold text-ink bg-surface-soft rounded-md py-2 px-3 outline-none focus:bg-surface focus:shadow-[0_0_0_3px_rgba(23,23,23,0.07),inset_0_0_0_1.5px_rgba(23,23,23,0.12)]'

  return (
    <div className="p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div><h1 className="text-[19px] font-extrabold tracking-[-0.3px]">{t('reports.title')}</h1><p className="text-[12.5px] text-ink-secondary mt-1">{t('reports.subtitle')}</p></div>
        {isAdmin && branches.length > 0 && (<div className="w-[190px]"><Dropdown value={branchId} onChange={setBranchId} options={[{ value: 'all', label: t('payments.allBranches') }, ...branches.map((b) => ({ value: b.id, label: b.name }))]} /></div>)}
      </div>

      {/* analytics — admin only. Agents get statements only. */}
      {isAdmin && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="text-[11px] font-bold text-ink-muted">{t('reports.period')}</span>
            <div className="inline-flex bg-surface-soft rounded-[20px] p-1">{periods.map((p) => (<button key={p.key} onClick={() => setPeriod(p.key)} className={`px-3.5 py-1.5 rounded-[16px] text-[12px] font-bold transition ${period === p.key ? 'bg-surface text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]' : 'text-ink-muted hover:text-ink'}`}>{p.label}</button>))}</div>
            {period === 'custom' && (<div className="flex items-center gap-2"><span className="text-[11px] font-bold text-ink-muted">{t('reports.from')}</span><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={dateInput} /><span className="text-[11px] font-bold text-ink-muted">{t('reports.to')}</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={dateInput} /></div>)}
          </div>

          <FinancialKpis start={range.start} end={range.end} buckets={buckets} branchId={scopeBranchId} />

          <SectionLabel>{t('reports.overview')}</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title={t('reports.registrations')}><BarChart data={regData} color="var(--color-ink)" /></ChartCard>
            <ChartCard title={t('reports.paymentStatus')} caption={t('reports.snapshot')}><div className="py-2"><DonutChart data={statusData} centerLabel={t('reports.studentsWord')} /></div></ChartCard>
            <ChartCard title={t('reports.topCourses')} caption={t('reports.snapshot')}><HBarChart data={courseData} color="var(--color-accent-purple)" /></ChartCard>
            {branches.length > 1 && <ChartCard title={t('reports.perBranch')} caption={t('reports.snapshot')}><HBarChart data={branchData} color="var(--color-accent-blue)" /></ChartCard>}
          </div>
        </>
      )}

      {/* statements */}
      <SectionLabel>{t('reports.statements')}</SectionLabel>
      <p className="text-[12px] text-ink-secondary -mt-1.5 mb-3">{t('reports.statementsHint')}</p>

      {/* statements-only registration-date filter */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span className="text-[11px] font-bold text-ink-muted">{t('reports.dateFilter')}</span>
        <div className="inline-flex bg-surface-soft rounded-[20px] p-1">
          {sTabs.map((p) => (
            <button key={p.key} onClick={() => setSPeriod(p.key)} className={`px-3.5 py-1.5 rounded-[16px] text-[12px] font-bold transition ${sPeriod === p.key ? 'bg-surface text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]' : 'text-ink-muted hover:text-ink'}`}>{p.label}</button>
          ))}
        </div>
        {sPeriod === 'custom' && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-ink-muted">{t('reports.from')}</span>
            <input type="date" value={sFrom} onChange={(e) => setSFrom(e.target.value)} className={dateInput} />
            <span className="text-[11px] font-bold text-ink-muted">{t('reports.to')}</span>
            <input type="date" value={sTo} onChange={(e) => setSTo(e.target.value)} className={dateInput} />
          </div>
        )}
        {sPeriod !== 'all' && <span className="text-[11px] font-semibold text-ink-muted tabular-nums">{formatDate(sRange.start)} – {formatDate(sRange.end)}</span>}
      </div>

      <div className="bg-surface rounded-[18px] shadow-soft divide-y divide-hair">
        {statements.map((s) => (
          <StatementRow key={s.title} title={s.title} count={s.count} onPrint={s.action} />
        ))}
      </div>

      {isAdmin && <FinancialStatements start={sRange.start} end={sRange.end} rangeLabel={rangeLabel} branchId={scopeBranchId} branchLabel={selectedBranchName} />}
    </div>
  )
}

/* ---------- admin-only finance (subscribes to payments + expenses) ---------- */

function FinancialKpis({ start, end, buckets, branchId }: { start: number; end: number; buckets: Bucket[]; branchId: string | null }) {
  const { t } = useI18n()
  const { payments, expenses, totalBalance, sumIn } = useFinance()
  const { income, expenses: spent, profit } = sumIn(start, end, branchId)

  const incomeSeries = buckets.map((b) => payments.filter((p) => p.createdAt >= b.start && p.createdAt < b.end && (!branchId || p.branchId === branchId)).reduce((s, p) => s + p.amount, 0))
  const expenseSeries = buckets.map((b) => expenses.filter((e) => e.createdAt >= b.start && e.createdAt < b.end && (!branchId || e.branchId === branchId)).reduce((s, e) => s + e.amount, 0))

  const stat = [
    { label: t('reports.income'), value: income, cls: 'bg-accent-blue', Icon: TrendUp },
    { label: t('reports.expenses'), value: spent, cls: 'bg-accent-purple', Icon: Wallet },
    { label: t('reports.profit'), value: profit, cls: profit >= 0 ? 'bg-accent-yellow' : 'bg-[rgba(201,71,71,0.14)]', Icon: TrendUp },
    { label: t('reports.totalBalance'), value: totalBalance, cls: 'bg-primary', dark: true, Icon: Bank },
  ]
  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stat.map((s) => (
          <div key={s.label} className={`rounded-[18px] p-[18px] min-h-[92px] flex flex-col justify-between relative ${s.cls}`}>
            <div className={`text-[12px] font-bold ${s.dark ? 'text-white/70' : 'text-black/[0.62]'}`}>{s.label}</div>
            <div className={`text-[22px] font-extrabold tracking-[-0.5px] ${s.dark ? 'text-on-primary' : 'text-ink'}`}><small className={`text-[12px] font-bold mr-0.5 ${s.dark ? 'text-white/60' : 'text-black/[0.55]'}`}>TSh</small>{formatCompact(s.value)}</div>
            <div className={`absolute right-4 top-4 w-[28px] h-[28px] rounded-full grid place-items-center ${s.dark ? 'bg-white/15 text-white' : 'bg-white/70 text-ink'}`}><s.Icon size={14} /></div>
          </div>
        ))}
      </div>
      <div className="mt-4"><ChartCard title={t('reports.cashflow')}><LineChart labels={buckets.map((b) => b.label)} series={[{ name: t('reports.income'), color: 'var(--color-success)', points: incomeSeries }, { name: t('reports.expenses'), color: 'var(--color-danger)', points: expenseSeries }]} formatValue={(n: number) => `TSh ${formatCompact(n)}`} /></ChartCard></div>
    </div>
  )
}

function FinancialStatements({ start, end, rangeLabel, branchId, branchLabel }: { start: number; end: number; rangeLabel?: string; branchId: string | null; branchLabel?: string }) {
  const rl = rangeLabel ?? ''
  const { t } = useI18n()
  const toast = useToast()
  const { expenses, sumIn } = useFinance()
  const guard = (ok: boolean) => { if (!ok) toast.error(t('reports.popupBlocked')) }
  const meta = () => ({ generatedLabel: t('reports.generated'), countLabel: t('reports.countLabel'), totalLabel: t('reports.totalLabel'), branchLabel: t('reports.colBranch'), branch: branchLabel })
  const { income, expenses: spent, profit } = sumIn(start, end, branchId)

  function printProfit() {
    const columns: PrintColumn[] = [{ key: 'item', label: t('reports.financial') }, { key: 'amount', label: t('exp.colAmount'), align: 'right' }]
    const rows = [{ item: t('reports.income'), amount: `TSh ${formatMoney(income)}` }, { item: t('reports.expenses'), amount: `TSh ${formatMoney(spent)}` }, { item: t('reports.profit'), amount: `TSh ${formatMoney(profit)}` }]
    guard(printReport({ title: t('reports.profitReport') + rl, columns, rows, meta: meta() }))
  }
  function printExpenses() {
    const inRange = expenses.filter((e) => e.createdAt >= start && e.createdAt <= end && (!branchId || e.branchId === branchId)).sort((a, b) => b.createdAt - a.createdAt)
    const columns: PrintColumn[] = [{ key: '_n', label: t('reports.colNo') }, { key: 'date', label: t('exp.colDate') }, { key: 'title', label: t('exp.colTitle') }, { key: 'category', label: t('exp.colCategory') }, { key: 'amount', label: t('exp.colAmount'), align: 'right' }]
    let sum = 0
    const rows = inRange.map((e) => { sum += e.amount; return { date: formatDate(e.createdAt), title: e.title, category: e.category, amount: `TSh ${formatMoney(e.amount)}` } })
    guard(printReport({ title: t('reports.expensesReport') + rl, columns, rows, totals: { amount: `TSh ${formatMoney(sum)}` }, meta: meta() }))
  }

  const rows = [
    { title: t('reports.profitReport'), value: `TSh ${formatCompact(profit)}`, action: printProfit },
    { title: t('reports.expensesReport'), value: `TSh ${formatCompact(spent)}`, action: printExpenses },
  ]
  return (
    <>
      <SectionLabel>{t('reports.financialStatements')}</SectionLabel>
      <div className="bg-surface rounded-[18px] shadow-soft divide-y divide-hair">
        {rows.map((r) => (
          <div key={r.title} className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-9 h-9 rounded-[10px] bg-surface-soft grid place-items-center text-ink-secondary shrink-0"><FileText size={17} /></div>
            <div className="min-w-0 flex-1"><div className="font-bold text-[13px] truncate">{r.title}</div><div className="text-[11px] text-ink-muted font-semibold tabular-nums">{r.value}</div></div>
            <button onClick={r.action} className="inline-flex items-center gap-1.5 bg-surface-soft hover:bg-hover rounded-[20px] px-4 py-2 text-[12px] font-bold text-ink-secondary transition"><Printer size={14} /> {t('reports.print')}</button>
          </div>
        ))}
      </div>
    </>
  )
}

/* ---------- small building blocks ---------- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-bold text-ink-muted tracking-wide mb-3 mt-7">{String(children).toUpperCase()}</div>
}

function ChartCard({ title, caption, children }: { title: string; caption?: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="bg-surface rounded-[18px] shadow-soft p-5">
      <div className="flex items-center justify-between mb-4"><div className="font-extrabold text-[13.5px]">{title}</div>{caption && <div className="text-[10px] font-bold text-ink-muted bg-surface-soft rounded-full px-2 py-0.5">{caption}</div>}</div>
      {children}
    </motion.div>
  )
}

function StatementRow({ title, count, onPrint }: { title: string; count: number; onPrint: () => void }) {
  const { t } = useI18n()
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="w-9 h-9 rounded-[10px] bg-surface-soft grid place-items-center text-ink-secondary shrink-0"><FileText size={17} /></div>
      <div className="min-w-0 flex-1"><div className="font-bold text-[13px] truncate">{title}</div><div className="text-[11px] text-ink-muted font-semibold">{count} {t('reports.count')}</div></div>
      <button onClick={onPrint} disabled={count === 0} className="inline-flex items-center gap-1.5 bg-surface-soft hover:bg-hover rounded-[20px] px-4 py-2 text-[12px] font-bold text-ink-secondary transition disabled:opacity-40"><Printer size={14} /> {t('reports.print')}</button>
    </div>
  )
}