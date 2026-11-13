'use client'
import { useState } from 'react'
export default function ProfilePage() {
  const [name, setName] = useState('')
  const [zip, setZip] = useState('')
  const [birthday, setBirthday] = useState('')
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <noscript>Your profile: name, zip code, birthday, address, contact details.</noscript>
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"
            className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ZIP Code</label>
          <input value={zip} onChange={e=>setZip(e.target.value)} placeholder="ZIP code"
            className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Birthday</label>
          <input type="date" value={birthday} onChange={e=>setBirthday(e.target.value)}
            data-testid="birthday-field"
            className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Save Profile</button>
      </div>
    </div>
  )
}
