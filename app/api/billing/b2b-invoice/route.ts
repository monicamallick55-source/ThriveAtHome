import { NextResponse } from 'next/server'
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const memberCount = parseInt(searchParams.get('members') ?? '0', 10)
  const tier = searchParams.get('tier') ?? 'in-development'
  let amount = 0, description = ''
  if (tier === 'in-development') {
    amount = 50; description = '$50 flat rate — in-development tier'
  } else {
    amount = 75 + memberCount * 1.25
    description = `$75 base + $1.25 × ${memberCount} members`
  }
  return NextResponse.json({ tier, member_count: memberCount, amount_usd: amount, description, currency: 'usd' })
}
