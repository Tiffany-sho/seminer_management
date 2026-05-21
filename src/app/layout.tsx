import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/layout/Header'

export const metadata: Metadata = {
  title: '輪読管理システム',
  description: '研究室の輪読発表順番管理アプリ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-[#f5f5f7] text-[#1d1d1f]">
        <Header />
        <main className="min-h-[calc(100vh-44px)]">{children}</main>
      </body>
    </html>
  )
}
