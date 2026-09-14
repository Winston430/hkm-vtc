import { createContext, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Wave } from '../components/loading-ui/wave'
import { withTimeout } from './async'

interface RunOpts {
  message?: string
  timeoutMs?: number
  onTimeout?: () => Error
}

interface BusyContextValue {
  run<T>(fn: () => Promise<T>, opts?: RunOpts): Promise<T>
}

const BusyContext = createContext<BusyContextValue | undefined>(undefined)

export function BusyProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false)
  const [message, setMessage] = useState<string | undefined>(undefined)
  const depth = useRef(0)

  const value: BusyContextValue = {
    async run(fn, opts) {
      depth.current += 1
      setMessage(opts?.message)
      setActive(true)
      try {
        const p = fn()
        return opts?.timeoutMs ? await withTimeout(p, opts.timeoutMs, opts.onTimeout) : await p
      } finally {
        depth.current -= 1
        if (depth.current <= 0) {
          depth.current = 0
          setActive(false)
          setMessage(undefined)
        }
      }
    },
  }

  return (
    <BusyContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-[10000] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* blurred, click-blocking backdrop */}
            <div className="absolute inset-0 bg-white/55 backdrop-blur-[3px]" />
            <div className="relative bg-surface rounded-[18px] shadow-[0_20px_60px_rgba(0,0,0,0.18)] px-8 py-7 flex flex-col items-center gap-3">
              <Wave className="h-8 w-16 text-ink" />
              {message && <div className="text-[12.5px] font-bold text-ink-secondary">{message}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BusyContext.Provider>
  )
}

export function useBusy() {
  const ctx = useContext(BusyContext)
  if (!ctx) throw new Error('useBusy must be used within a BusyProvider')
  return ctx
}