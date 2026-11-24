import { test } from '@playwright/test'
import { loginAs, ACCOUNTS, BASE_URL as BASE, getToken } from './helpers'

test('debug TC-M-WF02', async ({ page }) => {
  await loginAs(page, ACCOUNTS.member, '/dashboard', test)
  const token = await getToken(page, ACCOUNTS.member)
  console.log('TOKEN:', token ? token.slice(0,20) + '...' : 'NULL')
  
  const cookies = await page.context().cookies()
  console.log('COOKIES:', cookies.map(c => c.name).join(', '))
  
  const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ')
  const res = await page.request.post(`${BASE}/api/advisor-request`, {
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieStr },
    data: { advisor_type: 'legal', notes: 'debug test' },
  })
  console.log('STATUS:', res.status())
  console.log('BODY:', (await res.text()).slice(0, 300))
})
