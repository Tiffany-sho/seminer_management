'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(e.currentTarget)
    try {
      const result = await signIn('credentials', {
        email: form.get('email'),
        password: form.get('password'),
        redirect: false,
      })
      if (result?.error) {
        setError('メールアドレスまたはパスワードが正しくありません')
      } else {
        const callbackUrl = searchParams.get('callbackUrl')
        const destination =
          callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : '/dashboard'
        router.push(destination)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-[18px] p-8 w-full max-w-sm">
      <h1 className="text-[34px] font-semibold text-[#1d1d1f] tracking-[-0.374px] mb-2">
        ログイン
      </h1>
      <p className="text-[17px] text-[#7a7a7a] mb-8">輪読管理システム</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="メールアドレス" id="email" name="email" type="email" required />
        <Input label="パスワード" id="password" name="password" type="password" required />
        <p role="alert" className="text-red-500 text-[14px] min-h-[20px]">
          {error}
        </p>
        <Button type="submit" disabled={loading} className="mt-2">
          {loading ? 'ログイン中...' : 'ログイン'}
        </Button>
      </form>

      <p className="mt-6 text-[14px] text-[#7a7a7a] text-center">
        アカウントをお持ちでない方は{' '}
        <Link href="/register" className="text-[#0066cc] hover:underline">
          新規登録
        </Link>
      </p>
    </div>
  )
}
