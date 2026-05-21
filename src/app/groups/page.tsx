import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { NewGroupForm } from '@/components/groups/NewGroupForm'

export default async function GroupsPage() {
  const groups = await prisma.readingGroup.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { presentations: true } } },
  })

  return (
    <div className="max-w-[980px] mx-auto px-6 py-[80px]">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[40px] font-semibold text-[#1d1d1f]">輪読グループ</h1>
        <NewGroupForm />
      </div>

      {groups.length === 0 ? (
        <p className="text-[17px] text-[#7a7a7a]">グループがありません。作成してください。</p>
      ) : (
        <div className="grid gap-4">
          {groups.map((g) => (
            <Link key={g.id} href={`/groups/${g.id}`}>
              <Card className="hover:border-[#0066cc] transition-colors cursor-pointer">
                <h2 className="text-[21px] font-semibold text-[#1d1d1f]">{g.name}</h2>
                {g.description && (
                  <p className="text-[17px] text-[#7a7a7a] mt-1">{g.description}</p>
                )}
                <p className="text-[14px] text-[#7a7a7a] mt-3">
                  発表 {g._count.presentations} 件
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
