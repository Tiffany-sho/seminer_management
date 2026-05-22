import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const [upcoming, myNext] = await Promise.all([
    prisma.presentation.findMany({
      where: { scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
      include: {
        presenter: { select: { name: true } },
        group: { select: { id: true, name: true } },
      },
    }),
    prisma.presentation.findFirst({
      where: {
        presenterId: session.user.id,
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: 'asc' },
      include: { group: { select: { id: true, name: true } } },
    }),
  ])

  return (
    <div className="max-w-[980px] mx-auto px-6 py-[80px]">
      <h1 className="text-[56px] font-semibold text-[#1d1d1f] tracking-[-0.28px] mb-2">
        こんにちは、{session.user.name}さん
      </h1>
      <p className="text-[28px] text-[#1d1d1f] mb-12">輪読管理システム</p>

      {myNext && (
        <section className="mb-12">
          <h2 className="text-[21px] font-semibold text-[#1d1d1f] mb-4">
            あなたの次の発表
          </h2>
          <Card className="border-[#0066cc]">
            <p className="text-[14px] text-[#0066cc] font-semibold">
              {myNext.group.name}
            </p>
            <p className="text-[17px] font-semibold mt-1">
              {myNext.title ?? '（タイトル未定）'}
            </p>
            {myNext.scheduledAt && (
              <p className="text-[17px] text-[#7a7a7a] mt-1">
                {myNext.scheduledAt.toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
            <div className="mt-4">
              <Link href={`/groups/${myNext.group.id}`}>
                <Button variant="secondary" className="text-[14px] !py-2">
                  詳細を見る
                </Button>
              </Link>
            </div>
          </Card>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[21px] font-semibold text-[#1d1d1f]">直近の発表予定</h2>
          <Link href="/groups">
            <Button variant="secondary" className="text-[14px] !py-2">
              グループ一覧
            </Button>
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <p className="text-[17px] text-[#7a7a7a]">
            発表予定はありません。
            <Link href="/groups" className="text-[#0066cc] ml-2">
              グループを作成する
            </Link>
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((p) => (
              <Link key={p.id} href={`/groups/${p.group.id}`}>
                <Card className="cursor-pointer hover:border-[#0066cc] transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[14px] text-[#0066cc]">{p.group.name}</p>
                      <p className="text-[17px] font-semibold">
                        {p.title ?? '（タイトル未定）'}
                      </p>
                      <p className="text-[14px] text-[#7a7a7a]">
                        発表者: {p.presenter.name}
                      </p>
                    </div>
                    {p.scheduledAt && (
                      <p className="text-[17px] text-[#7a7a7a] shrink-0">
                        {p.scheduledAt.toLocaleDateString('ja-JP')}
                      </p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
