import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendSlackNotification } from '@/lib/slack'

const NOTIFY_DAYS_BEFORE = [7, 3, 1]

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  let notifiedCount = 0

  for (const days of NOTIFY_DAYS_BEFORE) {
    const target = new Date(now)
    target.setDate(target.getDate() + days)
    const start = new Date(target)
    start.setHours(0, 0, 0, 0)
    const end = new Date(target)
    end.setHours(23, 59, 59, 999)

    const presentations = await prisma.presentation.findMany({
      where: {
        scheduledAt: { gte: start, lte: end },
        notified: false,
      },
      include: {
        presenter: { select: { name: true } },
        group: { select: { name: true } },
      },
    })

    for (const p of presentations) {
      const message = [
        `📚 *輪読発表リマインダー*`,
        `発表者: ${p.presenter.name}`,
        `グループ: ${p.group.name}`,
        `タイトル: ${p.title ?? '（未定）'}`,
        `発表日: ${p.scheduledAt?.toLocaleDateString('ja-JP')}`,
        `発表まで *${days}日* です！`,
      ].join('\n')

      await sendSlackNotification(message)
      await prisma.presentation.update({
        where: { id: p.id },
        data: { notified: true },
      })
      notifiedCount++
    }
  }

  return NextResponse.json({ notified: notifiedCount })
}
