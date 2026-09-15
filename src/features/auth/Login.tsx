import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  EnvelopeSimple,
  LockSimple,
  Eye,
  EyeSlash,
  ArrowRight,
  Check,
} from '@phosphor-icons/react'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../lib/i18n'
import { useToast } from '../../lib/toast'
import { Wave } from '../../components/loading-ui/wave'
import AuthShell from './AuthShell'

export default function Login() {
  const { signIn } = useAuth()
  const { t } = useI18n()
  const toast = useToast()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(email.trim(), password)
      toast.success(t('login.welcome'))
      navigate('/', { replace: true })
    } catch {
      toast.error(t('login.error'))
      setLoading(false)
    }
  }

  const inputClass =
    'w-full text-[13.5px] font-medium text-ink bg-surface-soft rounded-md py-3.5 pl-[42px] pr-3.5 outline-none transition placeholder:text-ink-muted focus:bg-surface focus:shadow-[0_0_0_3px_rgba(23,23,23,0.07),inset_0_0_0_1.5px_rgba(23,23,23,0.12)]'

  return (
    <AuthShell>
      <form onSubmit={handleSubmit}>
        <h1 className="text-3xl font-extrabold tracking-[-0.6px] text-ink">
          {t('login.welcome')}
        </h1>
        <p className="text-[13.5px] text-ink-secondary mt-1.5 mb-7">
          {t('login.subtitle')}
        </p>

        <div className="mb-4">
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

        <div className="mb-1">
          <label className="block text-[12px] font-bold mb-[7px] text-ink">
            {t('login.password')}
          </label>
          <div className="relative flex items-center">
            <LockSimple size={17} className="absolute left-3.5 text-ink-muted pointer-events-none" />
            <input
              type={showPw ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('login.passwordPlaceholder')}
              className={inputClass + ' pr-11'}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              aria-label="Toggle password visibility"
              className="absolute right-3 text-ink-muted grid place-items-center"
            >
              {showPw ? <Eye size={18} /> : <EyeSlash size={18} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 mb-6">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="hidden peer"
            />
            <span className="w-[17px] h-[17px] rounded-[5px] bg-surface-soft grid place-items-center text-transparent peer-checked:bg-primary peer-checked:text-on-primary transition">
              <Check size={11} weight="bold" />
            </span>
            <span className="text-[12px] font-semibold text-ink-secondary">
              {t('login.remember')}
            </span>
          </label>
          <Link
            to="/forgot-password"
            className="text-[12px] font-bold text-ink hover:text-ink-secondary"
          >
            {t('login.forgot')}
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full text-sm font-bold text-on-primary bg-primary rounded-md min-h-[50px] flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-80"
        >
          {loading ? (
            <Wave className="h-4 w-10 text-white" />
          ) : (
            <>
              {t('login.signin')}
              <ArrowRight size={17} />
            </>
          )}
        </button>

        <p className="text-center text-[12px] text-ink-muted font-semibold mt-5 leading-relaxed">
          {t('login.note')}
          <br />
          {t('login.contact')}
        </p>
      </form>
    </AuthShell>
  )
}