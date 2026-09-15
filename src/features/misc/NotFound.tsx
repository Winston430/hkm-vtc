import { Link } from 'react-router-dom'
import { House } from '@phosphor-icons/react'
import { useI18n } from '../../lib/i18n'

export default function NotFound() {
  const { t } = useI18n()
  return (
    <div className="min-h-[70vh] grid place-items-center bg-canvas font-sans px-6">
      <div className="text-center max-w-[360px]">
        <div className="text-[64px] font-extrabold tracking-[-2px] text-ink leading-none">404</div>
        <div className="text-[16px] font-extrabold text-ink mt-2">{t('nf.title')}</div>
        <p className="text-[13px] text-ink-secondary mt-1.5">{t('nf.desc')}</p>
        <Link to="/" className="mt-6 inline-flex items-center gap-1.5 bg-primary text-on-primary rounded-[20px] px-5 py-2.5 text-[12.5px] font-bold hover:opacity-90 transition">
          <House size={15} /> {t('nf.home')}
        </Link>
      </div>
    </div>
  )
}