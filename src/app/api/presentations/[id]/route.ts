import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  let data: Record<string, unknown>
  try {
    data = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const updated = await prisma.presentation.update({
    where: { id },
    data: {
      title: data.title !== undefined ? (data.title as string | null) : undefined,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt as string) : undefined,
    },
    include: { presenter: { select: { id: true, name: true } } },
  })
  return NextResponse.json(updated)
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const deleted = await tx.presentation.delete({ where: { id } })
      await tx.presentation.updateMany({
        where: { groupId: deleted.groupId, order: { gt: deleted.order } },
        data: { order: { decrement: 1 } },
      })
    })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
