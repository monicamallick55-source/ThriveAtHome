import { NextResponse } from 'next/server'
export async function POST() { return NextResponse.json({ error: 'Marketplace not yet available' }, { status: 503 }) }
