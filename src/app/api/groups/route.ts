import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const groups = await prisma.readingGroup.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { presentations: true } } },
  })
  return NextResponse.json(groups)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let name: string | undefined, description: string | undefined
  try {
    ;({ name, description } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const group = await prisma.readingGroup.create({
    data: { name, description },
  })
  return NextResponse.json(group, { status: 201 })
}
