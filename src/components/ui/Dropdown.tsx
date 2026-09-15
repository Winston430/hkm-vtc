import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CaretDown, Check } from '@phosphor-icons/react'

export interface DropdownOption {
  value: string
  label: string
  hint?: string
}

export function Dropdown({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  disabled = false,
}: {
  value: string
  onChange: (v: string) => void
  options: DropdownOption[]
  placeholder?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const selected = options.find((o) => o.value === value)

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 text-[13.5px] font-medium rounded-md py-3 px-3.5 bg-surface-soft transition outline-none ${
          disabled ? 'opacity-70 cursor-not-allowed' : 'hover:bg-hover'
        } ${open ? 'bg-surface shadow-[0_0_0_3px_rgba(23,23,23,0.07),inset_0_0_0_1.5px_rgba(23,23,23,0.12)]' : ''}`}
      >
        <span className={selected ? 'text-ink truncate' : 'text-ink-muted'}>
          {selected ? selected.label : placeholder}
        </span>
        <CaretDown size={15} className={`text-ink-muted shrink-0 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.14, ease: 'easeOut' }}
          style={{ transformOrigin: 'top' }}
          className="absolute z-50 mt-1.5 w-full bg-surface rounded-[14px] shadow-[0_12px_40px_rgba(0,0,0,0.14)] p-1.5 max-h-[280px] overflow-auto"
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
              className={`w-full flex items-center justify-between gap-2 text-left rounded-[10px] px-3 py-2.5 transition ${
                o.value === value
                  ? 'bg-surface-soft text-ink'
                  : 'text-ink-secondary hover:bg-surface-soft'
              }`}
            >
              <span className="min-w-0">
                <span className={`block text-[13px] truncate ${o.value === value ? 'font-bold' : 'font-semibold'}`}>
                  {o.label}
                </span>
                {o.hint && <span className="block text-[11px] text-ink-muted font-semibold">{o.hint}</span>}
              </span>
              {o.value === value && <Check size={15} weight="bold" className="text-ink shrink-0" />}
            </button>
          ))}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}