'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const form = new FormData(e.currentTarget)
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.get('email'),
          name: form.get('name'),
          password: form.get('password'),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? '登録に失敗しました')
      } else {
        router.push('/login')
      }
    } catch {
      setError('ネットワークエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-[18px] p-8 w-full max-w-sm">
      <h1 className="text-[34px] font-semibold text-[#1d1d1f] tracking-[-0.374px] mb-2">
        新規登録
      </h1>
      <p className="text-[17px] text-[#7a7a7a] mb-8">アカウントを作成してください</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="お名前" id="name" name="name" type="text" required />
        <Input label="メールアドレス" id="email" name="email" type="email" required />
        <Input label="パスワード（8文字以上）" id="password" name="password" type="password" required minLength={8} />
        <p role="alert" className="text-red-500 text-[14px] min-h-[20px]">
          {error}
        </p>
        <Button type="submit" disabled={loading} className="mt-2">
          {loading ? '作成中...' : 'アカウント作成'}
        </Button>
      </form>

      <p className="mt-6 text-[14px] text-[#7a7a7a] text-center">
        すでにアカウントをお持ちの方は{' '}
        <Link href="/login" className="text-[#0066cc] hover:underline">
          ログイン
        </Link>
      </p>
    </div>
  )
}
