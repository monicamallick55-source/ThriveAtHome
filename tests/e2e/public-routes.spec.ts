import { test, expect } from "@playwright/test"
import { loginAs, ACCOUNTS, BASE_URL as BASE } from "./helpers"
const SUPABASE_URL = "https://qdniskppkfqjmtpkftdt.supabase.co"
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3OTY2NTcsImV4cCI6MjA5NDM3MjY1N30.eKYDxvAXl38N9wgrY-tG7cIsxL83o1W3vd_GIme2pZg"

const PUBLIC_ROUTES_LIST = [
  '/', '/about', '/for-families', '/for-volunteers', '/pricing',
  '/employers', '/donate', '/contact', '/privacy', '/terms',
  '/blog', '/resources', '/login', '/signup', '/join',
  '/volunteer', '/volunteer/apply', '/partners',
]

for (const path of PUBLIC_ROUTES_LIST) {
  test(`TC-P070 — ${path} returns non-500`, async ({ page }) => {
    const res = await page.request.get(`${BASE}${path}`)
    expect(res.status()).not.toBe(500)
    expect([200, 301, 302, 404]).toContain(res.status())
  })
}
