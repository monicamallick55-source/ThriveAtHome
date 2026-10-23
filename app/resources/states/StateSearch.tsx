'use client'

import { useState } from 'react'

export default function StateSearch() {
  const [zip, setZip] = useState('')
  const [zipError, setZipError] = useState('')
  const [stateFilter, setStateFilter] = useState('')

  function isValidZip(z: string) {
    return /^\d{5}$/.test(z)
  }

  function handleZipSearch(dest: '211' | 'eldercare') {
    if (!isValidZip(zip)) {
      setZipError('Please enter a valid 5-digit ZIP code.')
      return
    }
    setZipError('')
    if (dest === '211') {
      window.open(`https://www.211.org/about-us/your-local-211?zip=${zip}`, '_blank')
    } else {
      window.open(`https://eldercare.acl.gov/Public/Index.aspx`, '_blank')
    }
  }

  return (
    <>
      {/* ZIP Code Search */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-bold text-blue-900 mb-1">
          🔍 Find Local Services by ZIP Code
        </h2>
        <p className="text-blue-700 text-sm mb-4">
          Find Area Agencies on Aging, meal programs, transportation, cleaning, gardening help, legal aid,
          and more — all near you.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={zip}
            onChange={(e) => {
              setZip(e.target.value.replace(/\D/g, '').slice(0, 5))
              setZipError('')
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleZipSearch('211')}
            placeholder="Enter ZIP code"
            maxLength={5}
            inputMode="numeric"
            className="border border-blue-300 rounded-lg px-4 py-2.5 text-[15px] w-full sm:w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => handleZipSearch('211')}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold text-[14px] hover:bg-blue-700 transition whitespace-nowrap"
          >
            Search 211.org
          </button>
          <button
            onClick={() => handleZipSearch('eldercare')}
            className="bg-teal-600 text-white px-5 py-2.5 rounded-lg font-semibold text-[14px] hover:bg-teal-700 transition whitespace-nowrap"
          >
            Search Eldercare Locator
          </button>
        </div>
        {zipError && <p className="text-red-600 text-sm mt-2">{zipError}</p>}
        <p className="text-[12px] text-blue-500 mt-3">
          <strong>211.org</strong> connects you to local health &amp; human services. &nbsp;
          <strong>Eldercare Locator</strong> is the federal directory of Area Agencies on Aging.
        </p>
      </div>

      {/* State Name Filter */}
      <input
        type="text"
        value={stateFilter}
        placeholder="Or type a state name to browse…"
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[15px] mb-6 focus:outline-none focus:ring-2 focus:ring-teal-500"
        onChange={(e) => {
          const v = e.target.value.toLowerCase()
          setStateFilter(v)
          document.querySelectorAll<HTMLElement>('[data-scard]').forEach(el => {
            el.style.display = (el.dataset.sname ?? '').toLowerCase().includes(v) ? '' : 'none'
          })
        }}
      />
    </>
  )
}