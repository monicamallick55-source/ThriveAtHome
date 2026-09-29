import { NextResponse } from 'next/server'
import { searchLiveEvents } from '@/lib/data/eventSearch'

export async function GET() {
  try {
    const result = await searchLiveEvents('cultural', '94404', 25)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) })
  }
}
