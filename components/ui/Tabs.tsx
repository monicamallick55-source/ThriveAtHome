'use client'

import { useRef, useState } from 'react'

export interface Tab {
  id: string
  label: string
  content: React.ReactNode
}

export interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  onChange?: (id: string) => void
  label: string
  variant?: 'underline' | 'pill'
}

export function Tabs({ tabs, defaultTab, onChange, label, variant = 'underline' }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id ?? '')
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  function handleSelect(id: string) {
    setActive(id)
    onChange?.(id)
  }

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    const count = tabs.length
    let next = -1
    if (e.key === 'ArrowRight') { e.preventDefault(); next = (index + 1) % count }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); next = (index - 1 + count) % count }
    else if (e.key === 'Home') { e.preventDefault(); next = 0 }
    else if (e.key === 'End')  { e.preventDefault(); next = count - 1 }
    if (next >= 0) {
      handleSelect(tabs[next].id)
      buttonRefs.current[next]?.focus()
    }
  }

  const getTabClass = (isActive: boolean) => {
    if (variant === 'pill') {
      return isActive
        ? 'bg-[var(--color-navy)] text-[var(--color-cream)] rounded-[var(--radius-full)] px-4 py-2'
        : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-warm-grey)] rounded-[var(--radius-full)] px-4 py-2'
    }
    return isActive
      ? 'border-b-2 border-[var(--color-navy)] text-[var(--color-navy)]'
      : 'border-b-2 border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-navy)] hover:border-[var(--color-warm-grey)]'
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        className={`flex gap-1 overflow-x-auto ${variant === 'underline' ? 'border-b border-[var(--color-warm-grey)]' : 'p-1 bg-[var(--color-warm-grey)] rounded-[var(--radius-full)] w-fit'}`}
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={el => { buttonRefs.current[i] = el }}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`panel-${tab.id}`}
            type="button"
            tabIndex={active === tab.id ? 0 : -1}
            onClick={() => handleSelect(tab.id)}
            onKeyDown={e => handleKeyDown(e, i)}
            className={[
              'text-base font-medium whitespace-nowrap transition-all duration-200 min-h-[44px]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-teal)] focus-visible:ring-offset-1',
              variant === 'underline' ? 'px-4 py-3' : '',
              getTabClass(active === tab.id),
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map(tab => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={active !== tab.id}
          className="pt-4"
        >
          {active === tab.id && tab.content}
        </div>
      ))}
    </div>
  )
}
