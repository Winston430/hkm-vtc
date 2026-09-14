import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useI18n } from '../../lib/i18n'
import type { Lang } from '../../lib/i18n'

// Drop your photos in /public and list them here. They crossfade in order.
const AUTH_BGS = ['/bg1.jpg', '/bg2.jpg', '/bg3.jpg']
const BG_INTERVAL = 6000 // ms each photo stays before crossfading

/** Shared split-screen frame for all auth screens (login, forgot password, …). */
export default function AuthShell({ children }: { children: ReactNode }) {
  const { lang, setLang, t } = useI18n()
  const [bgIndex, setBgIndex] = useState(0)

  useEffect(() => {
    if (AUTH_BGS.length <= 1) return
    const id = setInterval(() => setBgIndex((i) => (i + 1) % AUTH_BGS.length), BG_INTERVAL)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-canvas font-sans">
      {/* FORM SIDE */}
      <div className="flex flex-col px-6 sm:px-10 py-8 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-[10px] bg-ink text-white grid place-items-center font-extrabold text-[13px] overflow-hidden">
              <span>HK</span>
              <img
                src="/logo.png"
                alt="HKM"
                className="absolute inset-0 w-full h-full object-cover"
                onError={(ev) => ev.currentTarget.remove()}
              />
            </div>
            <div>
              <div className="font-extrabold text-[15px] leading-none">HKM</div>
              <div className="text-[9px] text-ink-muted font-bold tracking-[1.5px]">
                VOCATIONAL
              </div>
            </div>
          </div>

          <div className="flex bg-surface-soft rounded-[20px] p-[3px]">
            {(['en', 'sw'] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`font-bold text-[11.5px] px-3 py-[5px] rounded-2xl transition ${
                  lang === l
                    ? 'bg-white text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                    : 'text-ink-muted'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center">
          <div className="w-full max-w-[360px]">{children}</div>
        </div>

        <div className="text-[11px] text-ink-muted font-semibold text-center">
          © 2026 HKM Vocational Training Center · Babati, Tanzania
        </div>
      </div>

      {/* BRAND / IMAGE SIDE */}
      <div className="relative overflow-hidden hidden md:flex flex-col justify-end p-11" style={{ backgroundColor: '#140f0b' }}>
        {/* rotating photos — crossfade with a slow zoom */}
        <AnimatePresence>
          <motion.img
            key={bgIndex}
            src={AUTH_BGS[bgIndex]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.2, ease: 'easeInOut' }, scale: { duration: BG_INTERVAL / 1000 + 1.2, ease: 'linear' } }}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        </AnimatePresence>
        {/* readability scrim (lighter, so the photo shows through) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 90% at 78% 108%, rgba(217,154,78,.28) 0%, rgba(20,15,11,.05) 38%, rgba(20,15,11,.55) 100%), linear-gradient(180deg, rgba(20,15,11,.15) 0%, rgba(20,15,11,0) 35%, rgba(20,15,11,.7) 100%)',
          }}
        />
        <div className="relative z-10 text-[#F5EFE6] max-w-[440px]">
          <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-wide text-[rgba(245,239,230,0.7)] mb-[18px]">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            {t('hero.eyebrow')}
          </div>
          <h2 className="text-[38px] leading-[1.08] font-extrabold tracking-[-0.8px]">
            {t('hero.headline')}
          </h2>
          <p className="text-sm leading-relaxed text-[rgba(245,239,230,0.72)] mt-4 max-w-[380px]">
            {t('hero.sub')}
          </p>
          <div className="flex gap-6 mt-7 pt-6 border-t border-[rgba(245,239,230,0.14)]">
            <div>
              <b className="text-[22px] font-extrabold block">15+</b>
              <span className="text-[11px] font-semibold text-[rgba(245,239,230,0.6)]">{t('hero.courses')}</span>
            </div>
            <div>
              <b className="text-[22px] font-extrabold block">2</b>
              <span className="text-[11px] font-semibold text-[rgba(245,239,230,0.6)]">{t('hero.branches')}</span>
            </div>
            <div>
              <b className="text-[22px] font-extrabold block">240+</b>
              <span className="text-[11px] font-semibold text-[rgba(245,239,230,0.6)]">{t('hero.students')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}