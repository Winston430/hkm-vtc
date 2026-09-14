import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { List } from '@phosphor-icons/react'
import Sidebar from './Sidebar'
import { useI18n } from '../lib/i18n'
import type { StringKey } from '../lib/i18n'

export default function AppShell() {
  const location = useLocation()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const titles: Record<string, StringKey> = {
      '/': 'nav.dashboard',
      '/students': 'nav.students',
      '/students/new': 'reg.title',
      '/courses': 'nav.courses',
      '/branches': 'nav.branches',
      '/agents': 'nav.agents',
      '/payments': 'nav.payments',
      '/reports': 'nav.reports',
      '/settings': 'nav.settings',
    }
    let key = titles[location.pathname]
    if (!key && location.pathname.startsWith('/students/')) key = 'nav.students'
    document.title = key ? `${t(key)} | HKM VTC` : 'HKM VTC'
  }, [location.pathname, t])

  return (
    <div className="min-h-screen bg-canvas font-sans">
      <div className="lg:grid lg:grid-cols-[176px_minmax(0,1fr)] min-h-screen">
        {/* desktop sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        <main className="min-w-0 overflow-x-hidden">
          {/* mobile top bar */}
          <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 bg-canvas/90 backdrop-blur border-b border-[#F1F1F1]">
            <button onClick={() => setOpen(true)} aria-label="Menu" className="w-9 h-9 rounded-lg bg-surface-soft grid place-items-center text-ink">
              <List size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[8px] bg-ink text-white grid place-items-center font-extrabold text-[11px]">HK</div>
              <div className="font-extrabold text-[14px]">
                HKM <span className="text-ink-muted font-bold text-[10px] tracking-wide">VOCATIONAL</span>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/30 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed top-0 left-0 bottom-0 z-50 lg:hidden shadow-2xl"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 40 }}
            >
              <Sidebar onNavigate={() => setOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}