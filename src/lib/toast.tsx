import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { CheckCircle, WarningCircle, Info, X } from '@phosphor-icons/react'

let toastAudio: HTMLAudioElement | null = null
function playToastSound() {
  try {
    if (localStorage.getItem('hkm.sound') === 'off') return
    if (!toastAudio) {
      toastAudio = new Audio('/sounds/toast.mp3')
      toastAudio.volume = 0.5
    }
    toastAudio.currentTime = 0
    void toastAudio.play().catch(() => {})
  } catch {
    /* no sound file / autoplay blocked — ignore */
  }
}

type ToastType = 'success' | 'error' | 'info'

interface ToastData {
  id: number
  type: ToastType
  title: string
  message?: string
  duration: number
}

interface ToastInput {
  type?: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextValue {
  toast: (input: ToastInput) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

let counter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (input: ToastInput) => {
      const id = ++counter
      const duration = input.duration ?? 4000
      const item: ToastData = {
        id,
        type: input.type ?? 'info',
        title: input.title,
        message: input.message,
        duration,
      }
      setToasts((list) => [...list, item])
      playToastSound()
      if (duration > 0) window.setTimeout(() => remove(id), duration)
    },
    [remove]
  )

  const success = useCallback(
    (title: string, message?: string) => toast({ type: 'success', title, message }),
    [toast]
  )
  const error = useCallback(
    (title: string, message?: string) => toast({ type: 'error', title, message }),
    [toast]
  )
  const info = useCallback(
    (title: string, message?: string) => toast({ type: 'info', title, message }),
    [toast]
  )

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      <Toaster toasts={toasts} onDismiss={remove} />
    </ToastContext.Provider>
  )
}

const META = {
  success: { Icon: CheckCircle, color: 'var(--color-success)' },
  error: { Icon: WarningCircle, color: 'var(--color-danger)' },
  info: { Icon: Info, color: 'var(--color-ink)' },
} as const

function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: ToastData[]
  onDismiss: (id: number) => void
}) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 w-[340px] max-w-[calc(100vw-2.5rem)] pointer-events-none">
      {toasts.map((t) => {
        const { Icon, color } = META[t.type]
        return (
          <div
            key={t.id}
            role="status"
            className="hkm-toast pointer-events-auto relative overflow-hidden bg-surface rounded-card shadow-soft p-3.5 pr-9 flex gap-3 font-sans"
          >
            <span
              className="grid place-items-center w-7 h-7 rounded-full shrink-0 text-white"
              style={{ background: color }}
            >
              <Icon size={16} weight="fill" />
            </span>

            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-ink leading-snug">
                {t.title}
              </div>
              {t.message && (
                <div className="text-[12px] text-ink-secondary mt-0.5 leading-snug">
                  {t.message}
                </div>
              )}
            </div>

            <button
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss"
              className="absolute top-3 right-3 text-ink-muted hover:text-ink transition"
            >
              <X size={14} weight="bold" />
            </button>

            {t.duration > 0 && (
              <span
                className="absolute left-0 bottom-0 h-[3px] rounded-full"
                style={{
                  background: color,
                  width: '100%',
                  animation: `hkm-progress ${t.duration}ms linear forwards`,
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}