// Dashboard loading state — shown by Next.js while the server component fetches data.
import { SkeletonCard, SkeletonText } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-brand-warm-white">
      {/* Nav skeleton */}
      <div className="bg-brand-navy h-14" aria-hidden="true" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8" aria-busy="true" aria-label="Loading dashboard">
        {/* Member header skeleton */}
        <div className="flex items-center gap-4">
          <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-64 rounded-lg bg-gray-200 animate-pulse" />
            <div className="h-5 w-40 rounded-lg bg-gray-200 animate-pulse" />
          </div>
        </div>

        {/* Alerts skeleton */}
        <SkeletonCard />

        {/* Mood chart skeleton */}
        <SkeletonCard />

        {/* Two-column skeletons */}
        <div className="grid gap-8 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  )
}
