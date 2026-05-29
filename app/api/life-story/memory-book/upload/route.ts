import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getFamilyMemberByAuthId } from '@/lib/data/family'
import { updateMemoryBookStoragePath, updateCollageStoragePath } from '@/lib/data/life-story'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'memory-books'

// POST — upload a Memory Book PDF or Memory Collage PDF to Supabase Storage
// Expects multipart/form-data: 'pdf' (Blob) + 'book_id' (string) + 'page_count' + optional 'file_type' ('book'|'collage')
// + optional 'purchase_date' (ISO string)
export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: fm } = await getFamilyMemberByAuthId(user.id)
  if (!fm?.member_id) return NextResponse.json({ error: 'No member linked' }, { status: 404 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const pdf = formData.get('pdf') as Blob | null
  const bookId = formData.get('book_id') as string | null
  const pageCount = parseInt((formData.get('page_count') as string) ?? '0', 10)
  const fileType = (formData.get('file_type') as string | null) ?? 'book'
  const purchaseDate = (formData.get('purchase_date') as string | null) ?? null

  if (!pdf || !bookId) {
    return NextResponse.json({ error: 'Missing pdf or book_id' }, { status: 400 })
  }

  if (pdf.size > 52428800) {
    return NextResponse.json({ error: 'PDF exceeds 50 MB limit' }, { status: 400 })
  }

  const filename = fileType === 'collage' ? 'memory-collage.pdf' : 'memory-book.pdf'
  const storagePath = `${fm.member_id}/${bookId}/${filename}`
  const arrayBuffer = await pdf.arrayBuffer()

  const supabase = createAdminClient()
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, { contentType: 'application/pdf', upsert: true })

  if (uploadError) {
    console.error('[memory-book/upload] Storage error:', uploadError)
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  if (fileType === 'collage') {
    const { error: updateError } = await updateCollageStoragePath({
      id: bookId,
      memberId: fm.member_id,
      collageStoragePath: storagePath,
    })
    if (updateError) console.warn('[memory-book/upload] Collage DB update failed:', updateError)
  } else {
    const { error: updateError } = await updateMemoryBookStoragePath({
      id: bookId,
      memberId: fm.member_id,
      storagePath,
      pageCount: isNaN(pageCount) ? undefined : pageCount,
      purchaseDate,
    })
    if (updateError) console.warn('[memory-book/upload] DB update failed:', updateError)
  }

  const { data: signedData } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600)

  return NextResponse.json({ storagePath, downloadUrl: signedData?.signedUrl ?? null })
}
