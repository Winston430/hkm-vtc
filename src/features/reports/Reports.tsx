import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Printer, Users, ClockCountdown, GraduationCap } from '@phosphor-icons/react'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../lib/toast'
import { useStudents } from '../../lib/services/students'
import { useEnrollments } from '../../lib/services/dashboard'
import { useBranches } from '../../lib/services/catalog'
import { Dropdown } from '../../components/ui/Dropdown'
import { printReport } from '../../lib/print'
import type { PrintColumn } from '../../lib/print'
import { formatMoney } from '../../lib/format'

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

  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? '—'
  const selectedBranchName = branchId === 'all' ? undefined : branchName(branchId)

  // latest enrollment per student
  const enrollByStudent = useMemo(() => {
    const m = new Map<string, (typeof enrollments)[number]>()
    enrollments.forEach((e) => {
      const cur = m.get(e.studentId)
      if (!cur || e.createdAt > cur.createdAt) m.set(e.studentId, e)
    })
    return m
  }, [enrollments])

  const scoped = useMemo(
    () => (isAdmin && branchId !== 'all' ? students.filter((s) => s.branchId === branchId) : students),
    [students, isAdmin, branchId]
  )

  const meta = () => ({
    generatedLabel: t('reports.generated'),
    countLabel: t('reports.countLabel'),
    totalLabel: t('reports.totalLabel'),
    branchLabel: t('reports.colBranch'),
    branch: selectedBranchName,
  })

  function statusText(dropped: boolean, balance: number) {
    if (dropped) return t('reports.statusDropped')
    return balance <= 0 ? t('reports.statusPaid') : t('reports.statusOwing')
  }

  function guard(ok: boolean) {
    if (!ok) toast.error(t('reports.popupBlocked'))
  }

  function printAllStudents() {
    const columns: PrintColumn[] = [
      { key: '_n', label: t('reports.colNo') },
      { key: 'reg', label: t('reports.colReg') },
      { key: 'name', label: t('reports.colName') },
      { key: 'gender', label: t('reports.colGender') },
      { key: 'phone', label: t('reports.colPhone') },
      { key: 'branch', label: t('reports.colBranch') },
      { key: 'course', label: t('reports.colCourse') },
    ]
    const rows = scoped.map((s) => {
      const e = enrollByStudent.get(s.id)
      return { reg: s.regNo, name: s.fullName, gender: s.gender, phone: s.phone, branch: s.branchName, course: e?.courseName ?? '—' }
    })
    guard(printReport({ title: t('reports.allStudents'), columns, rows, meta: meta() }))
  }

  function printOutstanding() {
    const columns: PrintColumn[] = [
      { key: '_n', label: t('reports.colNo') },
      { key: 'reg', label: t('reports.colReg') },
      { key: 'name', label: t('reports.colName') },
      { key: 'course', label: t('reports.colCourse') },
      { key: 'total', label: t('reports.colTotal'), align: 'right' },
      { key: 'paid', label: t('reports.colPaid'), align: 'right' },
      { key: 'balance', label: t('reports.colBalance'), align: 'right' },
    ]
    let sumTotal = 0, sumPaid = 0, sumBal = 0
    const rows = scoped
      .map((s) => ({ s, e: enrollByStudent.get(s.id) }))
      .filter(({ e }) => e && e.status !== 'dropped' && e.balance > 0)
      .map(({ s, e }) => {
        const total = e!.totalDue, balance = e!.balance, paid = total - balance
        sumTotal += total; sumPaid += paid; sumBal += balance
        return { reg: s.regNo, name: s.fullName, course: e!.courseName, total: `TSh ${formatMoney(total)}`, paid: `TSh ${formatMoney(paid)}`, balance: `TSh ${formatMoney(balance)}` }
      })
    const totals = { total: `TSh ${formatMoney(sumTotal)}`, paid: `TSh ${formatMoney(sumPaid)}`, balance: `TSh ${formatMoney(sumBal)}` }
    guard(printReport({ title: t('reports.outstanding'), columns, rows, totals, meta: meta() }))
  }

  function printStudentsCourses() {
    const columns: PrintColumn[] = [
      { key: '_n', label: t('reports.colNo') },
      { key: 'reg', label: t('reports.colReg') },
      { key: 'name', label: t('reports.colName') },
      { key: 'branch', label: t('reports.colBranch') },
      { key: 'course', label: t('reports.colCourse') },
      { key: 'status', label: t('reports.colStatus') },
    ]
    const rows = scoped.map((s) => {
      const e = enrollByStudent.get(s.id)
      return { reg: s.regNo, name: s.fullName, branch: s.branchName, course: e?.courseName ?? '—', status: statusText(e?.status === 'dropped', e?.balance ?? 0) }
    })
    guard(printReport({ title: t('reports.studentsCourses'), columns, rows, meta: meta() }))
  }

  const owingCount = scoped.filter((s) => {
    const e = enrollByStudent.get(s.id)
    return e && e.status !== 'dropped' && e.balance > 0
  }).length

  const cards = [
    { Icon: Users, title: t('reports.allStudents'), desc: t('reports.allStudentsDesc'), count: scoped.length, action: printAllStudents },
    { Icon: ClockCountdown, title: t('reports.outstanding'), desc: t('reports.outstandingDesc'), count: owingCount, action: printOutstanding },
    { Icon: GraduationCap, title: t('reports.studentsCourses'), desc: t('reports.studentsCoursesDesc'), count: scoped.length, action: printStudentsCourses },
  ]

  return (
    <div className="p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[19px] font-extrabold tracking-[-0.3px]">{t('reports.title')}</h1>
          <p className="text-[12.5px] text-ink-secondary mt-1">{t('reports.subtitle')}</p>
        </div>
        {isAdmin && branches.length > 0 && (
          <div className="w-[190px]">
            <Dropdown value={branchId} onChange={setBranchId}
              options={[{ value: 'all', label: t('payments.allBranches') }, ...branches.map((b) => ({ value: b.id, label: b.name }))]} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.04 }}
            className="bg-surface rounded-[18px] shadow-soft p-5 flex flex-col">
            <div className="w-[42px] h-[42px] rounded-[12px] bg-surface-soft grid place-items-center text-ink-secondary"><c.Icon size={22} /></div>
            <div className="font-extrabold text-[15px] mt-3.5">{c.title}</div>
            <div className="text-[12px] text-ink-secondary mt-1 flex-1">{c.desc}</div>
            <div className="text-[11px] text-ink-muted font-bold mt-3">{c.count} {t('reports.count')}</div>
            <button onClick={c.action} disabled={c.count === 0}
              className="mt-4 inline-flex items-center justify-center gap-1.5 bg-ink text-white rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold hover:bg-black transition disabled:opacity-40">
              <Printer size={15} /> {t('reports.print')}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}