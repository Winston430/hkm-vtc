import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from '@phosphor-icons/react'

export function Modal({
  open, onClose, title, children, maxWidth = 460,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  maxWidth?: number
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ maxWidth }}
            className="relative w-full bg-surface rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.22)] p-6"
          >
            {title && (
              <div className="flex items-center justify-between mb-4">
                <div className="text-[15px] font-extrabold">{title}</div>
                <button onClick={onClose} className="w-8 h-8 rounded-lg bg-surface-soft hover:bg-[#EEE] grid place-items-center text-ink-secondary transition"><X size={16} /></button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}