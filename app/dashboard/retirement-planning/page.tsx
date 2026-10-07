'use client'

import { useState } from 'react'
import { calcSSBenefit, calcRetirementBudget, MEDICARE_2026, getMedicareDeadlines } from '@/lib/content/calculators'

export default function RetirementPlanningPage() {
  // SS Calculator state
  const [birthYear, setBirthYear] = useState(1957)
  const [ssAt62, setSsAt62] = useState(1800)
  const [ssResult, setSsResult] = useState<ReturnType<typeof calcSSBenefit> | null>(null)

  // Budget Calculator state
  const [budget, setBudget] = useState({
    monthlyIncome: 2000,
    socialSecurityMonthly: 0,
    pensionMonthly: 0,
    housing: 1200,
    food: 400,
    healthcare: 300,
    transportation: 200,
    utilities: 150,
    entertainment: 100,
    other: 150,
  })
  const [budgetResult, setBudgetResult] = useState<ReturnType<typeof calcRetirementBudget> | null>(null)

  // Medicare deadlines state
  const [birthDateStr, setBirthDateStr] = useState('1960-01-15')
  const [deadlines, setDeadlines] = useState<ReturnType<typeof getMedicareDeadlines> | null>(null)

  function runSSCalc() {
    setSsResult(calcSSBenefit({ birthYear, estimatedMonthlyAt62: ssAt62 }))
  }

  function runBudgetCalc() {
    setBudgetResult(calcRetirementBudget(budget))
  }

  function runMedicareCalc() {
    setDeadlines(getMedicareDeadlines(new Date(birthDateStr)))
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Retirement Planning Hub</h1>
        <p className="text-gray-600">Calculators and guides to help you plan with confidence.</p>
      </div>

      {/* Social Security Calculator */}
      <section className="border border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Social Security Benefit Estimator</h2>
        <p className="text-sm text-gray-500 mb-5">Compare your benefit at age 62, your Full Retirement Age, and age 70.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Birth Year</label>
            <input
              type="number"
              value={birthYear}
              onChange={(e) => setBirthYear(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              min={1943} max={1970}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Monthly at 62 ($)</label>
            <input
              type="number"
              value={ssAt62}
              onChange={(e) => setSsAt62(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>
        <button onClick={runSSCalc} className="bg-teal-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-teal-700 transition-colors">
          Calculate
        </button>
        {ssResult && (
          <div className="mt-5 grid grid-cols-3 gap-4">
            {[
              { label: 'Age 62', amount: ssResult.at62, note: 'Reduced' },
              { label: `Age ${ssResult.fraAge} (FRA)`, amount: ssResult.atFRA, note: 'Full benefit' },
              { label: 'Age 70', amount: ssResult.at70, note: 'Maximum' },
            ].map((item: any) => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                <div className="text-2xl font-bold text-teal-700">${item.amount.toLocaleString()}</div>
                <div className="text-xs text-gray-400">{item.note}/mo</div>
              </div>
            ))}
            <div className="col-span-3 text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Break-even vs. claiming at 62: <strong>{ssResult.breakEvenVs62AtFRA} months</strong> if claiming at FRA · <strong>{ssResult.breakEvenVs62At70} months</strong> if claiming at 70
            </div>
          </div>
        )}
      </section>

      {/* Medicare Section */}
      <section className="border border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Medicare 2026 Guide</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-xs font-medium text-blue-700 mb-1">Part B Premium</div>
            <div className="text-xl font-bold text-blue-900">${MEDICARE_2026.partB.standardPremium}/mo</div>
            <div className="text-xs text-blue-600 mt-1">Deductible: ${MEDICARE_2026.partB.deductible}</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-xs font-medium text-purple-700 mb-1">Part A Deductible</div>
            <div className="text-xl font-bold text-purple-900">${MEDICARE_2026.partA.deductible.toLocaleString()}</div>
            <div className="text-xs text-purple-600 mt-1">Per benefit period</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-xs font-medium text-green-700 mb-1">Open Enrollment</div>
            <div className="text-sm font-bold text-green-900">{MEDICARE_2026.openEnrollment.start} – {MEDICARE_2026.openEnrollment.end}</div>
            <div className="text-xs text-green-600 mt-1">Part D plans</div>
          </div>
        </div>

        <h3 className="font-medium text-gray-800 mb-3">Medicare Enrollment Deadline Calculator</h3>
        <div className="flex items-end gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              value={birthDateStr}
              onChange={(e) => setBirthDateStr(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <button onClick={runMedicareCalc} className="bg-teal-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-teal-700 transition-colors">
            Show Deadlines
          </button>
        </div>
        {deadlines && (
          <div className="space-y-2">
            {deadlines.map((d: any) => (
              <div key={d.label} className="flex items-start gap-3 border border-gray-100 rounded-lg p-3">
                <div className="text-sm font-semibold text-teal-700 w-36 shrink-0">{d.label}</div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{d.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                  <div className="text-xs text-gray-500">{d.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Budget Calculator */}
      <section className="border border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Retirement Budget Calculator</h2>
        <p className="text-sm text-gray-500 mb-5">See if your income covers your monthly expenses.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Income</h3>
            {([
              ['Other Monthly Income', 'monthlyIncome'],
              ['Social Security', 'socialSecurityMonthly'],
              ['Pension', 'pensionMonthly'],
            ] as [string, keyof typeof budget][]).map(([label, key]) => (
              <div key={key} className="mb-3">
                <label className="block text-xs text-gray-600 mb-1">{label} ($)</label>
                <input
                  type="number"
                  value={budget[key]}
                  onChange={(e) => setBudget({ ...budget, [key]: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
            ))}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Expenses</h3>
            {([
              ['Housing', 'housing'],
              ['Food', 'food'],
              ['Healthcare', 'healthcare'],
              ['Transportation', 'transportation'],
              ['Utilities', 'utilities'],
              ['Entertainment', 'entertainment'],
              ['Other', 'other'],
            ] as [string, keyof typeof budget][]).map(([label, key]) => (
              <div key={key} className="mb-3">
                <label className="block text-xs text-gray-600 mb-1">{label} ($)</label>
                <input
                  type="number"
                  value={budget[key]}
                  onChange={(e) => setBudget({ ...budget, [key]: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
        <button onClick={runBudgetCalc} className="bg-teal-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-teal-700 transition-colors">
          Calculate Budget
        </button>
        {budgetResult && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Monthly Income', value: budgetResult.totalIncome, color: 'text-green-700' },
              { label: 'Monthly Expenses', value: budgetResult.totalExpenses, color: 'text-gray-900' },
              { label: 'Monthly Surplus', value: budgetResult.monthlySurplus, color: budgetResult.monthlySurplus >= 0 ? 'text-green-700' : 'text-red-600' },
              { label: 'Yearly Surplus', value: budgetResult.yearlySurplus, color: budgetResult.yearlySurplus >= 0 ? 'text-green-700' : 'text-red-600' },
            ].map((item: any) => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                <div className={`text-xl font-bold ${item.color}`}>
                  {item.value < 0 ? '-' : ''}${Math.abs(item.value).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
