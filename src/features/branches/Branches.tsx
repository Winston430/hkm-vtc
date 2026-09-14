import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Plus, PencilSimple, Trash, Buildings, MapPin, Phone } from '@phosphor-icons/react'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../lib/toast'
import { useBranches, addBranch, updateBranch, deleteBranch } from '../../lib/services/catalog'
import { useStudents } from '../../lib/services/students'
import { Modal } from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/skeleton'
import { Wave } from '../../components/loading-ui/wave'
import type { Branch } from '../../lib/types'

const inputClass =
  'w-full text-[13.5px] font-medium text-ink bg-surface-soft rounded-md py-3 px-3.5 outline-none transition placeholder:text-ink-muted focus:bg-white focus:shadow-[0_0_0_3px_rgba(23,23,23,0.07),inset_0_0_0_1.5px_rgba(23,23,23,0.12)]'

const empty = { name: '', location: '', phone: '' }

export default function Branches() {
  const { profile } = useAuth()
  const { t } = useI18n()
  const toast = useToast()
  const { branches, loading } = useBranches()
  const { students } = useStudents('admin', null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<typeof empty>(empty)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<Branch | null>(null)
  const [removing, setRemoving] = useState(false)

  if (profile?.role !== 'admin') return <Navigate to="/" replace />

  const countFor = (id: string) => students.filter((s) => s.branchId === id).length

  function openAdd() {
    setEditingId(null)
    setForm(empty)
    setFormOpen(true)
  }
  function openEdit(b: Branch) {
    setEditingId(b.id)
    setForm({ name: b.name, location: b.location ?? '', phone: b.phone ?? '' })
    setFormOpen(true)
  }

  const valid = form.name.trim().length > 0

  async function save() {
    if (!valid) return
    setSaving(true)
    try {
      const data = { name: form.name.trim(), location: form.location.trim(), phone: form.phone.trim() }
      if (editingId) await updateBranch(editingId, data)
      else await addBranch(data)
      toast.success(t('branches.saved'))
      setFormOpen(false)
    } catch {
      toast.error(t('branches.saveError'))
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setRemoving(true)
    try {
      await deleteBranch(deleting.id)
      toast.success(t('branches.deleted'))
      setDeleting(null)
    } catch {
      toast.error(t('branches.deleteError'))
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[19px] font-extrabold tracking-[-0.3px]">{t('branches.title')}</h1>
          <p className="text-[12.5px] text-ink-secondary mt-1">{t('branches.subtitle')}</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-ink text-white rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold hover:bg-black transition">
          <Plus size={15} /> {t('branches.add')}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[150px] w-full rounded-[18px]" />)}
        </div>
      ) : branches.length === 0 ? (
        <div className="bg-surface rounded-[18px] shadow-soft py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-surface-soft grid place-items-center mx-auto text-ink-muted mb-3"><Buildings size={24} /></div>
          <div className="font-extrabold text-[15px]">{t('branches.empty')}</div>
          <div className="text-[12.5px] text-ink-secondary mt-1 mb-4">{t('branches.emptyHint')}</div>
          <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-ink text-white rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold hover:bg-black transition"><Plus size={15} /> {t('branches.add')}</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((b) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
              className="bg-surface rounded-[18px] shadow-soft p-5 flex flex-col">
              <div className="flex items-start justify-between">
                <div className="w-[40px] h-[40px] rounded-[12px] bg-surface-soft grid place-items-center text-ink-secondary"><Buildings size={20} /></div>
                <div className="text-right">
                  <div className="text-[18px] font-extrabold leading-none">{countFor(b.id)}</div>
                  <div className="text-[9.5px] text-ink-muted font-semibold">{t('dash.studentsLower')}</div>
                </div>
              </div>
              <div className="font-extrabold text-[15px] mt-3">{b.name}</div>
              <div className="mt-1.5 flex flex-col gap-1">
                {b.location && <div className="flex items-center gap-1.5 text-[11.5px] text-ink-secondary font-semibold"><MapPin size={13} /> {b.location}</div>}
                {b.phone && <div className="flex items-center gap-1.5 text-[11.5px] text-ink-secondary font-semibold tabular-nums"><Phone size={13} /> {b.phone}</div>}
              </div>
              <div className="flex justify-end gap-1.5 mt-4 pt-4 border-t border-[#F1F1F1]">
                <button onClick={() => openEdit(b)} className="w-8 h-8 rounded-lg bg-surface-soft hover:bg-[#EEE] grid place-items-center text-ink-secondary transition"><PencilSimple size={15} /></button>
                <button onClick={() => setDeleting(b)} className="w-8 h-8 rounded-lg bg-surface-soft hover:bg-[#EEE] grid place-items-center text-danger transition"><Trash size={15} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* add / edit */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingId ? t('branches.edit') : t('branches.add')} maxWidth={440}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[12px] font-bold mb-[7px] text-ink">{t('branches.name')}</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-[12px] font-bold mb-[7px] text-ink">{t('branches.location')}</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-[12px] font-bold mb-[7px] text-ink">{t('branches.phone')}</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button onClick={() => setFormOpen(false)} disabled={saving} className="bg-surface-soft hover:bg-[#EEE] rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold text-ink-secondary transition">{t('detail.cancel')}</button>
            <button onClick={save} disabled={saving || !valid} className="inline-flex items-center justify-center gap-1.5 bg-ink text-white rounded-[20px] px-5 py-2.5 min-w-[150px] text-[12.5px] font-bold hover:bg-black transition disabled:opacity-50">
              {saving ? <Wave className="h-3.5 w-8 text-white" /> : t('branches.save')}
            </button>
          </div>
        </div>
      </Modal>

      {/* delete confirm */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title={t('branches.deleteTitle')} maxWidth={420}>
        <div className="text-[13px] text-ink-secondary font-semibold">{t('branches.deleteConfirm')}</div>
        <div className="text-[13px] font-extrabold mt-2">{deleting?.name}</div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setDeleting(null)} disabled={removing} className="bg-surface-soft hover:bg-[#EEE] rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold text-ink-secondary transition">{t('detail.cancel')}</button>
          <button onClick={confirmDelete} disabled={removing} className="inline-flex items-center justify-center gap-1.5 bg-danger text-white rounded-[20px] px-5 py-2.5 min-w-[120px] text-[12.5px] font-bold hover:brightness-95 transition disabled:opacity-60">
            {removing ? <Wave className="h-3.5 w-8 text-white" /> : t('detail.confirm')}
          </button>
        </div>
      </Modal>
    </div>
  )
}