import { auth, signOut } from '@/lib/auth'
import Link from 'next/link'

export async function Header() {
  const session = await auth()

  return (
    <header className="h-[44px] bg-black flex items-center px-6 sticky top-0 z-50">
      <nav aria-label="メインナビゲーション" className="flex items-center justify-between w-full max-w-[1440px] mx-auto">
        <Link
          href="/dashboard"
          aria-label="ホーム"
          className="text-white text-[12px] tracking-[-0.12px]"
        >
          輪読管理
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/groups" className="text-white text-[12px] tracking-[-0.12px]">
            グループ
          </Link>
          {session?.user && (
            <div className="flex items-center gap-4">
              <span className="text-[#cccccc] text-[12px]">{session.user.name}</span>
              <form
                action={async () => {
                  'use server'
                  await signOut({ redirectTo: '/login' })
                }}
              >
                <button
                  type="submit"
                  className="bg-[#1d1d1f] text-white text-[14px] px-[15px] py-2 rounded-[8px] active:scale-95 transition-transform"
                >
                  ログアウト
                </button>
              </form>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
