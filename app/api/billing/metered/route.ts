import { NextResponse } from 'next/server'
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const calls = parseInt(searchParams.get('calls') ?? '0', 10)
  const rate = 0.08
  return NextResponse.json({ calls, rate_per_call: rate, amount_usd: parseFloat((calls * rate).toFixed(2)), description: `${calls} Aria calls × $0.08/call`, currency: 'usd' })
}
