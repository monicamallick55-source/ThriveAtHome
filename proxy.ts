import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()

  // Production: [org].thriveathome.app or [org].thriveathome.com
  // Dev: [org].localhost:3000
  const isProd = hostname.endsWith('.thriveathome.app') || hostname.endsWith('.thriveathome.com')
  const isDev  = hostname.endsWith('.localhost:3000') || hostname.endsWith('.localhost')

  if (isProd || isDev) {
    const rootDomain = isProd
      ? hostname.replace(/\.thriveathome\.(app|com)$/, '')
      : hostname.replace(/\.localhost(:\d+)?$/, '')

    // Skip www, app, api — only route org subdomains
    const reserved = ['www', 'app', 'api', 'admin', 'mail']
    if (rootDomain && !reserved.includes(rootDomain)) {
      // Rewrite [org].thriveathome.app/* → /org-admin/* with slug in header
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
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     * - api routes (let them pass through normally)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
