import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { WifiSlash } from '@phosphor-icons/react'
import { useI18n } from '../lib/i18n'

export function OfflineBanner() {
  const { t } = useI18n()
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOffline(false)
    const goOffline = () => setOffline(true)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[10001] flex items-center gap-2.5 bg-primary text-on-primary rounded-[20px] px-4 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.28)] max-w-[calc(100vw-2rem)]"
        >
          <WifiSlash size={16} weight="bold" className="shrink-0" />
          <span className="text-[12.5px] font-bold leading-snug">{t('offline.message')}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}