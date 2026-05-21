'use client'

import { useState } from 'react'

interface Props {
  presentationId: string
  currentUrl?: string | null
  onUploaded: () => void
}

export function FileUpload({ presentationId, currentUrl, onUploaded }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError('')

    const form = new FormData()
    form.append('file', file)

    const res = await fetch(`/api/presentations/${presentationId}/upload`, {
      method: 'POST',
      body: form,
    })

    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'アップロードに失敗しました')
      return
    }
    onUploaded()
  }

  return (
    <div className="flex flex-col gap-2">
      {currentUrl && (
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#0066cc] text-[14px] underline"
        >
          レジュメを見る
        </a>
      )}
      <label className="cursor-pointer inline-block">
        <span className="bg-[#fafafc] text-[#333333] text-[14px] px-[14px] py-2 rounded-[11px] border-[3px] border-[#f0f0f0] active:scale-95 transition-transform inline-block">
          {loading ? 'アップロード中...' : 'PDF / スライドを選択'}
        </span>
        <input
          type="file"
          accept=".pdf,.ppt,.pptx"
          className="hidden"
          onChange={handleChange}
          disabled={loading}
        />
      </label>
      {error && <p className="text-red-500 text-[14px]">{error}</p>}
    </div>
  )
}
