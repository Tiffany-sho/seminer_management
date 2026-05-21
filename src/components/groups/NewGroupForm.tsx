'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function NewGroupForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.get('name'),
        description: form.get('description'),
      }),
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>グループを作成</Button>
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
      <Input label="グループ名" id="name" name="name" required />
      <Input label="説明（任意）" id="description" name="description" />
      <Button type="submit" disabled={loading}>
        作成
      </Button>
      <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
        キャンセル
      </Button>
    </form>
  )
}
