import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  buttonClassName?: string
  disabled?: boolean
  ariaLabel?: string
}

export default function SelectField({
  value,
  options,
  onChange,
  placeholder = 'Select...',
  className = '',
  buttonClassName = '',
  disabled = false,
  ariaLabel,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = useMemo(() => options.find(option => option.value === value), [options, value])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  const choose = (nextValue: string) => {
    onChange(nextValue)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(prev => !prev)}
        onKeyDown={event => {
          if (event.key === 'Escape') setOpen(false)
        }}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-800 shadow-sm transition hover:border-red-300 hover:bg-red-50/30 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/15 disabled:cursor-not-allowed disabled:opacity-60 ${buttonClassName}`}
      >
        <span className={`truncate ${selected ? '' : 'text-gray-400'}`}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-red-600 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-red-100 bg-white shadow-xl shadow-black/10">
          <div role="listbox" className="max-h-64 overflow-y-auto p-1.5">
            {options.map(option => {
              const active = option.value === value

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => choose(option.value)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    active
                      ? 'bg-red-600 font-semibold text-white shadow-sm'
                      : 'text-gray-700 hover:bg-red-50 hover:text-red-700'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {active && <Check className="h-4 w-4 flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
