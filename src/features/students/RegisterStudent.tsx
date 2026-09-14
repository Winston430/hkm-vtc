import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Camera, CheckCircle, Check, ArrowRight, ArrowLeft } from '@phosphor-icons/react'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../lib/toast'
import { useBusy } from '../../lib/busy'
import { UploadError, TimeoutError } from '../../lib/async'
import { useCourses, useBranches } from '../../lib/services/catalog'
import { registerStudent, courseCode } from '../../lib/services/students'
import { installmentPlan } from '../../lib/installments'
import { formatMoney } from '../../lib/format'
import { Wave } from '../../components/loading-ui/wave'
import { Dropdown } from '../../components/ui/Dropdown'

const inputClass =
  'w-full text-[13.5px] font-medium text-ink bg-surface-soft rounded-md py-3 px-3.5 outline-none transition placeholder:text-ink-muted focus:bg-white focus:shadow-[0_0_0_3px_rgba(23,23,23,0.07),inset_0_0_0_1.5px_rgba(23,23,23,0.12)]'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-bold mb-[7px] text-ink">{label}</label>
      {children}
    </div>
  )
}

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 28 : -28 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -28 : 28 }),
}

export default function RegisterStudent() {
  const { profile, user } = useAuth()
  const { t } = useI18n()
  const toast = useToast()
  const busy = useBusy()
  const navigate = useNavigate()
  const { courses } = useCourses()
  const { branches } = useBranches()
  const isAgent = profile?.role === 'agent'

  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [saving, setSaving] = useState(false)

  const [fullName, setFullName] = useState('')
  const [gender, setGender] = useState('Male')
  const [phone, setPhone] = useState('')
  const [nida, setNida] = useState('')
  const [tin, setTin] = useState('')
  const [residence, setResidence] = useState('')
  const [nokName, setNokName] = useState('')
  const [nokRel, setNokRel] = useState('')
  const [nokPhone, setNokPhone] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [branchId, setBranchId] = useState(isAgent ? profile?.branchId ?? '' : '')
  const [courseId, setCourseId] = useState('')
  const [installmentsPaid, setInstallmentsPaid] = useState(1)
  const [bankRef, setBankRef] = useState('')

  const course = useMemo(() => courses.find((c) => c.id === courseId), [courses, courseId])
  const branch = useMemo(
    () => branches.find((b) => b.id === branchId) ?? (isAgent ? { id: profile?.branchId ?? '', name: profile?.branchId ?? '' } : undefined),
    [branches, branchId, isAgent, profile]
  )
  const plan = useMemo(() => (course ? installmentPlan(course) : null), [course])
  const periodLabel = plan ? (plan.fortnightly ? t('reg.twoWeeks') : t('reg.oneMonth')) : ''
  const amountNow = plan ? plan.amounts.slice(0, installmentsPaid).reduce((s, a) => s + a, 0) : 0
  const balanceAfter = course ? Math.max(0, course.price - amountNow) : 0

  const instOptions = plan
    ? plan.amounts.map((_, i) => {
        const k = i + 1
        const amt = plan.amounts.slice(0, k).reduce((s, a) => s + a, 0)
        const label =
          k === plan.count
            ? `${t('reg.fullPayment')} — TSh ${formatMoney(amt)}`
            : k === 1
            ? `${t('reg.installmentWord')} 1 — TSh ${formatMoney(amt)}`
            : `${t('reg.installmentsWord')} 1–${k} — TSh ${formatMoney(amt)}`
        return { value: String(k), label }
      })
    : []

  const paymentPeriod = plan
    ? installmentsPaid === plan.count
      ? t('reg.fullPayment')
      : installmentsPaid === 1
      ? `${t('reg.installmentWord')} 1/${plan.count}`
      : `${t('reg.installmentsWord')} 1–${installmentsPaid}/${plan.count}`
    : ''

  const STEPS = [t('reg.step.personal'), t('reg.step.course'), t('reg.step.payment'), t('reg.step.confirm')]

  const canNext =
    step === 0
      ? Boolean(
          fullName.trim() && phone.trim() && residence.trim() &&
          nokName.trim() && nokRel.trim() && nokPhone.trim()
        )
      : step === 1
      ? Boolean(courseId && branchId)
      : step === 2
      ? Boolean(bankRef.trim() && course)
      : true

  function onPhoto(file: File | null) {
    setPhoto(file)
    setPhotoPreview(file ? URL.createObjectURL(file) : '')
  }

  async function submit() {
    // early feedback before touching the backend
    if (!course || !branch || !bankRef.trim()) {
      toast.error(t('err.missing'))
      return
    }
    setSaving(true)
    try {
      const { regNo } = await busy.run(
        () =>
          registerStudent(
            {
              branchId: branch.id,
              branchName: branch.name,
              fullName: fullName.trim(),
              gender,
              phone: phone.trim(),
              nida: nida.trim(),
              tin: tin.trim(),
              residence: residence.trim(),
              nextOfKin: { name: nokName.trim(), relationship: nokRel.trim(), residence: '', phone: nokPhone.trim() },
              course,
              firstPayment: { amount: amountNow, period: paymentPeriod, bankRef: bankRef.trim() },
              createdBy: user?.uid ?? '',
            },
            photo
          ),
        { message: t('busy.registering'), timeoutMs: 30000 }
      )
      toast.success(t('reg.success'), `${fullName.trim()} · ${regNo}`)
      navigate('/students', { replace: true })
    } catch (err) {
      if (err instanceof UploadError) toast.error(t('err.photo'))
      else if (err instanceof TimeoutError) toast.error(t('err.timeout'))
      else toast.error(t('reg.error'))
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* header + stepper */}
      <div className="px-6 sm:px-8 pt-7">
        <h1 className="text-[19px] font-extrabold tracking-[-0.3px]">{t('reg.title')}</h1>
        <p className="text-[12.5px] text-ink-secondary mt-1">{t('reg.subtitle')}</p>
        <div className="flex items-center mt-6 max-w-[720px]">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full grid place-items-center text-[12px] font-bold shrink-0 transition ${i <= step ? 'bg-ink text-white' : 'bg-surface-soft text-ink-muted'}`}>
                  {i < step ? <Check size={15} weight="bold" /> : i + 1}
                </div>
                <span className={`text-[12.5px] font-bold hidden sm:block ${i === step ? 'text-ink' : 'text-ink-muted'}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`h-[2px] flex-1 mx-3 rounded ${i < step ? 'bg-ink' : 'bg-surface-soft'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* step content */}
      <div className="flex-1 px-6 sm:px-8 py-6">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
        {step === 0 && (
          <div className="bg-surface rounded-[18px] shadow-soft p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="shrink-0">
                <label className="cursor-pointer block w-[120px]">
                  <div className="w-[120px] h-[150px] rounded-[14px] bg-surface-soft grid place-items-center overflow-hidden text-ink-muted">
                    {photoPreview ? <img src={photoPreview} alt="" className="w-full h-full object-cover" /> : (
                      <div className="text-center"><Camera size={24} /><div className="text-[10px] font-semibold mt-1">{t('reg.photoHint')}</div></div>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Field label={t('reg.fullName')}><input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} /></Field>
                  <Field label={t('reg.gender')}>
                    <Dropdown value={gender} onChange={setGender} placeholder={t('reg.genderPh')}
                      options={[{ value: 'Male', label: t('reg.male') }, { value: 'Female', label: t('reg.female') }]} />
                  </Field>
                  <Field label={t('reg.phone')}><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} /></Field>
                  <Field label={t('reg.nida')}><input value={nida} onChange={(e) => setNida(e.target.value)} className={inputClass} /></Field>
                  <Field label={t('reg.tin')}><input value={tin} onChange={(e) => setTin(e.target.value)} className={inputClass} /></Field>
                  <Field label={t('reg.residence')}><input value={residence} onChange={(e) => setResidence(e.target.value)} className={inputClass} /></Field>
                </div>
                <div className="text-[12px] font-bold mt-6 mb-3 text-ink">{t('reg.nok')}</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label={t('reg.nokName')}><input value={nokName} onChange={(e) => setNokName(e.target.value)} className={inputClass} /></Field>
                  <Field label={t('reg.nokRelationship')}><input value={nokRel} onChange={(e) => setNokRel(e.target.value)} className={inputClass} /></Field>
                  <Field label={t('reg.nokPhone')}><input value={nokPhone} onChange={(e) => setNokPhone(e.target.value)} className={inputClass} /></Field>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="bg-surface rounded-[18px] shadow-soft p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[720px]">
              <Field label={t('reg.selectCourse')}>
                <Dropdown value={courseId} onChange={(v) => { setCourseId(v); setInstallmentsPaid(1) }} placeholder={t('reg.selectCoursePh')}
                  options={courses.map((c) => ({ value: c.id, label: c.name, hint: `${c.durationMonths}mo · TSh ${formatMoney(c.price)} · ${courseCode(c)}` }))} />
              </Field>
              <Field label={t('reg.branch')}>
                {isAgent ? <input disabled value={branch?.name ?? '—'} className={inputClass + ' opacity-70'} />
                  : <Dropdown value={branchId} onChange={setBranchId} placeholder={t('reg.selectBranchPh')} options={branches.map((b) => ({ value: b.id, label: b.name }))} />}
              </Field>
            </div>
            {course && (
              <div className="mt-4 inline-flex items-center gap-2 bg-surface-soft rounded-md px-4 py-3 text-[13px]">
                <span className="font-semibold text-ink-secondary">{t('reg.totalFee')}:</span>
                <span className="font-extrabold tabular-nums">TSh {formatMoney(course.price)}</span>
              </div>
            )}
          </div>
        )}

        {step === 2 && plan && course && (
          <div className="bg-surface rounded-[18px] shadow-soft p-6 max-w-[720px]">
            {/* plan summary */}
            <div className="bg-surface-soft rounded-md px-4 py-3.5 text-[12.5px] font-semibold text-ink-secondary mb-5">
              {t('reg.planLine')}{' '}
              <span className="font-extrabold text-ink">{plan.count} {t('reg.installmentsWord').toLowerCase()}</span>{' '}
              — TSh <span className="font-extrabold text-ink tabular-nums">{formatMoney(plan.amounts[0])}</span> {periodLabel} {t('reg.each')}.
            </div>
            <div className="text-[11px] text-ink-muted font-semibold mb-4">{t('reg.bankRefHint')}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t('reg.chooseInstallment')}>
                <Dropdown value={String(installmentsPaid)} onChange={(v) => setInstallmentsPaid(Number(v))} options={instOptions} />
              </Field>
              <Field label={t('reg.bankRef')}>
                <input value={bankRef} onChange={(e) => setBankRef(e.target.value)} className={inputClass} />
              </Field>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink-secondary">{t('reg.amountNow')}:</span>
                <span className="font-extrabold tabular-nums">TSh {formatMoney(amountNow)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink-secondary">{t('reg.balanceAfter')}:</span>
                <span className={`font-extrabold tabular-nums ${balanceAfter > 0 ? 'text-warning' : 'text-success'}`}>TSh {formatMoney(balanceAfter)}</span>
                {balanceAfter <= 0 && <CheckCircle size={16} weight="fill" className="text-success" />}
              </div>
            </div>
          </div>
        )}

        {step === 3 && course && branch && (
          <div className="bg-surface rounded-[18px] shadow-soft p-6 max-w-[820px]">
            <div className="text-[14px] font-extrabold">{t('reg.reviewTitle')}</div>
            <div className="text-[12px] text-ink-secondary mt-0.5 mb-5">{t('reg.reviewHint')}</div>
            <div className="flex items-center gap-4 pb-5 mb-5 border-b border-[#F1F1F1]">
              <div className="w-[64px] h-[80px] rounded-[12px] bg-surface-soft overflow-hidden grid place-items-center text-ink-muted shrink-0">
                {photoPreview ? <img src={photoPreview} alt="" className="w-full h-full object-cover" /> : <Camera size={20} />}
              </div>
              <div>
                <div className="font-extrabold text-[16px]">{fullName}</div>
                <div className="text-[12px] text-ink-muted font-semibold mt-0.5">{t('reg.regNoPreview')}: <span className="tabular-nums">HKM/VTC/{courseCode(course)}/••••</span></div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3.5 text-[12.5px]">
              <Review label={t('reg.gender')} value={gender === 'Male' ? t('reg.male') : t('reg.female')} />
              <Review label={t('reg.phone')} value={phone} />
              <Review label={t('reg.residence')} value={residence} />
              <Review label={t('reg.nida')} value={nida || '—'} />
              <Review label={t('reg.tin')} value={tin || '—'} />
              <Review label={t('reg.nok')} value={`${nokName} (${nokRel})`} />
              <Review label={t('reg.branch')} value={branch.name} />
              <Review label={t('reg.section.course')} value={course.name} />
              <Review label={t('reg.totalFee')} value={`TSh ${formatMoney(course.price)}`} />
              <Review label={t('reg.amountNow')} value={`TSh ${formatMoney(amountNow)} (${paymentPeriod})`} />
              <Review label={t('reg.bankRef')} value={bankRef} />
              <Review label={t('reg.balanceAfter')} value={`TSh ${formatMoney(balanceAfter)}`} />
            </div>
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* footer nav */}
      <div className="px-6 sm:px-8 py-4 flex items-center justify-between bg-canvas sticky bottom-0">
        <button type="button" onClick={() => { setDir(-1); setStep((s) => Math.max(0, s - 1)) }} disabled={step === 0 || saving}
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-secondary hover:text-ink px-4 py-3 rounded-md disabled:opacity-40 transition">
          <ArrowLeft size={16} />{t('reg.backStep')}
        </button>
        <div className="text-[11.5px] font-bold text-ink-muted hidden sm:block">{t('reg.stepLabel')} {step + 1} {t('reg.of')} {STEPS.length}</div>
        {step < 3 ? (
          <button type="button" onClick={() => { if (canNext) { setDir(1); setStep((s) => Math.min(3, s + 1)) } }} disabled={!canNext}
            className="inline-flex items-center gap-2 text-sm font-bold text-white bg-ink rounded-md min-h-[46px] px-6 hover:bg-black transition disabled:opacity-40">
            {t('reg.next')}<ArrowRight size={16} />
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={saving}
            className="inline-flex items-center justify-center gap-2 text-sm font-bold text-white bg-ink rounded-md min-h-[46px] min-w-[180px] px-6 hover:bg-black transition disabled:opacity-60">
            {saving ? <Wave className="h-4 w-10 text-white" /> : t('reg.submit')}
          </button>
        )}
      </div>
    </div>
  )
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10.5px] font-bold text-ink-muted">{label}</div>
      <div className="font-semibold text-ink mt-0.5 break-words">{value}</div>
    </div>
  )
}