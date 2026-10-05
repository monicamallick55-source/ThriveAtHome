import { NextRequest, NextResponse } from 'next/server'
import { deletePostComment } from '@/lib/data/circles-comments'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  const { commentId } = await params
  const { error } = await deletePostComment(commentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
