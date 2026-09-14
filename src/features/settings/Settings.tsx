import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { PencilSimple, Check, X, SignOut, Translate, LockKey, User, Sun, Moon, Desktop, SpeakerHigh, DownloadSimple, CheckCircle } from '@phosphor-icons/react'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../lib/i18n'
import { useTheme } from '../../lib/theme'
import type { ThemeMode } from '../../lib/theme'
import { useInstallPrompt } from '../../lib/pwa'
import type { Lang } from '../../lib/i18n'
import { useToast } from '../../lib/toast'
import { useBranches } from '../../lib/services/catalog'
import { updateProfileName, changePassword, sendResetEmail } from '../../lib/services/profile'
import { Avatar } from '../../components/ui/Avatar'
import { Wave } from '../../components/loading-ui/wave'

const inputClass =
  'w-full text-[13.5px] font-medium text-ink bg-surface-soft rounded-md py-3 px-3.5 outline-none transition placeholder:text-ink-muted focus:bg-surface focus:shadow-[0_0_0_3px_rgba(23,23,23,0.07),inset_0_0_0_1.5px_rgba(23,23,23,0.12)]'

function Card({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
      className="bg-surface rounded-[18px] shadow-soft p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-surface-soft grid place-items-center text-ink-secondary">{icon}</div>
        <div>
          <div className="text-[13px] font-extrabold leading-none">{title}</div>
          {desc && <div className="text-[11px] text-ink-muted font-semibold mt-1">{desc}</div>}
        </div>
      </div>
      {children}
    </motion.div>
  )
}

export default function Settings() {
  const { profile, logout } = useAuth()
  const { lang, setLang, t } = useI18n()
  const { mode, setMode } = useTheme()
  const { canInstall, isStandalone, promptInstall } = useInstallPrompt()
  const [sound, setSound] = useState(() => localStorage.getItem('hkm.sound') !== 'off')

  function toggleSound() {
    const next = !sound
    setSound(next)
    localStorage.setItem('hkm.sound', next ? 'on' : 'off')
  }
  const toast = useToast()
  const { branches } = useBranches()

  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [changing, setChanging] = useState(false)

  useEffect(() => { if (profile) setName(profile.name) }, [profile])

  if (!profile) return null

  const branchName = profile.branchId ? branches.find((b) => b.id === profile.branchId)?.name ?? '—' : t('settings.allBranches')

  async function saveName() {
    if (!profile || !name.trim()) return
    setSavingName(true)
    try {
      await updateProfileName(profile.uid, name.trim())
      toast.success(t('settings.nameSaved'))
      setEditingName(false)
    } catch {
      toast.error(t('settings.nameError'))
    } finally {
      setSavingName(false)
    }
  }

  async function doChangePassword() {
    if (newPw.length < 6) { toast.error(t('settings.passwordShort')); return }
    if (newPw !== confirmPw) { toast.error(t('settings.passwordMismatch')); return }
    setChanging(true)
    try {
      await changePassword(newPw)
      toast.success(t('settings.passwordChanged'))
      setNewPw(''); setConfirmPw('')
    } catch (err) {
      const code = (err as { code?: string })?.code
      toast.error(code === 'auth/requires-recent-login' ? t('settings.reauth') : t('settings.passwordError'))
    } finally {
      setChanging(false)
    }
  }

  async function doReset() {
    if (!profile?.email) return
    try {
      await sendResetEmail(profile.email)
      toast.success(t('settings.resetSent'))
    } catch {
      toast.error(t('settings.resetError'))
    }
  }

  return (
    <div className="p-6 sm:p-7 max-w-[720px]">
      <h1 className="text-[19px] font-extrabold tracking-[-0.3px]">{t('settings.title')}</h1>
      <p className="text-[12.5px] text-ink-secondary mt-1 mb-6">{t('settings.subtitle')}</p>

      <div className="flex flex-col gap-5">
        {/* profile */}
        <Card icon={<User size={16} />} title={t('settings.profile')}>
          <div className="flex items-center gap-4 mb-5">
            <Avatar name={profile.name || '?'} size={56} />
            <div className="min-w-0">
              <div className="font-extrabold text-[16px] truncate">{profile.name}</div>
              <div className="text-[12px] text-ink-muted font-semibold">{profile.email}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <div className="text-[10.5px] font-bold text-ink-muted mb-1.5">{t('settings.name')}</div>
              {editingName ? (
                <div className="flex gap-2">
                  <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                  <button onClick={saveName} disabled={savingName} className="shrink-0 w-11 grid place-items-center bg-primary text-on-primary rounded-md hover:opacity-90 transition disabled:opacity-60">
                    {savingName ? <Wave className="h-3 w-6 text-white" /> : <Check size={16} />}
                  </button>
                  <button onClick={() => { setEditingName(false); setName(profile.name) }} className="shrink-0 w-11 grid place-items-center bg-surface-soft text-ink-secondary rounded-md hover:bg-hover transition"><X size={16} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[13px]">{profile.name}</span>
                  <button onClick={() => setEditingName(true)} className="text-ink-muted hover:text-ink transition"><PencilSimple size={14} /></button>
                </div>
              )}
            </div>
            <div>
              <div className="text-[10.5px] font-bold text-ink-muted mb-1.5">{t('settings.role')}</div>
              <span className="font-semibold text-[13px]">{profile.role === 'admin' ? t('settings.roleAdmin') : t('settings.roleAgent')}</span>
            </div>
            <div>
              <div className="text-[10.5px] font-bold text-ink-muted mb-1.5">{t('settings.branch')}</div>
              <span className="font-semibold text-[13px]">{branchName}</span>
            </div>
          </div>
        </Card>

        {/* language */}
        <Card icon={<Translate size={16} />} title={t('settings.language')} desc={t('settings.languageDesc')}>
          <div className="inline-flex bg-surface-soft rounded-[20px] p-1">
            {(['en', 'sw'] as Lang[]).map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-5 py-2 rounded-[16px] text-[12.5px] font-bold transition ${lang === l ? 'bg-surface text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]' : 'text-ink-muted hover:text-ink'}`}>
                {l === 'en' ? 'English' : 'Kiswahili'}
              </button>
            ))}
          </div>
        </Card>

        {/* appearance / dark mode */}
        <Card icon={<Moon size={16} />} title={t('settings.appearance')} desc={t('settings.appearanceDesc')}>
          <div className="inline-flex bg-surface-soft rounded-[20px] p-1">
            {([
              { key: 'light' as ThemeMode, label: t('settings.themeLight'), Icon: Sun },
              { key: 'dark' as ThemeMode, label: t('settings.themeDark'), Icon: Moon },
              { key: 'system' as ThemeMode, label: t('settings.themeSystem'), Icon: Desktop },
            ]).map((opt) => (
              <button key={opt.key} onClick={() => setMode(opt.key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-[16px] text-[12.5px] font-bold transition ${mode === opt.key ? 'bg-surface text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]' : 'text-ink-muted hover:text-ink'}`}>
                <opt.Icon size={14} /> {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-5 pt-5 border-t border-hair">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-surface-soft grid place-items-center text-ink-secondary"><SpeakerHigh size={16} /></div>
              <div>
                <div className="text-[12.5px] font-bold text-ink">{t('settings.sound')}</div>
                <div className="text-[11px] text-ink-muted font-semibold">{t('settings.soundDesc')}</div>
              </div>
            </div>
            <button type="button" onClick={toggleSound} className={`w-11 h-6 rounded-full transition relative shrink-0 ${sound ? 'bg-success' : 'bg-surface-soft'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${sound ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>
        </Card>

        {/* install app */}
        <Card icon={<DownloadSimple size={16} />} title={t('settings.install')} desc={t('settings.installDesc')}>
          {isStandalone ? (
            <div className="flex items-center gap-2 text-[12.5px] font-bold text-success"><CheckCircle size={16} weight="fill" /> {t('settings.installed')}</div>
          ) : canInstall ? (
            <button onClick={promptInstall} className="inline-flex items-center gap-1.5 bg-primary text-on-primary rounded-[20px] px-5 py-2.5 text-[12.5px] font-bold hover:opacity-90 transition">
              <DownloadSimple size={15} /> {t('settings.installBtn')}
            </button>
          ) : (
            <div className="text-[12px] text-ink-muted font-semibold">{t('settings.installHint')}</div>
          )}
        </Card>

        {/* security */}
        <Card icon={<LockKey size={16} />} title={t('settings.security')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold mb-[7px] text-ink">{t('settings.newPassword')}</label>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-[12px] font-bold mb-[7px] text-ink">{t('settings.confirmPassword')}</label>
              <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button onClick={doChangePassword} disabled={changing || !newPw || !confirmPw}
              className="inline-flex items-center justify-center gap-1.5 bg-primary text-on-primary rounded-[20px] px-5 py-2.5 min-w-[170px] text-[12.5px] font-bold hover:opacity-90 transition disabled:opacity-50">
              {changing ? <Wave className="h-3.5 w-8 text-white" /> : t('settings.changePassword')}
            </button>
            <button onClick={doReset} className="text-[12px] font-bold text-ink-secondary hover:text-ink transition underline underline-offset-2">
              {t('settings.orReset')}
            </button>
          </div>
        </Card>

        {/* sign out */}
        <button onClick={() => logout()} className="self-start inline-flex items-center gap-2 bg-surface hover:bg-surface-soft rounded-[20px] px-5 py-3 text-[12.5px] font-bold text-danger shadow-soft transition">
          <SignOut size={16} /> {t('nav.signout')}
        </button>
      </div>
    </div>
  )
}