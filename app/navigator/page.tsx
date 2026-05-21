import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAuth, getUserRole } from '@/lib/auth'
import { getNavigatorByAuthId, getNavigatorCaseload, getNavigatorTasks } from '@/lib/data/navigator'
import { NavConsole } from '@/components/navigator/NavConsole'
import { ToastProvider } from '@/components/ui/Toast'

export const metadata: Metadata = { title: 'Navigator Console — ThriveAtHome' }

export default async function NavigatorPage() {
  const user = await requireAuth()

  const role = await getUserRole(user.id)
  if (role === 'family') redirect('/dashboard')

  const { data: navigator } = await getNavigatorByAuthId(user.id)

  let caseload = null as Awaited<ReturnType<typeof getNavigatorCaseload>>['data']
  let caseloadError: string | null = null
  let tasks = null as Awaited<ReturnType<typeof getNavigatorTasks>>['data']
  let tasksError: string | null = null

  if (navigator) {
    const [caseloadResult, tasksResult] = await Promise.all([
      getNavigatorCaseload(navigator.id),
      getNavigatorTasks(navigator.id),
    ])
    caseload = caseloadResult.data
    caseloadError = caseloadResult.error
    tasks = tasksResult.data
    tasksError = tasksResult.error
  }

  // Build member name lookup for task display
  const membersById: Record<string, string> = {}
  for (const entry of (caseload ?? [])) {
    membersById[entry.member.id] = entry.member.preferred_name || entry.member.full_name
  }

  const navigatorName = navigator?.full_name ?? (role === 'admin' ? 'Admin' : 'Navigator')

  return (
    <ToastProvider>
      <NavConsole
        navigatorName={navigatorName}
        caseload={caseload ?? []}
        tasks={tasks ?? []}
        membersById={membersById}
        caseloadError={navigator ? caseloadError : null}
        tasksError={navigator ? tasksError : null}
      />
    </ToastProvider>
  )
}
