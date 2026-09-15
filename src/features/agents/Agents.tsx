import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Plus, Trash, IdentificationBadge, Prohibit, CheckCircle } from '@phosphor-icons/react'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../lib/toast'
import { useBusy } from '../../lib/busy'
import { TimeoutError } from '../../lib/async'
import { useAgents, createAgent, setAgentActive, removeAgent } from '../../lib/services/agents'
import type { Agent } from '../../lib/services/agents'
import { useBranches } from '../../lib/services/catalog'
import { Avatar } from '../../components/ui/Avatar'
import { Modal } from '../../components/ui/Modal'
import { Dropdown } from '../../components/ui/Dropdown'
import { Skeleton } from '../../components/ui/skeleton'
import { Wave } from '../../components/loading-ui/wave'

const inputClass =
  'w-full text-[13.5px] font-medium text-ink bg-surface-soft rounded-md py-3 px-3.5 outline-none transition placeholder:text-ink-muted focus:bg-surface focus:shadow-[0_0_0_3px_rgba(23,23,23,0.07),inset_0_0_0_1.5px_rgba(23,23,23,0.12)]'

const empty = { name: '', email: '', password: '', branchId: '' }

export default function Agents() {
  const { profile } = useAuth()
  const { t } = useI18n()
  const toast = useToast()
  const busyOverlay = useBusy()
  const { agents, loading } = useAgents()
  const { branches } = useBranches()

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<typeof empty>(empty)
  const [saving, setSaving] = useState(false)
  const [removingAgent, setRemovingAgent] = useState<Agent | null>(null)
  const [busy, setBusy] = useState(false)

  if (profile?.role !== 'admin') return <Navigate to="/" replace />

  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? '—'
  const valid = form.name.trim() && form.email.trim() && form.password.length >= 6 && form.branchId

  function openAdd() {
    setForm(empty)
    setFormOpen(true)
  }

  async function save() {
    if (!valid) return
    setSaving(true)
    try {
      await busyOverlay.run(() => createAgent(form), { message: t('busy.creating'), timeoutMs: 20000 })
      toast.success(t('agents.created'), `${form.name.trim()} · ${branchName(form.branchId)}`)
      setFormOpen(false)
    } catch (err) {
      toast.error(err instanceof TimeoutError ? t('err.timeout') : t('agents.createError'))
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(a: Agent) {
    try {
      await setAgentActive(a.uid, !a.active)
    } catch {
      toast.error(t('agents.actionError'))
    }
  }

  async function confirmRemove() {
    if (!removingAgent) return
    setBusy(true)
    try {
      await removeAgent(removingAgent.uid)
      toast.success(t('agents.removed'))
      setRemovingAgent(null)
    } catch {
      toast.error(t('agents.actionError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[19px] font-extrabold tracking-[-0.3px]">{t('agents.title')}</h1>
          <p className="text-[12.5px] text-ink-secondary mt-1">{t('agents.subtitle')}</p>
        </div>
        <button
          onClick={openAdd}
          disabled={branches.length === 0}
          className="inline-flex items-center gap-1.5 bg-primary text-on-primary rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold hover:opacity-90 transition disabled:opacity-40"
        >
          <Plus size={15} /> {t('agents.add')}
        </button>
      </div>

      {branches.length === 0 && !loading && (
        <div className="mb-4 bg-surface rounded-[14px] shadow-soft px-4 py-3 text-[12.5px] font-semibold text-ink-secondary">
          {t('agents.needBranch')}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[120px] w-full rounded-[18px]" />)}
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-surface rounded-[18px] shadow-soft py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-surface-soft grid place-items-center mx-auto text-ink-muted mb-3"><IdentificationBadge size={24} /></div>
          <div className="font-extrabold text-[15px]">{t('agents.empty')}</div>
          <div className="text-[12.5px] text-ink-secondary mt-1 mb-4">{t('agents.emptyHint')}</div>
          <button onClick={openAdd} disabled={branches.length === 0} className="inline-flex items-center gap-1.5 bg-primary text-on-primary rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold hover:opacity-90 transition disabled:opacity-40"><Plus size={15} /> {t('agents.add')}</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((a) => (
            <motion.div key={a.uid} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
              className={`bg-surface rounded-[18px] shadow-soft p-5 ${a.active ? '' : 'opacity-60'}`}>
              <div className="flex items-center gap-3">
                <Avatar name={a.name} size={44} />
                <div className="min-w-0">
                  <div className="font-extrabold text-[14px] truncate">{a.name}</div>
                  <div className="text-[11px] text-ink-muted font-semibold truncate">{a.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="bg-surface-soft rounded-[6px] px-2 py-1 text-[11px] font-bold text-ink-secondary">{branchName(a.branchId)}</span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${a.active ? 'text-success' : 'text-ink-muted'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${a.active ? 'bg-success' : 'bg-ink-muted'}`} />
                  {a.active ? t('agents.active') : t('agents.inactive')}
                </span>
              </div>
              <div className="flex gap-1.5 mt-4 pt-4 border-t border-hair">
                <button onClick={() => toggleActive(a)} className="flex-1 inline-flex items-center justify-center gap-1.5 bg-surface-soft hover:bg-hover rounded-[20px] py-2 text-[11.5px] font-bold text-ink-secondary transition">
                  {a.active ? <><Prohibit size={13} /> {t('agents.disable')}</> : <><CheckCircle size={13} /> {t('agents.enable')}</>}
                </button>
                <button onClick={() => setRemovingAgent(a)} className="w-9 h-9 rounded-[20px] bg-surface-soft hover:bg-hover grid place-items-center text-danger transition"><Trash size={15} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* create agent */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={t('agents.add')} maxWidth={460}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[12px] font-bold mb-[7px] text-ink">{t('agents.name')}</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-[12px] font-bold mb-[7px] text-ink">{t('agents.email')}</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-[12px] font-bold mb-[7px] text-ink">{t('agents.password')}</label>
            <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} />
            <div className="text-[10px] text-ink-muted font-semibold mt-1">{t('agents.passwordHint')}</div>
          </div>
          <div>
            <label className="block text-[12px] font-bold mb-[7px] text-ink">{t('agents.branch')}</label>
            <Dropdown value={form.branchId} onChange={(v) => setForm({ ...form, branchId: v })} placeholder={t('agents.branchPh')}
              options={branches.map((b) => ({ value: b.id, label: b.name }))} />
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button onClick={() => setFormOpen(false)} disabled={saving} className="bg-surface-soft hover:bg-hover rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold text-ink-secondary transition">{t('detail.cancel')}</button>
            <button onClick={save} disabled={saving || !valid} className="inline-flex items-center justify-center gap-1.5 bg-primary text-on-primary rounded-[20px] px-5 py-2.5 min-w-[160px] text-[12.5px] font-bold hover:opacity-90 transition disabled:opacity-50">
              {saving ? <Wave className="h-3.5 w-8 text-white" /> : t('agents.create')}
            </button>
          </div>
        </div>
      </Modal>

      {/* remove confirm */}
      <Modal open={!!removingAgent} onClose={() => setRemovingAgent(null)} title={t('agents.removeTitle')} maxWidth={420}>
        <div className="text-[13px] text-ink-secondary font-semibold">{t('agents.removeConfirm')}</div>
        <div className="text-[13px] font-extrabold mt-2">{removingAgent?.name}</div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setRemovingAgent(null)} disabled={busy} className="bg-surface-soft hover:bg-hover rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold text-ink-secondary transition">{t('detail.cancel')}</button>
          <button onClick={confirmRemove} disabled={busy} className="inline-flex items-center justify-center gap-1.5 bg-danger text-white rounded-[20px] px-5 py-2.5 min-w-[120px] text-[12.5px] font-bold hover:brightness-95 transition disabled:opacity-60">
            {busy ? <Wave className="h-3.5 w-8 text-white" /> : t('detail.confirm')}
          </button>
        </div>
      </Modal>
    </div>
  )
}