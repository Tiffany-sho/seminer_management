import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let groupId: string | undefined, presenterId: string | undefined, title: string | undefined, scheduledAt: string | undefined
  try {
    ;({ groupId, presenterId, title, scheduledAt } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!groupId || !presenterId) {
    return NextResponse.json({ error: 'groupId and presenterId required' }, { status: 400 })
  }

  const count = await prisma.presentation.count({ where: { groupId } })
  const presentation = await prisma.presentation.create({
    data: {
      groupId,
      presenterId,
      title: title || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      order: count + 1,
    },
    include: { presenter: { select: { id: true, name: true } } },
  })

  return NextResponse.json(presentation, { status: 201 })
}
