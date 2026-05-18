import { HTMLAttributes } from 'react'

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  height?: string
  width?: string
  rounded?: boolean
}

export function Skeleton({ height = 'h-6', width = 'w-full', rounded = false, className = '', ...rest }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading…"
      className={`animate-pulse bg-gray-200 ${height} ${width} ${rounded ? 'rounded-full' : 'rounded-lg'} ${className}`}
      {...rest}
    >
      <span className="sr-only">Loading…</span>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div role="status" aria-label="Loading card" className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-3">
      <Skeleton height="h-6" width="w-1/3" />
      <Skeleton height="h-4" />
      <Skeleton height="h-4" width="w-3/4" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div role="status" aria-label="Loading text" className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height="h-4" width={i === lines - 1 ? 'w-2/3' : 'w-full'} />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  )
}
