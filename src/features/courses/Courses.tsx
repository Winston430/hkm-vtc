import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Plus, PencilSimple, Trash, GraduationCap } from '@phosphor-icons/react'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../lib/toast'
import { useCourses, addCourse, updateCourse, deleteCourse } from '../../lib/services/catalog'
import { durationLabel } from '../../lib/course'
import { formatMoney } from '../../lib/format'
import { Modal } from '../../components/ui/Modal'
import { Dropdown } from '../../components/ui/Dropdown'
import { Skeleton } from '../../components/ui/skeleton'
import { Wave } from '../../components/loading-ui/wave'
import type { Course, DurationUnit } from '../../lib/types'

const inputClass =
  'w-full text-[13.5px] font-medium text-ink bg-surface-soft rounded-md py-3 px-3.5 outline-none transition placeholder:text-ink-muted focus:bg-surface focus:shadow-[0_0_0_3px_rgba(23,23,23,0.07),inset_0_0_0_1.5px_rgba(23,23,23,0.12)]'
const empty = { name: '', code: '', category: '', durationValue: '1', durationUnit: 'months' as DurationUnit, price: '', active: true }

export default function Courses() {
  const { profile } = useAuth()
  const { t } = useI18n()
  const toast = useToast()
  const { courses, loading } = useCourses(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<typeof empty>(empty)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<Course | null>(null)
  const [removing, setRemoving] = useState(false)

  const grouped = useMemo(() => {
    const map = new Map<string, Course[]>()
    courses.forEach((c) => { const k = c.category || '—'; if (!map.has(k)) map.set(k, []); map.get(k)!.push(c) })
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [courses])

  if (profile?.role !== 'admin') return <Navigate to="/" replace />

  function openAdd() { setEditingId(null); setForm(empty); setFormOpen(true) }
  function openEdit(c: Course) {
    setEditingId(c.id)
    setForm({ name: c.name, code: c.code ?? '', category: c.category, durationValue: String(c.durationValue ?? c.durationMonths ?? 1), durationUnit: c.durationUnit ?? 'months', price: String(c.price), active: c.active })
    setFormOpen(true)
  }
  const valid = form.name.trim() && form.code.trim() && form.category.trim() && Number(form.durationValue) > 0 && Number(form.price) > 0

  async function save() {
    if (!valid) return
    setSaving(true)
    try {
      const val = Number(form.durationValue)
      const data: Omit<Course, 'id'> = { name: form.name.trim(), code: form.code.trim().toUpperCase(), category: form.category.trim(), durationValue: val, durationUnit: form.durationUnit, price: Number(form.price), active: form.active }
      // keep legacy durationMonths in sync only for month-based courses (never write undefined)
      if (form.durationUnit === 'months') data.durationMonths = val
      if (editingId) await updateCourse(editingId, data); else await addCourse(data)
      toast.success(t('courses.saved')); setFormOpen(false)
    } catch { toast.error(t('courses.saveError')) } finally { setSaving(false) }
  }
  async function confirmDelete() {
    if (!deleting) return
    setRemoving(true)
    try { await deleteCourse(deleting.id); toast.success(t('courses.deleted')); setDeleting(null) }
    catch { toast.error(t('courses.deleteError')) } finally { setRemoving(false) }
  }

  return (
    <div className="p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div><h1 className="text-[19px] font-extrabold tracking-[-0.3px]">{t('courses.title')}</h1><p className="text-[12.5px] text-ink-secondary mt-1">{t('courses.subtitle')}</p></div>
        <button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-primary text-on-primary rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold hover:opacity-90 transition"><Plus size={15} /> {t('courses.add')}</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[0,1,2,3,4,5].map((i) => <Skeleton key={i} className="h-[150px] w-full rounded-[18px]" />)}</div>
      ) : courses.length === 0 ? (
        <div className="bg-surface rounded-[18px] shadow-soft py-16 text-center"><div className="w-12 h-12 rounded-full bg-surface-soft grid place-items-center mx-auto text-ink-muted mb-3"><GraduationCap size={24} /></div><div className="font-extrabold text-[15px]">{t('courses.empty')}</div><div className="text-[12.5px] text-ink-secondary mt-1 mb-4">{t('courses.emptyHint')}</div><button onClick={openAdd} className="inline-flex items-center gap-1.5 bg-primary text-on-primary rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold hover:opacity-90 transition"><Plus size={15} /> {t('courses.add')}</button></div>
      ) : (
        <div className="flex flex-col gap-7">
          {grouped.map(([cat, list]) => (
            <div key={cat}>
              <div className="text-[11px] font-bold text-ink-muted tracking-wide mb-3">{cat.toUpperCase()}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {list.map((c) => (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={`bg-surface rounded-[18px] shadow-soft p-5 flex flex-col ${c.active ? '' : 'opacity-60'}`}>
                    <div className="flex items-start justify-between gap-2"><div className="font-extrabold text-[14px] leading-snug">{c.name}</div><span className="shrink-0 bg-surface-soft rounded-[6px] px-2 py-0.5 text-[10.5px] font-bold text-ink-secondary tabular-nums">{c.code}</span></div>
                    <div className="text-[10.5px] text-ink-muted font-semibold mt-1">{durationLabel(c)}</div>
                    <div className="text-[22px] font-extrabold tracking-[-0.4px] mt-3 tabular-nums"><small className="text-[13px] font-bold text-ink-muted mr-0.5">TSh</small>{formatMoney(c.price)}</div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-hair">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${c.active ? 'text-success' : 'text-ink-muted'}`}><span className={`w-1.5 h-1.5 rounded-full ${c.active ? 'bg-success' : 'bg-ink-muted'}`} />{c.active ? t('courses.active') : t('courses.inactive')}</span>
                      <div className="flex gap-1.5"><button onClick={() => openEdit(c)} className="w-8 h-8 rounded-lg bg-surface-soft hover:bg-hover grid place-items-center text-ink-secondary transition"><PencilSimple size={15} /></button><button onClick={() => setDeleting(c)} className="w-8 h-8 rounded-lg bg-surface-soft hover:bg-hover grid place-items-center text-danger transition"><Trash size={15} /></button></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingId ? t('courses.edit') : t('courses.add')} maxWidth={480}>
        <div className="flex flex-col gap-4">
          <div><label className="block text-[12px] font-bold mb-[7px] text-ink">{t('courses.name')}</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[12px] font-bold mb-[7px] text-ink">{t('courses.code')}</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className={inputClass} maxLength={5} /><div className="text-[10px] text-ink-muted font-semibold mt-1">{t('courses.codeHint')}</div></div>
            <div><label className="block text-[12px] font-bold mb-[7px] text-ink">{t('courses.category')}</label><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder={t('courses.categoryPh')} className={inputClass} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-[12px] font-bold mb-[7px] text-ink">{t('courses.duration')}</label><input type="number" min="1" value={form.durationValue} onChange={(e) => setForm({ ...form, durationValue: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[12px] font-bold mb-[7px] text-ink">{t('courses.durationUnit')}</label><Dropdown value={form.durationUnit} onChange={(v) => setForm({ ...form, durationUnit: v as DurationUnit })} options={[{ value: 'months', label: t('courses.months') }, { value: 'weeks', label: t('courses.weeks') }]} /></div>
            <div><label className="block text-[12px] font-bold mb-[7px] text-ink">{t('courses.price')}</label><input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} /></div>
          </div>
          <div className="flex items-center justify-between"><span className="text-[12px] font-bold text-ink">{form.active ? t('courses.active') : t('courses.inactive')}</span><button type="button" onClick={() => setForm({ ...form, active: !form.active })} className={`w-11 h-6 rounded-full transition relative ${form.active ? 'bg-success' : 'bg-surface-soft'}`}><span className={`absolute top-0.5 w-5 h-5 rounded-full bg-surface shadow transition-all ${form.active ? 'left-[22px]' : 'left-0.5'}`} /></button></div>
          <div className="flex justify-end gap-2 mt-1"><button onClick={() => setFormOpen(false)} disabled={saving} className="bg-surface-soft hover:bg-hover rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold text-ink-secondary transition">{t('detail.cancel')}</button><button onClick={save} disabled={saving || !valid} className="inline-flex items-center justify-center gap-1.5 bg-primary text-on-primary rounded-[20px] px-5 py-2.5 min-w-[150px] text-[12.5px] font-bold hover:opacity-90 transition disabled:opacity-50">{saving ? <Wave className="h-3.5 w-8" /> : t('courses.save')}</button></div>
        </div>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title={t('courses.deleteTitle')} maxWidth={420}>
        <div className="text-[13px] text-ink-secondary font-semibold">{t('courses.deleteConfirm')}</div>
        <div className="text-[13px] font-extrabold mt-2">{deleting?.name}</div>
        <div className="flex justify-end gap-2 mt-5"><button onClick={() => setDeleting(null)} disabled={removing} className="bg-surface-soft hover:bg-hover rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold text-ink-secondary transition">{t('detail.cancel')}</button><button onClick={confirmDelete} disabled={removing} className="inline-flex items-center justify-center gap-1.5 bg-danger text-white rounded-[20px] px-5 py-2.5 min-w-[120px] text-[12.5px] font-bold hover:brightness-95 transition disabled:opacity-60">{removing ? <Wave className="h-3.5 w-8 text-white" /> : t('detail.confirm')}</button></div>
      </Modal>
    </div>
  )
}