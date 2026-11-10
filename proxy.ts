import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = [
  '/dashboard', '/navigator', '/admin', '/employer-admin', '/volunteer',
  '/org-admin', '/vso-admin', '/university-admin', '/network-admin',
  '/senior-center-admin', '/aaa-admin', '/agency-admin', '/care-worker', '/school-admin',
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()

  // Auth guard: redirect unauthenticated users to /login
  const isProtected = PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (isProtected) {
    const token = request.cookies.getAll().find(c =>
      c.name.includes('auth-token') || c.name === 'sb-access-token'
    )?.value
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Subdomain routing
  const isProd = hostname.endsWith('.thriveathome.app') || hostname.endsWith('.thriveathome.com')
  const isDev  = hostname.endsWith('.localhost:3000') || hostname.endsWith('.localhost')

  if (isProd || isDev) {
    const rootDomain = isProd
      ? hostname.replace(/\.thriveathome\.(app|com)$/, '')
      : hostname.replace(/\.localhost(:\d+)?$/, '')

    const reserved = ['www', 'app', 'api', 'admin', 'mail']
    if (rootDomain && !reserved.includes(rootDomain)) {
      url.pathname = url.pathname.startsWith('/org-admin')
        ? url.pathname
        : `/org-admin${url.pathname}`

      const response = NextResponse.rewrite(url)
      response.headers.set('x-org-slug', rootDomain)
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
