import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  Gear, Bell, UsersThree, Wallet, ClockCountdown, Plus, Buildings, UserPlus,
} from '@phosphor-icons/react'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../lib/toast'
import { Avatar } from '../../components/ui/Avatar'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Skeleton } from '../../components/ui/skeleton'
import { useDashboardData, markNotificationRead } from '../../lib/services/dashboard'
import { seedCatalog } from '../../lib/seed'
import { useCourses } from '../../lib/services/catalog'
import { formatMoney, formatCompact, timeAgo } from '../../lib/format'

export default function Dashboard() {
  const { profile } = useAuth()
  const { t } = useI18n()
  const toast = useToast()
  const role = profile?.role ?? 'admin'
  const isAdmin = role === 'admin'
  const firstName = (profile?.name || 'Admin').split(' ')[0]
  const hour = new Date().getHours()
  const greetKey = hour < 12 ? 'greeting.morning' : hour < 17 ? 'greeting.afternoon' : 'greeting.evening'
  const d = useDashboardData(role, profile?.branchId ?? null)
  const navigate = useNavigate()

  async function openNotification(n: { id: string; studentId?: string }) {
    try {
      await markNotificationRead(n.id)
    } catch {
      /* ignore — still navigate */
    }
    if (n.studentId) navigate(`/students/${n.studentId}`)
  }

  const [seeding, setSeeding] = useState(false)
  const [showNotif, setShowNotif] = useState(true)
  const { courses: catalogCourses, loading: catalogLoading } = useCourses(true)
  // only prompt to seed once we KNOW the catalog is empty (never while loading)
  const needsSeed = isAdmin && !catalogLoading && catalogCourses.length === 0

  async function runSeed() {
    setSeeding(true)
    try {
      await seedCatalog()
      toast.success(t('common.seedBtn'))
    } catch {
      toast.error(t('reg.error'))
    } finally {
      setSeeding(false)
    }
  }

  // the notification panel content (reused if we later add a mobile variant)
  const panelContent = (
    <>
      <div className="text-[13.5px] font-extrabold">{t('dash.notifications')}</div>
      <div className="text-[11px] text-ink-muted font-semibold mt-0.5 mb-3.5">{t('dash.notifSub')}</div>

      {d.loading ? (
        <div className="flex flex-col gap-2.5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-[14px]" />)}</div>
      ) : d.notifications.length === 0 ? (
        <div className="bg-surface rounded-[14px] p-5 text-center text-[12px] text-ink-muted font-semibold shadow-soft">{t('common.empty')}</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
          {d.notifications.map((n) => (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
              transition={{ duration: 0.2 }}
              role="button"
              tabIndex={0}
              onClick={() => openNotification(n)}
              onKeyDown={(e) => { if (e.key === 'Enter') openNotification(n) }}
              className="relative bg-surface rounded-[14px] p-3 shadow-soft flex gap-2.5 cursor-pointer transition hover:bg-[#FAFAFA] active:scale-[0.99]"
            >
              {!n.read && <span className="absolute top-3 right-3 w-[7px] h-[7px] rounded-full bg-danger" />}
              <span className="w-[34px] h-[34px] rounded-[10px] shrink-0 grid place-items-center text-white bg-gradient-to-br from-ink to-[#3a3a3a]">
                <UserPlus size={16} />
              </span>
              <div className="min-w-0">
                <div className="text-[11.5px] leading-snug"><b className="font-bold">{n.studentName}</b> · {n.courseName}</div>
                <div className="text-[10px] text-ink-muted font-semibold mt-1 flex items-center gap-1.5">
                  <span className="bg-surface-soft rounded-[6px] px-1.5 py-0.5">{n.branchName}</span>
                  {n.bankRef && <span className="bg-surface-soft rounded-[6px] px-1.5 py-0.5">#{n.bankRef}</span>}
                  <span className="ml-auto whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                </div>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
        </div>
      )}

      <div className="h-px bg-black/[0.06] my-5" />

      <div className="text-[13.5px] font-extrabold mb-3">{t('dash.todaysPayments')}</div>
      {d.loading ? (
        <div className="flex flex-col gap-3">{[0, 1].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
      ) : d.todaysPayments.length === 0 ? (
        <div className="text-[12px] text-ink-muted font-semibold py-2">{t('common.empty')}</div>
      ) : (
        d.todaysPayments.slice(0, 6).map((p) => (
          <div key={p.id} className="flex items-center gap-2.5 py-2">
            <Avatar name={p.studentName} size={30} />
            <div><div className="font-bold text-[12px]">{p.studentName}</div><div className="text-[10px] text-ink-muted font-semibold">{p.period}</div></div>
            <div className="ml-auto font-extrabold text-[11.5px] tabular-nums text-success">+{formatMoney(p.amount)}</div>
          </div>
        ))
      )}
    </>
  )

  return (
    <div className="flex min-h-screen">
      {/* ============ MAIN ============ */}
      <div className="flex-1 min-w-0 p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[19px] font-extrabold tracking-[-0.3px]">{t(greetKey)}, {firstName}</h1>
            <p className="text-[12.5px] text-ink-secondary mt-1">{t('dash.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Link to="/settings" aria-label="Settings" className="w-[38px] h-[38px] rounded-xl bg-surface-soft grid place-items-center text-ink-secondary hover:bg-[#EEE] transition">
              <Gear size={17} />
            </Link>
            {isAdmin && (
              <button
                onClick={() => setShowNotif((v) => !v)}
                className={`w-[38px] h-[38px] rounded-xl grid place-items-center transition relative ${showNotif ? 'bg-ink text-white' : 'bg-surface-soft text-ink-secondary hover:bg-[#EEE]'}`}
                aria-label="Toggle notifications"
              >
                <Bell size={17} weight={showNotif ? 'fill' : 'regular'} />
                {!showNotif && d.notifications.length > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-[7px] h-[7px] rounded-full bg-danger border-[1.5px] border-white" />
                )}
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {needsSeed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-5 bg-surface rounded-[18px] shadow-soft p-5 flex items-center justify-between gap-4">
                <div>
                  <div className="font-extrabold text-[14px]">{t('common.seedTitle')}</div>
                  <div className="text-[12.5px] text-ink-secondary mt-0.5">{t('common.seedHint')}</div>
                </div>
                <button onClick={runSeed} disabled={seeding} className="shrink-0 inline-flex items-center gap-1.5 bg-ink text-white rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold hover:bg-black transition disabled:opacity-60">
                  <Plus size={15} />{t('common.seedBtn')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          <SummaryCard tone="yellow" label={t('dash.totalStudents')} sub={t('dash.allBranchesSub')} value={d.loading ? null : String(d.totalStudents)} Icon={UsersThree} />
          <SummaryCard tone="blue" label={t('dash.feesCollected')} sub={t('dash.thisMonth')} value={d.loading ? null : formatCompact(d.feesThisMonth)} prefix="TSh" Icon={Wallet} />
          <SummaryCard tone="purple" label={t('dash.outstanding')} sub={t('dash.allBranchesSub')} value={d.loading ? null : formatCompact(d.outstanding)} prefix="TSh" Icon={ClockCountdown} />
        </div>

        <div className="mt-7">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[14px] font-extrabold tracking-[-0.2px]">{t('dash.recent')}</div>
            <Link to="/students" className="text-[11.5px] font-semibold text-ink-secondary bg-surface-soft hover:bg-[#EEE] px-3 py-1.5 rounded-[20px] transition">{t('dash.viewAll')}</Link>
          </div>
          <div className="bg-surface rounded-[18px] shadow-soft px-1 py-1.5">
            {d.loading ? (
              <div className="p-4 flex flex-col gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-40" /><Skeleton className="h-4 w-20 ml-auto" />
                  </div>
                ))}
              </div>
            ) : d.recent.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-ink-muted font-semibold">{t('common.empty')}</div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <Th className="w-[32%]">{t('dash.colStudent')}</Th><Th>{t('dash.colBranch')}</Th><Th>{t('dash.colCourse')}</Th><Th>{t('dash.colFees')}</Th>
                    <Th className="text-right pr-5">{t('dash.colStatus')}</Th>
                  </tr>
                </thead>
                <tbody>
                  {d.recent.map((r, i) => (
                    <tr key={r.id} className={i === 0 ? '' : 'border-t border-[#F1F1F1]'}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={r.name} size={32} />
                          <div><div className="font-bold text-[12.5px]">{r.name}</div><div className="text-[10.5px] text-ink-muted font-semibold">{r.regNo}</div></div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-[12.5px] text-ink-secondary">{r.branchName}</td>
                      <td className="px-4 py-2.5 text-[12.5px] text-ink-secondary">{r.courseName}</td>
                      <td className="px-4 py-2.5 text-[12.5px] font-bold tabular-nums">TSh {formatMoney(r.amountPaid)}</td>
                      <td className="px-4 py-2.5 text-right pr-5"><StatusBadge kind={r.status} label={r.status === 'paid' ? t('dash.paid') : t('dash.balanceDue')} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
          <div className="bg-surface rounded-[18px] shadow-soft p-[18px]">
            <div className="flex items-center justify-between mb-3.5">
              <div className="text-[14px] font-extrabold tracking-[-0.2px]">{t('dash.popularCourses')}</div>
              {isAdmin && <Link to="/courses" className="inline-flex items-center gap-1.5 bg-ink text-white rounded-[20px] px-3.5 py-2 text-[12px] font-bold hover:bg-black transition"><Plus size={14} />{t('dash.addCourse')}</Link>}
            </div>
            {d.loading ? (
              <div className="flex flex-col gap-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : d.popularCourses.length === 0 ? (
              <div className="py-8 text-center text-[12.5px] text-ink-muted font-semibold">{t('common.empty')}</div>
            ) : (
              d.popularCourses.map((c, i) => (
                <div key={c.name} className={`flex items-center justify-between py-2.5 ${i === 0 ? '' : 'border-t border-[#F1F1F1]'}`}>
                  <div>
                    <div className="font-bold text-[12.5px]">{c.name}</div>
                    <div className="h-[6px] w-[120px] rounded-[6px] bg-[#EFEFEF] overflow-hidden mt-1.5">
                      <motion.span className="block h-full rounded-[6px] bg-ink" initial={{ width: 0 }} animate={{ width: `${c.pct}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} />
                    </div>
                  </div>
                  <div className="text-right text-[10.5px] text-ink-muted font-semibold">{c.enrolled} {t('dash.enrolled')}</div>
                </div>
              ))
            )}
          </div>

          {isAdmin && (
            <div className="bg-surface rounded-[18px] shadow-soft p-[18px]">
              <div className="flex items-center justify-between mb-3.5">
                <div className="text-[14px] font-extrabold tracking-[-0.2px]">{t('nav.branches')}</div>
                <Link to="/branches" className="text-[11.5px] font-semibold text-ink-secondary bg-surface-soft hover:bg-[#EEE] px-3 py-1.5 rounded-[20px] transition">{t('dash.manage')}</Link>
              </div>
              {d.loading ? (
                <div className="flex flex-col gap-3">{[0, 1].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : d.branchSummaries.length === 0 ? (
                <div className="py-8 text-center text-[12.5px] text-ink-muted font-semibold">{t('common.empty')}</div>
              ) : (
                d.branchSummaries.map((b, i) => (
                  <div key={b.id} className={`flex items-center gap-3 py-2.5 ${i === 0 ? '' : 'border-t border-[#F1F1F1]'}`}>
                    <div className="w-[34px] h-[34px] rounded-[11px] bg-surface-soft grid place-items-center text-ink-secondary"><Buildings size={17} /></div>
                    <div className="font-bold text-[12.5px]">{b.name}</div>
                    <div className="ml-auto text-right"><b className="text-[15px] font-extrabold">{b.students}</b><span className="block text-[9.5px] text-ink-muted font-semibold">{t('dash.studentsLower')}</span></div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============ RIGHT PANEL — slides open/closed via the bell ============ */}
      <AnimatePresence initial={false}>
        {isAdmin && showNotif && (
          <motion.aside
            key="notif-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
            className="bg-panel overflow-hidden shrink-0 hidden xl:block"
          >
            <div className="w-[300px] p-6 min-h-screen">{panelContent}</div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left text-[10.5px] font-bold text-ink-muted px-4 pt-3 pb-2.5 ${className}`}>{children}</th>
}

function SummaryCard({ tone, label, sub, value, prefix, Icon }: {
  tone: 'yellow' | 'blue' | 'purple'; label: string; sub: string; value: string | null; prefix?: string; Icon: React.ComponentType<{ size?: number }>
}) {
  const bg = { yellow: 'bg-accent-yellow', blue: 'bg-accent-blue', purple: 'bg-accent-purple' }[tone]
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className={`relative rounded-[18px] p-[18px] min-h-[114px] flex flex-col justify-between ${bg}`}>
      <div>
        <div className="text-[12px] font-bold text-black/[0.62]">{label}</div>
        <div className="text-[10.5px] font-semibold text-black/[0.5] mt-0.5">{sub}</div>
      </div>
      {value === null ? (
        <Skeleton className="h-7 w-20 bg-black/10" />
      ) : (
        <div className="text-[27px] font-extrabold tracking-[-0.5px] text-ink">
          {prefix && <small className="text-[14px] font-bold text-black/[0.55] mr-0.5">{prefix}</small>}{value}
        </div>
      )}
      <div className="absolute right-4 bottom-4 w-[30px] h-[30px] rounded-full bg-white/70 grid place-items-center text-ink"><Icon size={15} /></div>
    </motion.div>
  )
}