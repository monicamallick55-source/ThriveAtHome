'use client'
export default function StateSearch() {
  return (
    <input
      type="text"
      placeholder="Type a state name to filter…"
      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[15px] mb-6 focus:outline-none focus:ring-2 focus:ring-teal-500"
      onInput={(e) => {
        const v = (e.target as HTMLInputElement).value.toLowerCase()
        document.querySelectorAll<HTMLElement>('[data-scard]').forEach(el => {
          el.style.display = (el.dataset.sname ?? '').toLowerCase().includes(v) ? '' : 'none'
        })
      }}
    />
  )
}
