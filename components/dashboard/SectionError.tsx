// Per-section error indicator — shown when a section's data fetch fails or times out.
export interface SectionErrorProps {
  message?: string
}

export function SectionError({ message = 'Unable to load this section. Please refresh the page.' }: SectionErrorProps) {
  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-lg text-red-800"
    >
      <span aria-hidden="true" className="text-2xl">⚠</span>
      <span>{message}</span>
    </div>
  )
}
