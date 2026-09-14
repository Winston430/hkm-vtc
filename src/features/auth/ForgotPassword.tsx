import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { EnvelopeSimple, ArrowLeft, ArrowRight, CheckCircle } from '@phosphor-icons/react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../lib/toast'
import { Wave } from '../../components/loading-ui/wave'
import AuthShell from './AuthShell'

export default function ForgotPassword() {
  const { t } = useI18n()
  const toast = useToast()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setSent(true)
    } catch {
      // Generic error only — we don't reveal whether an email is registered.
      toast.error(t('forgot.error'))
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full text-[13.5px] font-medium text-ink bg-surface-soft rounded-md py-3.5 pl-[42px] pr-3.5 outline-none transition placeholder:text-ink-muted focus:bg-white focus:shadow-[0_0_0_3px_rgba(23,23,23,0.07),inset_0_0_0_1.5px_rgba(23,23,23,0.12)]'

  return (
    <AuthShell>
      <Link
        to="/login"
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-ink-secondary hover:text-ink mb-6 transition"
      >
        <ArrowLeft size={15} />
        {t('forgot.back')}
      </Link>

      {sent ? (
        <div>
          <span className="grid place-items-center w-12 h-12 rounded-full bg-[rgba(88,166,108,0.12)] text-success mb-4">
            <CheckCircle size={26} weight="fill" />
          </span>
          <h1 className="text-3xl font-extrabold tracking-[-0.6px] text-ink">
            {t('forgot.sentTitle')}
          </h1>
          <p className="text-[13.5px] text-ink-secondary mt-1.5">
            {t('forgot.sentMsg')}
          </p>
          <Link
            to="/login"
            className="mt-7 w-full text-sm font-bold text-white bg-ink rounded-md min-h-[50px] flex items-center justify-center gap-2 transition hover:bg-black"
          >
            {t('forgot.back')}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h1 className="text-3xl font-extrabold tracking-[-0.6px] text-ink">
            {t('forgot.title')}
          </h1>
          <p className="text-[13.5px] text-ink-secondary mt-1.5 mb-7">
            {t('forgot.subtitle')}
          </p>

          <div className="mb-6">
            <label className="block text-[12px] font-bold mb-[7px] text-ink">
              {t('login.email')}
            </label>
            <div className="relative flex items-center">
              <EnvelopeSimple size={17} className="absolute left-3.5 text-ink-muted pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-sm font-bold text-white bg-ink rounded-md min-h-[50px] flex items-center justify-center gap-2 transition hover:bg-black disabled:opacity-80"
          >
            {loading ? (
              <Wave className="h-4 w-10 text-white" />
            ) : (
              <>
                {t('forgot.send')}
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>
      )}
    </AuthShell>
  )
}