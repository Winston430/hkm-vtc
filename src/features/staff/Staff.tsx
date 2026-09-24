import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Plus, Trash, IdentificationBadge, Prohibit, CheckCircle, Money, ShieldCheck } from '@phosphor-icons/react'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../lib/toast'
import { useStaff, createStaff, setStaffActive, removeStaff, payStaff } from '../../lib/services/staff'
import type { Staff } from '../../lib/services/staff'
import { useBranches } from '../../lib/services/catalog'
import { Avatar } from '../../components/ui/Avatar'
import { Modal } from '../../components/ui/Modal'
import { Dropdown } from '../../components/ui/Dropdown'
import { Skeleton } from '../../components/ui/skeleton'
import { Wave } from '../../components/loading-ui/wave'
import type { Role } from '../../lib/types'

const inputClass = 'w-full text-[13.5px] font-medium text-ink bg-surface-soft rounded-md py-3 px-3.5 outline-none transition placeholder:text-ink-muted focus:bg-surface focus:shadow-[0_0_0_3px_rgba(23,23,23,0.07),inset_0_0_0_1.5px_rgba(23,23,23,0.12)]'
const emptyForm = { name: '', email: '', password: '', role: 'agent' as Role, branchId: '' }

export default function StaffScreen() {
  const { profile, user } = useAuth()
  const { t } = useI18n()
  const toast = useToast()
  const { staff, loading } = useStaff()
  const { branches } = useBranches()
  const meUid = user?.uid
  const activeAdmins = staff.filter((x) => x.role === 'admin' && x.active).length
  const isSelf = (s: Staff) => s.uid === meUid
  const isLastActiveAdmin = (s: Staff) => s.role === 'admin' && s.active && activeAdmins <= 1

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [removingStaff, setRemovingStaff] = useState<Staff | null>(null)
  const [busy, setBusy] = useState(false)
  const [paying, setPaying] = useState<Staff | null>(null)
  const [payForm, setPayForm] = useState({ kind: 'salary' as 'salary' | 'advance', amount: '', note: '' })
  const [payingBusy, setPayingBusy] = useState(false)

  if (profile?.role !== 'admin') return <Navigate to="/" replace />

  const branchName = (id: string | null) => (id ? branches.find((b) => b.id === id)?.name ?? '—' : t('nav.allBranches'))
  const valid = form.name.trim() && form.email.trim() && form.password.length >= 6 && (form.role === 'admin' || form.branchId)

  async function save() {
    if (!valid) return
    setSaving(true)
    try {
      await createStaff({ name: form.name, email: form.email, password: form.password, role: form.role, branchId: form.role === 'admin' ? null : form.branchId })
      toast.success(t('staff.created'), form.name.trim()); setFormOpen(false); setForm(emptyForm)
    } catch { toast.error(t('staff.createError')) } finally { setSaving(false) }
  }
  async function toggle(s: Staff) {
    if (isSelf(s)) { toast.error(t('staff.cantSelf')); return }
    if (s.active && isLastActiveAdmin(s)) { toast.error(t('staff.lastAdmin')); return }
    try { await setStaffActive(s.uid, !s.active) } catch { toast.error(t('detail.actionError')) }
  }
  function askRemove(s: Staff) {
    if (isSelf(s)) { toast.error(t('staff.cantSelf')); return }
    if (isLastActiveAdmin(s)) { toast.error(t('staff.lastAdmin')); return }
    setRemovingStaff(s)
  }
  async function confirmRemove() { if (!removingStaff) return; setBusy(true); try { await removeStaff(removingStaff.uid); toast.success(t('staff.removed')); setRemovingStaff(null) } catch { toast.error(t('detail.actionError')) } finally { setBusy(false) } }
  async function recordPay() {
    if (!paying || Number(payForm.amount) <= 0) return
    setPayingBusy(true)
    try { await payStaff({ staff: paying, kind: payForm.kind, amount: Number(payForm.amount), note: payForm.note.trim(), recordedBy: user?.uid ?? '' }); toast.success(t('staff.paid')); setPaying(null); setPayForm({ kind: 'salary', amount: '', note: '' }) }
    catch { toast.error(t('staff.payError')) } finally { setPayingBusy(false) }
  }

  return (
    <div className="p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div><h1 className="text-[19px] font-extrabold tracking-[-0.3px]">{t('staff.title')}</h1><p className="text-[12.5px] text-ink-secondary mt-1">{t('staff.subtitle')}</p></div>
        <button onClick={() => setFormOpen(true)} className="inline-flex items-center gap-1.5 bg-primary text-on-primary rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold hover:opacity-90 transition"><Plus size={15} /> {t('staff.add')}</button>
      </div>

      {loading ? (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[0,1,2].map((i) => <Skeleton key={i} className="h-[140px] w-full rounded-[18px]" />)}</div>)
      : staff.length === 0 ? (<div className="bg-surface rounded-[18px] shadow-soft py-16 text-center"><div className="w-12 h-12 rounded-full bg-surface-soft grid place-items-center mx-auto text-ink-muted mb-3"><IdentificationBadge size={24} /></div><div className="font-extrabold text-[15px]">{t('staff.empty')}</div><div className="text-[12.5px] text-ink-secondary mt-1 mb-4">{t('staff.emptyHint')}</div><button onClick={() => setFormOpen(true)} className="inline-flex items-center gap-1.5 bg-primary text-on-primary rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold hover:opacity-90 transition"><Plus size={15} /> {t('staff.add')}</button></div>)
      : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((s) => (
            <motion.div key={s.uid} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={`bg-surface rounded-[18px] shadow-soft p-5 ${s.active ? '' : 'opacity-60'}`}>
              <div className="flex items-center gap-3"><Avatar name={s.name} size={44} /><div className="min-w-0"><div className="font-extrabold text-[14px] truncate">{s.name}</div><div className="text-[11px] text-ink-muted font-semibold truncate">{s.email}</div></div></div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className={`inline-flex items-center gap-1 rounded-[6px] px-2 py-1 text-[10.5px] font-bold ${s.role === 'admin' ? 'bg-accent-purple text-ink' : 'bg-surface-soft text-ink-secondary'}`}>{s.role === 'admin' ? <ShieldCheck size={12} /> : <IdentificationBadge size={12} />}{s.role === 'admin' ? t('staff.roleAdmin') : t('staff.roleAgent')}</span>
                <span className="bg-surface-soft rounded-[6px] px-2 py-1 text-[10.5px] font-bold text-ink-secondary">{branchName(s.branchId)}</span>
                <span className={`inline-flex items-center gap-1 text-[10.5px] font-bold ${s.active ? 'text-success' : 'text-ink-muted'}`}><span className={`w-1.5 h-1.5 rounded-full ${s.active ? 'bg-success' : 'bg-ink-muted'}`} />{s.active ? t('staff.active') : t('staff.inactive')}</span>
              </div>
              <div className="flex gap-1.5 mt-4 pt-4 border-t border-hair">
                <button onClick={() => setPaying(s)} className="flex-1 inline-flex items-center justify-center gap-1.5 bg-surface-soft hover:bg-hover rounded-[20px] py-2 text-[11.5px] font-bold text-ink-secondary transition"><Money size={13} /> {t('staff.pay')}</button>
                {isSelf(s) ? (
                  <span className="inline-flex items-center px-3 rounded-[20px] bg-surface-soft text-[11px] font-bold text-ink-muted">{t('staff.you')}</span>
                ) : (
                  <>
                    <button onClick={() => toggle(s)} disabled={s.active && isLastActiveAdmin(s)} className="w-9 h-9 rounded-[20px] bg-surface-soft hover:bg-hover grid place-items-center text-ink-secondary transition disabled:opacity-40" title={s.active ? t('staff.disable') : t('staff.enable')}>{s.active ? <Prohibit size={15} /> : <CheckCircle size={15} />}</button>
                    <button onClick={() => askRemove(s)} disabled={isLastActiveAdmin(s)} className="w-9 h-9 rounded-[20px] bg-surface-soft hover:bg-hover grid place-items-center text-danger transition disabled:opacity-40"><Trash size={15} /></button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* create staff */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={t('staff.add')} maxWidth={460}>
        <div className="flex flex-col gap-4">
          <div><label className="block text-[12px] font-bold mb-[7px] text-ink">{t('staff.name')}</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></div>
          <div><label className="block text-[12px] font-bold mb-[7px] text-ink">{t('staff.email')}</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} /></div>
          <div><label className="block text-[12px] font-bold mb-[7px] text-ink">{t('staff.password')}</label><input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[12px] font-bold mb-[7px] text-ink">{t('staff.role')}</label><Dropdown value={form.role} onChange={(v) => setForm({ ...form, role: v as Role })} options={[{ value: 'agent', label: t('staff.roleAgent') }, { value: 'admin', label: t('staff.roleAdmin') }]} /></div>
            <div><label className="block text-[12px] font-bold mb-[7px] text-ink">{t('staff.branch')}</label>{form.role === 'admin' ? <input disabled value={t('nav.allBranches')} className={inputClass + ' opacity-60'} /> : <Dropdown value={form.branchId} onChange={(v) => setForm({ ...form, branchId: v })} placeholder={t('staff.branchPh')} options={branches.map((b) => ({ value: b.id, label: b.name }))} />}</div>
          </div>
          {form.role === 'agent' && branches.length === 0 && <div className="text-[11px] font-semibold text-danger">{t('staff.needBranch')}</div>}
          <div className="flex justify-end gap-2 mt-1"><button onClick={() => setFormOpen(false)} disabled={saving} className="bg-surface-soft hover:bg-hover rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold text-ink-secondary transition">{t('detail.cancel')}</button><button onClick={save} disabled={saving || !valid} className="inline-flex items-center justify-center gap-1.5 bg-primary text-on-primary rounded-[20px] px-5 py-2.5 min-w-[150px] text-[12.5px] font-bold hover:opacity-90 transition disabled:opacity-50">{saving ? <Wave className="h-3.5 w-8" /> : t('staff.create')}</button></div>
        </div>
      </Modal>

      {/* pay staff (salary / advance) */}
      <Modal open={!!paying} onClose={() => setPaying(null)} title={t('staff.payTitle')} maxWidth={420}>
        <div className="text-[13px] font-extrabold mb-4">{paying?.name}</div>
        <div className="flex flex-col gap-4">
          <div><label className="block text-[12px] font-bold mb-[7px] text-ink">{t('staff.payKind')}</label>
            <div className="inline-flex bg-surface-soft rounded-[20px] p-1">
              {(['salary', 'advance'] as const).map((k) => (<button key={k} onClick={() => setPayForm({ ...payForm, kind: k })} className={`px-4 py-2 rounded-[16px] text-[12px] font-bold transition ${payForm.kind === k ? 'bg-surface text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]' : 'text-ink-muted'}`}>{k === 'salary' ? t('staff.paySalary') : t('staff.payAdvance')}</button>))}
            </div>
          </div>
          <div><label className="block text-[12px] font-bold mb-[7px] text-ink">{t('exp.amount')}</label><input type="number" min="0" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} className={inputClass} /></div>
          <div><label className="block text-[12px] font-bold mb-[7px] text-ink">{t('staff.payNote')}</label><input value={payForm.note} onChange={(e) => setPayForm({ ...payForm, note: e.target.value })} className={inputClass} /></div>
          <div className="flex justify-end gap-2"><button onClick={() => setPaying(null)} disabled={payingBusy} className="bg-surface-soft hover:bg-hover rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold text-ink-secondary transition">{t('detail.cancel')}</button><button onClick={recordPay} disabled={payingBusy || Number(payForm.amount) <= 0} className="inline-flex items-center justify-center gap-1.5 bg-primary text-on-primary rounded-[20px] px-5 py-2.5 min-w-[150px] text-[12.5px] font-bold hover:opacity-90 transition disabled:opacity-50">{payingBusy ? <Wave className="h-3.5 w-8" /> : t('staff.payRecord')}</button></div>
        </div>
      </Modal>

      <Modal open={!!removingStaff} onClose={() => setRemovingStaff(null)} title={t('staff.remove')} maxWidth={420}>
        <div className="text-[13px] text-ink-secondary font-semibold">{t('staff.removeConfirm')}</div>
        <div className="text-[13px] font-extrabold mt-2">{removingStaff?.name}</div>
        <div className="flex justify-end gap-2 mt-5"><button onClick={() => setRemovingStaff(null)} disabled={busy} className="bg-surface-soft hover:bg-hover rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold text-ink-secondary transition">{t('detail.cancel')}</button><button onClick={confirmRemove} disabled={busy} className="inline-flex items-center justify-center gap-1.5 bg-danger text-white rounded-[20px] px-5 py-2.5 min-w-[120px] text-[12.5px] font-bold hover:brightness-95 transition disabled:opacity-60">{busy ? <Wave className="h-3.5 w-8 text-white" /> : t('detail.confirm')}</button></div>
      </Modal>
    </div>
  )
}