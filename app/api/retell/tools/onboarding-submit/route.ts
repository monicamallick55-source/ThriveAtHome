import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const origin = new URL(req.url).origin
    const onboardingRes = await fetch(`${origin}/api/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: req.headers.get('cookie') ?? '' },
      body: JSON.stringify(payload),
    })
    const data = (await onboardingRes.json()) as { success?: boolean; error?: string; preferred_name?: string }
    if (!onboardingRes.ok || !data.success) {
      return NextResponse.json({ success: false, error: data.error ?? 'Onboarding failed' }, { status: 400 })
    }
    return NextResponse.json({
      success: true,
      preferred_name: data.preferred_name,
      message: `Great! I've saved your profile, ${data.preferred_name ?? 'there'}. You're all set — welcome to Thrive at Home!`,
    })
  } catch (err) {
    console.error('[onboarding-submit]', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
