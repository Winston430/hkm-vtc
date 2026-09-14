import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, UsersThree, MagnifyingGlass } from '@phosphor-icons/react'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../lib/i18n'
import { useStudents } from '../../lib/services/students'
import { useEnrollments } from '../../lib/services/dashboard'
import { Avatar } from '../../components/ui/Avatar'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Skeleton } from '../../components/ui/skeleton'
import { formatMoney } from '../../lib/format'

type Filter = 'all' | 'owing' | 'paid' | 'ended'

function addMonths(ts: number, months: number): number {
  const d = new Date(ts)
  d.setMonth(d.getMonth() + months)
  return d.getTime()
}

export default function StudentsList() {
  const { profile } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const role = profile?.role ?? 'admin'
  const { students, loading } = useStudents(role, profile?.branchId ?? null)
  const { enrollments } = useEnrollments(role, profile?.branchId ?? null)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  const infoByStudent = useMemo(() => {
    const map = new Map<string, { balance: number; dropped: boolean; ended: boolean }>()
    enrollments.forEach((e) => {
      if (map.has(e.studentId)) return
      const ended = e.durationMonths ? Date.now() >= addMonths(e.createdAt, e.durationMonths) : false
      map.set(e.studentId, { balance: e.balance, dropped: e.status === 'dropped', ended })
    })
    return map
  }, [enrollments])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return students
      .map((s) => {
        const info = infoByStudent.get(s.id)
        return { s, balance: info?.balance ?? 0, dropped: info?.dropped ?? false, ended: info?.ended ?? false }
      })
      .filter((r) => {
        if (q && !(r.s.fullName.toLowerCase().includes(q) || r.s.regNo.toLowerCase().includes(q))) return false
        if (filter === 'owing') return !r.dropped && r.balance > 0
        if (filter === 'paid') return !r.dropped && r.balance <= 0
        if (filter === 'ended') return !r.dropped && r.ended
        return true
      })
  }, [students, infoByStudent, filter, search])

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: t('students.all') },
    { key: 'owing', label: t('students.owing') },
    { key: 'paid', label: t('students.paidUp') },
    { key: 'ended', label: t('students.ended') },
  ]

  return (
    <div className="p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[19px] font-extrabold tracking-[-0.3px]">{t('students.title')}</h1>
          <p className="text-[12.5px] text-ink-secondary mt-1">{t('students.subtitle')}</p>
        </div>
        <Link to="/students/new" className="inline-flex items-center gap-1.5 bg-ink text-white rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold hover:bg-black transition">
          <Plus size={15} /> {t('students.register')}
        </Link>
      </div>

      {/* controls: tabs + search */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="inline-flex bg-surface-soft rounded-[20px] p-1">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-[16px] text-[12px] font-bold transition ${filter === tab.key ? 'bg-white text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]' : 'text-ink-muted hover:text-ink'}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('students.searchPh')}
            className="w-full text-[13px] font-medium text-ink bg-surface-soft rounded-md py-2.5 pl-10 pr-3.5 outline-none transition placeholder:text-ink-muted focus:bg-white focus:shadow-[0_0_0_3px_rgba(23,23,23,0.07),inset_0_0_0_1.5px_rgba(23,23,23,0.12)]" />
        </div>
      </div>

      <div className="bg-surface rounded-[18px] shadow-soft px-1 py-1.5">
        {loading ? (
          <div className="p-4 flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-40" /><Skeleton className="h-4 w-24 ml-auto" /></div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-surface-soft grid place-items-center mx-auto text-ink-muted mb-3"><UsersThree size={24} /></div>
            <div className="font-extrabold text-[15px]">
              {search.trim() ? t('students.noResults') : filter === 'owing' ? t('students.noneOwing') : filter === 'ended' ? t('students.endedNone') : t('students.empty')}
            </div>
            {filter === 'all' && !search.trim() && (
              <>
                <div className="text-[12.5px] text-ink-secondary mt-1 mb-4">{t('students.emptyHint')}</div>
                <Link to="/students/new" className="inline-flex items-center gap-1.5 bg-ink text-white rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold hover:bg-black transition"><Plus size={15} /> {t('students.register')}</Link>
              </>
            )}
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-[10.5px] font-bold text-ink-muted px-4 pt-3 pb-2.5">{t('dash.colStudent')}</th>
                <th className="text-left text-[10.5px] font-bold text-ink-muted px-4 pt-3 pb-2.5">{t('students.colReg')}</th>
                <th className="text-left text-[10.5px] font-bold text-ink-muted px-4 pt-3 pb-2.5">{t('dash.colBranch')}</th>
                <th className="text-left text-[10.5px] font-bold text-ink-muted px-4 pt-3 pb-2.5">{t('students.colBalance')}</th>
                <th className="text-right text-[10.5px] font-bold text-ink-muted px-4 pt-3 pb-2.5 pr-5">{t('students.colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ s, balance, dropped, ended }, i) => (
                <tr key={s.id} onClick={() => navigate(`/students/${s.id}`)} className={`cursor-pointer hover:bg-surface-soft transition ${i === 0 ? '' : 'border-t border-[#F1F1F1]'}`}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={s.fullName} size={32} />
                      <div>
                        <div className="font-bold text-[12.5px]">{s.fullName}</div>
                        {ended && !dropped && <div className="text-[10px] text-ink-muted font-semibold">{t('students.courseEnded')}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-ink-muted font-semibold tabular-nums">{s.regNo}</td>
                  <td className="px-4 py-2.5 text-[12.5px] text-ink-secondary">{s.branchName}</td>
                  <td className="px-4 py-2.5 text-[12.5px] font-bold tabular-nums">TSh {formatMoney(balance)}</td>
                  <td className="px-4 py-2.5 text-right pr-5">
                    {dropped ? (
                      <StatusBadge kind="dropped" label={t('detail.statusDropped')} />
                    ) : (
                      <StatusBadge kind={balance <= 0 ? 'paid' : 'due'} label={balance <= 0 ? t('dash.paid') : t('dash.balanceDue')} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}