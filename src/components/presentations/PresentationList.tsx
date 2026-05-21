'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FileUpload } from './FileUpload'

interface Presenter {
  id: string
  name: string
}

interface Presentation {
  id: string
  order: number
  title: string | null
  scheduledAt: string | null
  resumeUrl: string | null
  presenter: Presenter
}

interface Props {
  presentations: Presentation[]
}

export function PresentationList({ presentations }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('この発表を削除しますか？')) return
    setDeleting(id)
    await fetch(`/api/presentations/${id}`, { method: 'DELETE' })
    setDeleting(null)
    router.refresh()
  }

  if (presentations.length === 0) {
    return (
      <p className="text-[17px] text-[#7a7a7a]">発表が登録されていません。</p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {presentations.map((p) => (
        <Card key={p.id}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <span className="text-[14px] font-semibold text-[#0066cc]">
                #{p.order}
              </span>
              <h3 className="text-[17px] font-semibold text-[#1d1d1f] mt-1">
                {p.title ?? '（タイトル未設定）'}
              </h3>
              <p className="text-[14px] text-[#7a7a7a] mt-1">
                発表者: {p.presenter.name}
                {p.scheduledAt &&
                  ` ・ ${new Date(p.scheduledAt).toLocaleDateString('ja-JP')}`}
              </p>
              <div className="mt-3">
                <FileUpload
                  presentationId={p.id}
                  currentUrl={p.resumeUrl}
                  onUploaded={() => router.refresh()}
                />
              </div>
            </div>
            <Button
              variant="secondary"
              className="text-[14px] !py-2 !px-4 shrink-0"
              onClick={() => handleDelete(p.id)}
              disabled={deleting === p.id}
            >
              削除
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
