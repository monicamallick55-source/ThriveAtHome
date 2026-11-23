import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PROTECTED_STAFF_ROUTES = ['/navigator', '/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only guard staff routes
  const isStaffRoute = PROTECTED_STAFF_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  if (!isStaffRoute) return NextResponse.next()

  // Build a Supabase client that reads cookies from the request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Not logged in — return 401 for API-style requests, redirect for pages
    const accept = request.headers.get('accept') ?? ''
    if (accept.includes('text/html')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Check role
  const role = (user.app_metadata?.role ?? user.user_metadata?.role ?? '') as string
  const allowedForNavigator = ['navigator', 'admin', 'super_admin', 'org_admin', 'csm']
  const allowedForAdmin = ['admin', 'super_admin', 'csm']

  if (pathname.startsWith('/navigator') && !allowedForNavigator.includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (pathname.startsWith('/admin') && !allowedForAdmin.includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/navigator/:path*', '/admin/:path*'],
}
