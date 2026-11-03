'use client'
import { useState } from 'react'

interface Field {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'datetime-local' | 'tel'
  placeholder?: string
  required?: boolean
  options?: string[]
}

interface ServiceBookingFormProps {
  serviceType: string
  title: string
  description: string
  fields: Field[]
  onSuccess?: () => void
}

export default function ServiceBookingForm({
  serviceType,
  title,
  description,
  fields,
  onSuccess,
}: ServiceBookingFormProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [requestedFor, setRequestedFor] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: serviceType,
          booking_details: values,
          requested_for: requestedFor || undefined,
          notes: notes || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit request')
      }
      setSubmitted(true)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
        <p className="text-gray-600 mb-6">
          We've received your request and will be in touch shortly to confirm details.
        </p>
        <button
          onClick={() => { setSubmitted(false); setValues({}); setNotes(''); setRequestedFor('') }}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Submit Another Request
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-600 mb-8">{description}</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                rows={3}
                required={field.required}
                placeholder={field.placeholder}
                value={values[field.name] || ''}
                onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : field.type === 'select' ? (
              <select
                required={field.required}
                value={values[field.name] || ''}
                onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select…</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                required={field.required}
                placeholder={field.placeholder}
                value={values[field.name] || ''}
                onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scheduled Date / Time (if applicable)
          </label>
          <input
            type="datetime-local"
            value={requestedFor}
            onChange={(e) => setRequestedFor(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes
          </label>
          <textarea
            rows={2}
            placeholder="Anything else we should know…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? 'Submitting…' : 'Submit Request'}
        </button>
      </form>
    </div>
  )
}
