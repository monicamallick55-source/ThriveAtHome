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
}

export function Tabs({ tabs, defaultTab, onChange, label }: TabsProps) {
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

  return (
    <div>
      <div role="tablist" aria-label={label} className="flex border-b border-gray-200 gap-1 overflow-x-auto">
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
            className={`px-4 py-3 text-lg font-medium border-b-2 whitespace-nowrap transition-colors min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3A6B] focus-visible:ring-inset
              ${active === tab.id
                ? 'border-[#1B3A6B] text-[#1B3A6B]'
                : 'border-transparent text-gray-500 hover:text-[#1B3A6B] hover:border-gray-300'
              }`}
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
