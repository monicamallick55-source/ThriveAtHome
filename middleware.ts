import { NextRequest, NextResponse } from 'next/server'

const PROTECTED = ['/dashboard', '/navigator', '/admin', '/employer-admin', '/volunteer', '/org-admin', '/vso-admin', '/university-admin', '/network-admin', '/senior-center-admin', '/aaa-admin', '/agency-admin', '/care-worker', '/school-admin']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isProtected = PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (!isProtected) return NextResponse.next()

  const token = req.cookies.get('sb-access-token')?.value
    ?? req.cookies.get('sb-qdniskppkfqjmtpkftdt-auth-token')?.value
    ?? req.cookies.getAll().find(c => c.name.includes('auth-token'))?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/navigator/:path*', '/admin/:path*', '/employer-admin/:path*', '/volunteer/:path*', '/org-admin/:path*', '/vso-admin/:path*', '/university-admin/:path*', '/network-admin/:path*', '/senior-center-admin/:path*', '/aaa-admin/:path*', '/agency-admin/:path*', '/care-worker/:path*', '/school-admin/:path*'],
}
