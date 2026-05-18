'use client'

import { useState } from 'react'

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

  function handleSelect(id: string) {
    setActive(id)
    onChange?.(id)
  }

  const activeTab = tabs.find(t => t.id === active)

  return (
    <div>
      <div role="tablist" aria-label={label} className="flex border-b border-gray-200 gap-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`panel-${tab.id}`}
            type="button"
            onClick={() => handleSelect(tab.id)}
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
