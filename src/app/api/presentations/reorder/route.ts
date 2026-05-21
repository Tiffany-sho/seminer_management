import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orderedIds: unknown
  try {
    ;({ orderedIds } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!Array.isArray(orderedIds)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  await prisma.$transaction(
    orderedIds.map((id: string, index: number) =>
      prisma.presentation.update({
        where: { id },
        data: { order: index + 1 },
      })
    )
  )

  return NextResponse.json({ ok: true })
}
