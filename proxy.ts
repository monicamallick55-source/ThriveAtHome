// Next.js proxy — refreshes session cookies and enforces role-based routing.
// In Next.js 16+, proxy.ts replaces middleware.ts. The exported function must be named "proxy".
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
  const isProtected = ['/dashboard', '/navigator', '/admin', '/onboarding', '/volunteer/dashboard', '/student'].some((p) =>
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

    let role = (fm?.role ?? 'family') as 'family' | 'navigator' | 'admin' | 'volunteer' | 'student'

    // If no family_members row found, check volunteers or student_volunteers table
    if (!fm) {
      const { data: vol } = await supabase
        .from('volunteers')
        .select('id')
        .eq('supabase_auth_id', user.id)
        .maybeSingle()
      if (vol) {
        role = 'volunteer'
      } else {
        const { data: sv } = await supabase
          .from('student_volunteers')
          .select('id')
          .eq('supabase_auth_id', user.id)
          .maybeSingle()
        if (sv) role = 'student'
      }
    }

    // Family users cannot access /navigator, /admin, /volunteer/dashboard, or /student
    if (role === 'family' && (path.startsWith('/navigator') || path.startsWith('/admin') || path.startsWith('/volunteer/dashboard') || path.startsWith('/student'))) {
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

    // Volunteer users: redirect away from family/navigator/admin areas to their own portal
    if (role === 'volunteer') {
      if (path.startsWith('/dashboard') || path.startsWith('/navigator') || path.startsWith('/admin')) {
        const url = request.nextUrl.clone()
        url.pathname = '/volunteer/dashboard'
        return NextResponse.redirect(url)
      }
    }

    // Student users: redirect away from other protected areas to /student
    if (role === 'student') {
      if (path.startsWith('/dashboard') || path.startsWith('/navigator') || path.startsWith('/admin') || path.startsWith('/volunteer/dashboard')) {
        const url = request.nextUrl.clone()
        url.pathname = '/student'
        return NextResponse.redirect(url)
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
