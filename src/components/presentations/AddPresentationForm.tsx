'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface User {
  id: string
  name: string
}

interface Props {
  groupId: string
  users: User[]
}

export function AddPresentationForm({ groupId, users }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    await fetch('/api/presentations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupId,
        presenterId: form.get('presenterId'),
        title: form.get('title') || null,
        scheduledAt: form.get('scheduledAt') || null,
      }),
    })
    setLoading(false)
    ;(e.target as HTMLFormElement).reset()
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
      <div className="flex flex-col gap-1">
        <label className="text-[14px] text-[#1d1d1f]">発表者</label>
        <select
          name="presenterId"
          required
          className="h-[44px] px-4 rounded-full border border-[#e0e0e0] text-[17px] text-[#1d1d1f] bg-white"
        >
          <option value="">選択...</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
      <Input label="タイトル（任意）" id="title" name="title" />
      <Input label="発表日（任意）" id="scheduledAt" name="scheduledAt" type="date" />
      <Button type="submit" disabled={loading}>
        {loading ? '追加中...' : '発表を追加'}
      </Button>
    </form>
  )
}
