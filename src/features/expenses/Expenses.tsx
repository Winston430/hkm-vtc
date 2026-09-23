import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Plus, Trash, Wallet, MagnifyingGlass, DownloadSimple } from '@phosphor-icons/react'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../lib/toast'
import { useExpenses, addExpense, deleteExpense } from '../../lib/services/expenses'
import { useBranches } from '../../lib/services/catalog'
import { Modal } from '../../components/ui/Modal'
import { Dropdown } from '../../components/ui/Dropdown'
import { Skeleton } from '../../components/ui/skeleton'
import { Wave } from '../../components/loading-ui/wave'
import { formatMoney, formatCompact, formatDate } from '../../lib/format'
import type { Expense } from '../../lib/types'

type Range = 'all' | 'week' | 'month' | 'year'
function rangeStart(r: Range): number {
  const n = new Date()
  if (r === 'week') return n.getTime() - 7 * 864e5
  if (r === 'month') return new Date(n.getFullYear(), n.getMonth(), 1).getTime()
  if (r === 'year') return new Date(n.getFullYear(), 0, 1).getTime()
  return 0
}
const inputClass = 'w-full text-[13.5px] font-medium text-ink bg-surface-soft rounded-md py-3 px-3.5 outline-none transition placeholder:text-ink-muted focus:bg-surface focus:shadow-[0_0_0_3px_rgba(23,23,23,0.07),inset_0_0_0_1.5px_rgba(23,23,23,0.12)]'
const emptyForm = { title: '', amount: '', category: '', branchId: 'general' }

export default function Expenses() {
  const { profile, user } = useAuth()
  const role = profile?.role ?? 'admin'
  const isAdmin = role === 'admin'
  const myBranch = profile?.branchId ?? null
  const { t } = useI18n()
  const toast = useToast()
  const { expenses, loading } = useExpenses(role, myBranch)
  const { branches } = useBranches()

  const [range, setRange] = useState<Range>('month')
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ ...emptyForm, branchId: profile?.role === 'admin' ? 'general' : (profile?.branchId ?? '') })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<Expense | null>(null)

  const branchName = (id: string | null) => (id ? branches.find((b) => b.id === id)?.name ?? '—' : t('exp.general'))
  const categories = useMemo(() => [...new Set(expenses.map((e) => e.category))].sort(), [expenses])

  const filtered = useMemo(() => {
    const start = rangeStart(range); const q = search.trim().toLowerCase()
    return expenses.filter((e) => e.createdAt >= start && (cat === 'all' || e.category === cat) && (!q || e.title.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)))
  }, [expenses, range, cat, search])
  const total = filtered.reduce((s, e) => s + e.amount, 0)

  const valid = form.title.trim() && Number(form.amount) > 0 && form.category.trim()
  async function save() {
    if (!valid) return
    setSaving(true)
    try {
      const branchId = isAdmin ? (form.branchId === 'general' ? null : form.branchId) : myBranch
      await addExpense({ title: form.title.trim(), amount: Number(form.amount), category: form.category.trim(), kind: 'expense', branchId, recordedBy: user?.uid ?? '' })
      toast.success(t('exp.saved')); setFormOpen(false); setForm({ ...emptyForm, branchId: isAdmin ? 'general' : (myBranchId ?? '') })
    } catch { toast.error(t('exp.saveError')) } finally { setSaving(false) }
  }
  async function confirmDelete() { if (!deleting) return; try { await deleteExpense(deleting.id); toast.success(t('exp.deleted')); setDeleting(null) } catch { toast.error(t('exp.saveError')) } }

  function exportCsv() {
    const rows = [['Date', 'Title', 'Category', 'Branch', 'Amount'], ...filtered.map((e) => [formatDate(e.createdAt), e.title, e.category, branchName(e.branchId), String(e.amount)])]
    const csv = rows.map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a'); a.href = url; a.download = `hkm-expenses-${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  const ranges: { key: Range; label: string }[] = [{ key: 'all', label: t('reports.all') }, { key: 'week', label: t('reports.week') }, { key: 'month', label: t('reports.month') }, { key: 'year', label: t('reports.year') }]

  return (
    <div className="p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div><h1 className="text-[19px] font-extrabold tracking-[-0.3px]">{t('exp.title')}</h1><p className="text-[12.5px] text-ink-secondary mt-1">{t('exp.subtitle')}</p></div>
        <button onClick={() => setFormOpen(true)} className="inline-flex items-center gap-1.5 bg-primary text-on-primary rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold hover:opacity-90 transition"><Plus size={15} /> {t('exp.add')}</button>
      </div>

      <div className="rounded-[18px] p-[18px] min-h-[92px] flex flex-col justify-between bg-accent-purple max-w-[280px] mb-5 relative">
        <div className="text-[12px] font-bold text-black/[0.62]">{t('exp.total')}</div>
        {loading ? <Skeleton className="h-7 w-24 bg-black/10" /> : <div className="text-[24px] font-extrabold tracking-[-0.5px] text-ink"><small className="text-[13px] font-bold text-black/[0.55] mr-0.5">TSh</small>{formatCompact(total)}</div>}
        <div className="absolute right-4 top-4 w-[30px] h-[30px] rounded-full bg-white/70 grid place-items-center text-ink"><Wallet size={15} /></div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="inline-flex bg-surface-soft rounded-[20px] p-1">{ranges.map((r) => (<button key={r.key} onClick={() => setRange(r.key)} className={`px-3.5 py-1.5 rounded-[16px] text-[12px] font-bold transition ${range === r.key ? 'bg-surface text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]' : 'text-ink-muted hover:text-ink'}`}>{r.label}</button>))}</div>
        <div className="relative flex-1 min-w-[180px] max-w-[280px]"><MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('exp.name')} className="w-full text-[13px] font-medium text-ink bg-surface-soft rounded-md py-2.5 pl-10 pr-3.5 outline-none transition placeholder:text-ink-muted focus:bg-surface focus:shadow-[0_0_0_3px_rgba(23,23,23,0.07),inset_0_0_0_1.5px_rgba(23,23,23,0.12)]" /></div>
        {categories.length > 0 && <div className="w-[170px]"><Dropdown value={cat} onChange={setCat} options={[{ value: 'all', label: t('exp.allCategories') }, ...categories.map((c) => ({ value: c, label: c }))]} /></div>}
        <button onClick={exportCsv} disabled={filtered.length === 0} className="inline-flex items-center gap-1.5 bg-surface-soft hover:bg-hover rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold text-ink-secondary transition disabled:opacity-40"><DownloadSimple size={15} /> CSV</button>
      </div>

      <div className="bg-surface rounded-[18px] shadow-soft px-1 py-1.5">
        {loading ? (<div className="p-4 flex flex-col gap-3">{[0,1,2,3].map((i) => <Skeleton key={i} className="h-4 w-full" />)}</div>)
        : expenses.length === 0 ? (<div className="py-16 text-center"><div className="w-12 h-12 rounded-full bg-surface-soft grid place-items-center mx-auto text-ink-muted mb-3"><Wallet size={24} /></div><div className="font-extrabold text-[15px]">{t('exp.empty')}</div><div className="text-[12.5px] text-ink-secondary mt-1">{t('exp.emptyHint')}</div></div>)
        : filtered.length === 0 ? (<div className="py-14 text-center text-[13px] text-ink-muted font-semibold">{t('common.empty')}</div>)
        : (
          <table className="w-full border-collapse">
            <thead><tr>
              <th className="text-left text-[10.5px] font-bold text-ink-muted px-4 pt-3 pb-2.5">{t('exp.colTitle')}</th>
              <th className="text-left text-[10.5px] font-bold text-ink-muted px-4 pt-3 pb-2.5">{t('exp.colCategory')}</th>
              <th className="text-left text-[10.5px] font-bold text-ink-muted px-4 pt-3 pb-2.5">{t('exp.colBranch')}</th>
              <th className="text-left text-[10.5px] font-bold text-ink-muted px-4 pt-3 pb-2.5">{t('exp.colDate')}</th>
              <th className="text-right text-[10.5px] font-bold text-ink-muted px-4 pt-3 pb-2.5">{t('exp.colAmount')}</th>
              <th className="w-10"></th>
            </tr></thead>
            <tbody>
              {filtered.map((e, i) => (
                <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={i === 0 ? '' : 'border-t border-hair'}>
                  <td className="px-4 py-2.5 font-bold text-[12.5px]">{e.title}</td>
                  <td className="px-4 py-2.5 text-[12px] text-ink-secondary">{e.category}</td>
                  <td className="px-4 py-2.5 text-[12px] text-ink-secondary">{branchName(e.branchId)}</td>
                  <td className="px-4 py-2.5 text-[12px] text-ink-secondary tabular-nums">{formatDate(e.createdAt)}</td>
                  <td className="px-4 py-2.5 text-right font-extrabold text-[12.5px] tabular-nums text-danger">−TSh {formatMoney(e.amount)}</td>
                  <td className="px-2 py-2.5 text-right">{isAdmin && <button onClick={() => setDeleting(e)} className="w-7 h-7 rounded-lg hover:bg-hover grid place-items-center text-ink-muted hover:text-danger transition"><Trash size={13} /></button>}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={t('exp.add')} maxWidth={440}>
        <div className="flex flex-col gap-4">
          <div><label className="block text-[12px] font-bold mb-[7px] text-ink">{t('exp.name')}</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[12px] font-bold mb-[7px] text-ink">{t('exp.amount')}</label><input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-[12px] font-bold mb-[7px] text-ink">{t('exp.category')}</label><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder={t('exp.categoryPh')} className={inputClass} /></div>
          </div>
          <div><label className="block text-[12px] font-bold mb-[7px] text-ink">{t('exp.branch')}</label>{isAdmin ? <Dropdown value={form.branchId} onChange={(v) => setForm({ ...form, branchId: v })} options={[{ value: 'general', label: t('exp.general') }, ...branches.map((b) => ({ value: b.id, label: b.name }))]} /> : <input disabled value={branchName(myBranch)} className={inputClass + ' opacity-60'} />}</div>
          <div className="flex justify-end gap-2 mt-1"><button onClick={() => setFormOpen(false)} disabled={saving} className="bg-surface-soft hover:bg-hover rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold text-ink-secondary transition">{t('detail.cancel')}</button><button onClick={save} disabled={saving || !valid} className="inline-flex items-center justify-center gap-1.5 bg-primary text-on-primary rounded-[20px] px-5 py-2.5 min-w-[150px] text-[12.5px] font-bold hover:opacity-90 transition disabled:opacity-50">{saving ? <Wave className="h-3.5 w-8" /> : t('exp.save')}</button></div>
        </div>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title={t('exp.deleteConfirm')} maxWidth={400}>
        <div className="text-[13px] font-extrabold mt-1">{deleting?.title}</div>
        <div className="flex justify-end gap-2 mt-5"><button onClick={() => setDeleting(null)} className="bg-surface-soft hover:bg-hover rounded-[20px] px-4 py-2.5 text-[12.5px] font-bold text-ink-secondary transition">{t('detail.cancel')}</button><button onClick={confirmDelete} className="bg-danger text-white rounded-[20px] px-5 py-2.5 text-[12.5px] font-bold hover:brightness-95 transition">{t('detail.confirm')}</button></div>
      </Modal>
    </div>
  )
}