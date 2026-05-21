import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendSlackNotification } from '@/lib/slack'

const NOTIFY_DAYS_BEFORE = [7, 3, 1]

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  let notifiedCount = 0

  for (const days of NOTIFY_DAYS_BEFORE) {
    const target = new Date(now)
    target.setDate(target.getDate() + days)

    // Get JST date string (YYYY-MM-DD) for the target day
    const jstDate = target.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })
    const start = new Date(`${jstDate}T00:00:00+09:00`)
    const end = new Date(`${jstDate}T23:59:59.999+09:00`)

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
        `発表日: ${p.scheduledAt?.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}`,
        `発表まで *${days}日* です！`,
      ].join('\n')

      try {
        await sendSlackNotification(message)
        await prisma.presentation.update({
          where: { id: p.id },
          data: { notified: true },
        })
        notifiedCount++
      } catch {
        // Leave notified: false so the next cron run retries
      }
    }
  }

  return NextResponse.json({ notified: notifiedCount })
}
