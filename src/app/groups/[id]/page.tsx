import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PresentationList } from '@/components/presentations/PresentationList'
import { AddPresentationForm } from '@/components/presentations/AddPresentationForm'

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [group, users] = await Promise.all([
    prisma.readingGroup.findUnique({
      where: { id },
      include: {
        presentations: {
          orderBy: { order: 'asc' },
          include: { presenter: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.user.findMany({ select: { id: true, name: true } }),
  ])

  if (!group) notFound()

  const presentations = group.presentations.map((p: typeof group.presentations[number]) => ({
    ...p,
    scheduledAt: p.scheduledAt?.toISOString() ?? null,
  }))

  return (
    <div className="max-w-[980px] mx-auto px-6 py-[80px]">
      <h1 className="text-[40px] font-semibold text-[#1d1d1f] mb-2">{group.name}</h1>
      {group.description && (
        <p className="text-[17px] text-[#7a7a7a] mb-8">{group.description}</p>
      )}

      <section className="mb-10">
        <h2 className="text-[21px] font-semibold text-[#1d1d1f] mb-4">発表を追加</h2>
        <AddPresentationForm groupId={id} users={users} />
      </section>

      <section>
        <h2 className="text-[21px] font-semibold text-[#1d1d1f] mb-4">発表順番</h2>
        <PresentationList presentations={presentations} />
      </section>
    </div>
  )
}
