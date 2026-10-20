'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
    setStatus('submitting')
    setErrorMsg('')
    try {
      const res = await fetch('/api/contact/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Server error')
      setStatus('success')
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch {
      setStatus('error')
      setErrorMsg('Something went wrong. Please try again or email us directly.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-teal-700">ThriveAtHome</Link>
          <Link href="/signup" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium">
            Sign up free
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-14">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Contact Us</h1>
          <p className="text-gray-500 text-lg">We&apos;d love to hear from you. Our team responds within one business day.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {/* Form */}
          <div className="md:col-span-2">
            {status === 'success' ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-4">✅</div>
                <h2 className="text-xl font-semibold text-green-800 mb-2">Message sent!</h2>
                <p className="text-green-700 mb-6">Thank you for reaching out. We&apos;ll get back to you within one business day.</p>
                <button
                  onClick={() => setStatus('idle')}
                  className="text-sm text-green-700 underline hover:no-underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="name">
                      Full name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Your name"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="email">
                      Email address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="you@example.com"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="subject">
                    Subject <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="subject"
                    type="text"
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="What's this about?"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="message">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Tell us how we can help…"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm resize-none"
                  />
                </div>

                {status === 'error' && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full bg-teal-600 text-white font-semibold py-3 rounded-xl hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {status === 'submitting' ? 'Sending…' : 'Send message'}
                </button>
              </form>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Get in touch</h2>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700 mb-0.5">Email</p>
                  <p className="text-gray-500">hello@thriveathome.com</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700 mb-0.5">Phone</p>
                  <p className="text-gray-500">(800) 555-THRIVE</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700 mb-0.5">Hours</p>
                  <p className="text-gray-500">Monday–Friday<br />9 am – 5 pm PT</p>
                </div>
              </div>
            </div>

            <div className="bg-teal-50 rounded-2xl border border-teal-200 p-6">
              <h2 className="font-semibold text-teal-900 mb-2">Already a member?</h2>
              <p className="text-teal-800 text-sm mb-4">Log in to reach your Care Navigator directly — usually a same-day response.</p>
              <Link
                href="/dashboard"
                className="block text-center bg-teal-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-teal-700 transition-colors"
              >
                Go to dashboard
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
