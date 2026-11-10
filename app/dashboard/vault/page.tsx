'use client'
import { useState } from 'react'
export default function VaultPage() {
  const [tab, setTab] = useState<'documents' | 'stories' | 'photos'>('documents')
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>Legacy Vault</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Securely store your important documents, life stories, and cherished photos.</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['documents', 'stories', 'photos'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: tab === t ? 700 : 400, background: tab === t ? '#6366f1' : '#f3f4f6', color: tab === t ? '#fff' : '#374151', textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ background: '#f9fafb', border: '2px dashed #d1d5db', borderRadius: 12, padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>{tab === 'documents' ? '📄' : tab === 'stories' ? '📖' : '🖼️'}</div>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>
          {tab === 'documents' ? 'Upload wills, deeds, insurance policies, and other important documents.' :
           tab === 'stories'   ? 'Record your life story — memories, wisdom, and experiences for future generations.' :
                                 'Preserve your most treasured photos in a private family gallery.'}
        </p>
        <button style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 600 }}>
          {tab === 'documents' ? 'Upload Document' : tab === 'stories' ? 'Write a Story' : 'Upload Photos'}
        </button>
      </div>
    </main>
  )
}
