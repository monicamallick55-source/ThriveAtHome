// Next.js proxy (previously middleware) — refreshes session cookies and enforces role-based routing.
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Unauthenticated users: guard all protected areas
  const isProtected = ['/dashboard', '/navigator', '/admin', '/onboarding'].some((p) =>
    path.startsWith(p)
  )
  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Authenticated users: role-based routing
  if (user) {
    const { data: fm } = await supabase
      .from('family_members')
      .select('role')
      .eq('supabase_auth_id', user.id)
      .maybeSingle()

    const role = (fm?.role ?? 'family') as 'family' | 'navigator' | 'admin'

    // Family users cannot access /navigator or /admin — redirect to dashboard
    if (role === 'family' && (path.startsWith('/navigator') || path.startsWith('/admin'))) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Navigator users landing on /dashboard root are redirected to /navigator
    if (role === 'navigator' && path === '/dashboard') {
      const url = request.nextUrl.clone()
      url.pathname = '/navigator'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
