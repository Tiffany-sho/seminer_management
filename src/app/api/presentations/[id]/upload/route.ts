import { NextResponse } from 'next/server'
import { put, del } from '@vercel/blob'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]
const MAX_SIZE = 20 * 1024 * 1024

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const presentation = await prisma.presentation.findUnique({ where: { id } })
  if (!presentation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (presentation.presenterId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only PDF or PowerPoint allowed' }, { status: 400 })
  }

  const ext = file.name.endsWith('.pptx') ? '.pptx' : file.name.endsWith('.ppt') ? '.ppt' : '.pdf'
  const blob = await put(`resumes/${id}/resume${ext}`, file, { access: 'public', allowOverwrite: true })

  try {
    await prisma.presentation.update({
      where: { id },
      data: { resumeUrl: blob.url },
    })
  } catch {
    try { await del(blob.url) } catch { /* best-effort cleanup */ }
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ url: blob.url })
}
