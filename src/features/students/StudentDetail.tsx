import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, PencilSimple, Check, X, Prohibit, Trash, Warning, Plus, Printer, GraduationCap } from '@phosphor-icons/react'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../lib/toast'
import { useBusy } from '../../lib/busy'
import { TimeoutError } from '../../lib/async'
import { motion, AnimatePresence } from 'motion/react'
import { useStudentDetail, updateStudent, dropStudent, deleteStudent, recordPayment, setFinished } from '../../lib/services/students'
import { Avatar } from '../../components/ui/Avatar'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Skeleton } from '../../components/ui/skeleton'
import { Wave } from '../../components/loading-ui/wave'
import { formatMoney, formatDate } from '../../lib/format'
import { printReceipt } from '../../lib/print'

const inputClass =
  'w-full text-[13px] font-medium text-ink bg-surface-soft rounded-md py-2.5 px-3 outline-none transition focus:bg-surface focus:shadow-[0_0_0_3px_rgba(23,23,23,0.07),inset_0_0_0_1.5px_rgba(23,23,23,0.12)]'

export default function StudentDetail() {
  const { id = '' } = useParams()
  const { profile } = useAuth()
  const { t } = useI18n()
  const toast = useToast()
  const busyOverlay = useBusy()
  const navigate = useNavigate()
  const { student, enrollments, payments, loading } = useStudentDetail(id)
  const isAdmin = profile?.role === 'admin'

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pending, setPending] = useState<null | 'drop' | 'remove'>(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ phone: '', nida: '', tin: '', residence: '', nokName: '', nokRel: '', nokPhone: '' })
  const [showPay, setShowPay] = useState(false)
  const [payAmt, setPayAmt] = useState('')
  const [payRef, setPayRef] = useState('')
  const [recording, setRecording] = useState(false)
  const [finishing, setFinishing] = useState(false)

  useEffect(() => {
    if (student) setForm({
      phone: student.phone ?? '', nida: student.nida ?? '', tin: student.tin ?? '', residence: student.residence ?? '',
      nokName: student.nextOfKin?.name ?? '', nokRel: student.nextOfKin?.relationship ?? '', nokPhone: student.nextOfKin?.phone ?? '',
    })
  }, [student])

  const enrollment = enrollments[0]
  const dropped = enrollment?.status === 'dropped'
  const finished = enrollment?.finished === true
  const payNum = Number(payAmt) || 0

  async function save() {
    if (!student) return
    setSaving(true)
    try {
      await updateStudent(student.id, {
        phone: form.phone.trim(), nida: form.nida.trim(), tin: form.tin.trim(), residence: form.residence.trim(),
        nextOfKin: { name: form.nokName.trim(), relationship: form.nokRel.trim(), residence: student.nextOfKin?.residence ?? '', phone: form.nokPhone.trim() },
      })
      toast.success(t('detail.saved')); setEditing(false)
    } catch { toast.error(t('detail.saveError')) } finally { setSaving(false) }
  }

  async function recordPay() {
    if (!enrollment || payNum <= 0) return
    setRecording(true)
    try {
      await busyOverlay.run(() => recordPayment(enrollment.id, payNum, t('detail.recordPayment'), payRef.trim()), { message: t('busy.recording'), timeoutMs: 20000 })
      toast.success(t('detail.recordSuccess')); setShowPay(false); setPayAmt(''); setPayRef('')
    } catch (err) { toast.error(err instanceof TimeoutError ? t('err.timeout') : t('detail.recordError')) } finally { setRecording(false) }
  }

  async function toggleFinished() {
    if (!enrollment) return
    setFinishing(true)
    try { await setFinished(enrollment.id, !finished); toast.success(t('detail.finishedOk')) }
    catch { toast.error(t('detail.actionError')) } finally { setFinishing(false) }
  }

  async function confirmAction() {
    if (!student) return
    setBusy(true)
    try {
      if (pending === 'drop' && enrollment) { await dropStudent(enrollment.id); toast.success(t('detail.dropped')); setPending(null) }
      else if (pending === 'remove') { await deleteStudent(student.id); toast.success(t('detail.removed')); navigate('/students', { replace: true }) }
    } catch { toast.error(t('detail.actionError')) } finally { setBusy(false) }
  }

  function printPaymentReceipt(pay: { amount: number; period: string; bankRef: string; createdAt: number }) {
    if (!student) return
    const ok = printReceipt({
      receiptNo: pay.bankRef || '—', date: formatDate(pay.createdAt), studentName: student.fullName, regNo: student.regNo,
      course: enrollment?.courseName ?? '—', amount: `TSh ${formatMoney(pay.amount)}`, period: pay.period || '—',
      balance: `TSh ${formatMoney(enrollment?.balance ?? 0)}`,
      labels: { title: t('receipt.title'), no: t('receipt.no'), date: t('receipt.date'), student: t('receipt.student'), reg: t('receipt.reg'), course: t('receipt.course'), amount: t('receipt.amount'), for: t('receipt.for'), balance: t('receipt.balance'), received: t('receipt.received'), thanks: t('receipt.thanks') },
    })
    if (!ok) toast.error(t('reports.popupBlocked'))
  }

  if (loading) return <div className="p-6 sm:p-7"><Skeleton className="h-5 w-32 mb-6" /><Skeleton className="h-40 w-full rounded-[18px]" /></div>
  if (!student) return (<div className="p-6 sm:p-7"><Link to="/students" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-ink-secondary hover:text-ink mb-6"><ArrowLeft size={15} /> {t('detail.back')}</Link><div className="py-16 text-center text-[14px] font-bold text-ink-muted">{t('detail.notFound')}</div></div>)

  return (
    <div className="p-6 sm:p-7 max-w-[900px]">
      <Link to="/students" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-ink-secondary hover:text-ink mb-5 transition"><ArrowLeft size={15} /> {t('detail.back')}</Link>

      <div className="bg-surface rounded-[18px] shadow-soft p-5 flex items-center gap-4">
        {student.photoURL ? <img src={student.photoURL} alt="" className="w-[60px] h-[60px] rounded-full object-cover" /> : <Avatar name={student.fullName} size={60} />}
        <div className="flex-1 min-w-0"><div className="font-extrabold text-[18px] truncate">{student.fullName}</div><div className="text-[12px] text-ink-muted font-semibold mt-0.5 tabular-nums">{student.regNo}</div></div>
        <div className="flex items-center gap-2">
          {finished && <StatusBadge kind="paid" label={t('detail.finished')} />}
          {enrollment && (dropped ? <StatusBadge kind="dropped" label={t('detail.statusDropped')} /> : <StatusBadge kind={enrollment.balance <= 0 ? 'paid' : 'due'} label={enrollment.balance <= 0 ? t('dash.paid') : t('dash.balanceDue')} />)}
        </div>
      </div>

      {/* personal */}
      <div className="bg-surface rounded-[18px] shadow-soft p-5 mt-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[13px] font-extrabold">{t('detail.personal')}</div>
          {!editing ? <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 bg-surface-soft hover:bg-hover rounded-[20px] px-3.5 py-2 text-[12px] font-bold text-ink-secondary transition"><PencilSimple size={14} /> {t('detail.edit')}</button>
            : <div className="flex gap-2"><button onClick={() => setEditing(false)} disabled={saving} className="inline-flex items-center gap-1.5 bg-surface-soft hover:bg-hover rounded-[20px] px-3.5 py-2 text-[12px] font-bold text-ink-secondary transition"><X size={14} /> {t('detail.cancel')}</button><button onClick={save} disabled={saving} className="inline-flex items-center justify-center gap-1.5 bg-primary text-on-primary rounded-[20px] px-4 py-2 min-w-[130px] text-[12px] font-bold hover:opacity-90 transition disabled:opacity-60">{saving ? <Wave className="h-3.5 w-8" /> : (<><Check size={14} /> {t('detail.save')}</>)}</button></div>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          <Row label={t('reg.gender')} value={student.gender} />
          <Row label={t('reg.phone')} edit={editing} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Row label={t('reg.residence')} edit={editing} value={form.residence} onChange={(v) => setForm({ ...form, residence: v })} />
          <Row label={t('reg.nida')} edit={editing} value={form.nida} onChange={(v) => setForm({ ...form, nida: v })} />
          <Row label={t('reg.tin')} edit={editing} value={form.tin} onChange={(v) => setForm({ ...form, tin: v })} />
        </div>
        <div className="text-[12px] font-bold mt-6 mb-3 text-ink">{t('reg.nok')}</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
          <Row label={t('reg.nokName')} edit={editing} value={form.nokName} onChange={(v) => setForm({ ...form, nokName: v })} />
          <Row label={t('reg.nokRelationship')} edit={editing} value={form.nokRel} onChange={(v) => setForm({ ...form, nokRel: v })} />
          <Row label={t('reg.nokPhone')} edit={editing} value={form.nokPhone} onChange={(v) => setForm({ ...form, nokPhone: v })} />
        </div>
      </div>

      {/* course & fees + record payment + finish */}
      {enrollment && (
        <div className="bg-surface rounded-[18px] shadow-soft p-5 mt-5">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <div className="text-[13px] font-extrabold">{t('detail.enrollment')}</div>
            <div className="flex gap-2">
              {!dropped && !finished && (
                <button onClick={toggleFinished} disabled={finishing} className="inline-flex items-center gap-1.5 bg-surface-soft hover:bg-hover rounded-[20px] px-3.5 py-2 text-[12px] font-bold text-ink-secondary transition disabled:opacity-60">{finishing ? <Wave className="h-3 w-6" /> : (<><GraduationCap size={14} /> {t('detail.markFinished')}</>)}</button>
              )}
              {finished && <button onClick={toggleFinished} disabled={finishing} className="inline-flex items-center gap-1.5 bg-surface-soft hover:bg-hover rounded-[20px] px-3.5 py-2 text-[12px] font-bold text-ink-secondary transition disabled:opacity-60">{t('detail.markUnfinished')}</button>}
              {!dropped && enrollment.balance > 0 && !showPay && (
                <button onClick={() => setShowPay(true)} className="inline-flex items-center gap-1.5 bg-primary text-on-primary rounded-[20px] px-4 py-2 text-[12px] font-bold hover:opacity-90 transition"><Plus size={14} /> {t('detail.recordPayment')}</button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
            <Row label={t('reg.section.course')} value={enrollment.courseName} />
            <Row label={t('detail.totalDue')} value={`TSh ${formatMoney(enrollment.totalDue)}`} />
            <Row label={t('detail.balance')} value={`TSh ${formatMoney(enrollment.balance)}`} />
          </div>

          <AnimatePresence>
            {showPay && enrollment.balance > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-5 pt-5 border-t border-hair">
                  <div className="text-[11px] text-ink-muted font-semibold mb-3">{t('reg.bankRefHint')}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[560px]">
                    <div><label className="block text-[12px] font-bold mb-[7px] text-ink">{t('reg.amountPaid')}</label><input type="number" min="0" value={payAmt} onChange={(e) => setPayAmt(e.target.value)} className={inputClass} /></div>
                    <div><label className="block text-[12px] font-bold mb-[7px] text-ink">{t('reg.bankRef')}</label><input value={payRef} onChange={(e) => setPayRef(e.target.value)} className={inputClass} /></div>
                  </div>
                  {payNum > 0 && <div className="mt-3 text-[12.5px]"><span className="font-semibold text-ink-secondary">{t('reg.balanceAfterPay')}:</span> <span className="font-extrabold tabular-nums">TSh {formatMoney(Math.max(0, enrollment.balance - payNum))}</span></div>}
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => { setShowPay(false); setPayAmt(''); setPayRef('') }} disabled={recording} className="bg-surface-soft hover:bg-hover rounded-[20px] px-4 py-2 text-[12px] font-bold text-ink-secondary transition">{t('detail.cancel')}</button>
                    <button onClick={recordPay} disabled={recording || payNum <= 0 || !payRef.trim()} className="inline-flex items-center justify-center gap-1.5 bg-primary text-on-primary rounded-[20px] px-5 py-2 min-w-[140px] text-[12px] font-bold hover:opacity-90 transition disabled:opacity-50">{recording ? <Wave className="h-3.5 w-8" /> : t('detail.recordPayment')}</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* payments */}
      <div className="bg-surface rounded-[18px] shadow-soft p-5 mt-5">
        <div className="text-[13px] font-extrabold mb-4">{t('detail.paymentsTitle')}</div>
        {payments.length === 0 ? <div className="text-[12.5px] text-ink-muted font-semibold py-2">{t('detail.noPayments')}</div> : (
          <div className="flex flex-col">
            {payments.map((p, i) => (
              <div key={p.id} className={`flex items-center justify-between gap-3 py-3 ${i === 0 ? '' : 'border-t border-hair'}`}>
                <div className="min-w-0"><div className="font-bold text-[12.5px]">{p.period || '—'}</div><div className="text-[10.5px] text-ink-muted font-semibold">#{p.bankRef} · {formatDate(p.createdAt)}</div></div>
                <div className="flex items-center gap-2 shrink-0"><div className="font-extrabold text-[13px] tabular-nums text-success">+TSh {formatMoney(p.amount)}</div><button onClick={() => printPaymentReceipt(p)} title={t('receipt.print')} className="w-8 h-8 rounded-lg bg-surface-soft hover:bg-hover grid place-items-center text-ink-secondary transition"><Printer size={14} /></button></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* danger zone — agents can drop; only admins can permanently remove */}
      {((enrollment && !dropped) || isAdmin) && (
      <div className="mt-5 rounded-[18px] p-5 bg-[rgba(201,71,71,0.04)]">
        <div className="flex items-center gap-2 text-[13px] font-extrabold text-danger mb-1"><Warning size={16} weight="fill" /> {t('detail.dangerZone')}</div>
        {pending ? (
          <div className="mt-3">
            <div className="text-[12.5px] font-semibold text-ink mb-3">{pending === 'drop' ? t('detail.confirmDrop') : t('detail.confirmRemove')}</div>
            <div className="flex gap-2"><button onClick={() => setPending(null)} disabled={busy} className="bg-surface hover:bg-surface-soft rounded-[20px] px-4 py-2 text-[12px] font-bold text-ink-secondary transition shadow-soft">{t('detail.cancel')}</button><button onClick={confirmAction} disabled={busy} className="inline-flex items-center justify-center gap-1.5 bg-danger text-white rounded-[20px] px-4 py-2 min-w-[120px] text-[12px] font-bold hover:brightness-95 transition disabled:opacity-60">{busy ? <Wave className="h-3.5 w-8 text-white" /> : t('detail.confirm')}</button></div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mt-3">
            {enrollment && !dropped && <button onClick={() => setPending('drop')} className="inline-flex items-center gap-1.5 bg-surface hover:bg-surface-soft rounded-[20px] px-4 py-2 text-[12px] font-bold text-ink-secondary shadow-soft transition"><Prohibit size={14} /> {t('detail.drop')}</button>}
            {isAdmin && <button onClick={() => setPending('remove')} className="inline-flex items-center gap-1.5 bg-surface hover:bg-surface-soft rounded-[20px] px-4 py-2 text-[12px] font-bold text-danger shadow-soft transition"><Trash size={14} /> {t('detail.remove')}</button>}
          </div>
        )}
      </div>
      )}
    </div>
  )
}

function Row({ label, value, edit, onChange }: { label: string; value: string; edit?: boolean; onChange?: (v: string) => void }) {
  return (<div><div className="text-[10.5px] font-bold text-ink-muted mb-1">{label}</div>{edit && onChange ? <input value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} /> : <div className="font-semibold text-[13px] text-ink break-words">{value || '—'}</div>}</div>)
}