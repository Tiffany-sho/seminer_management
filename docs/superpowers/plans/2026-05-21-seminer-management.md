# 輪読管理アプリ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 研究室の輪読（論文・書籍）の発表順番を管理するWebアプリを構築する。発表者はレジュメをアップロードでき、自分の発表が近づくとSlack通知が届く。

**Architecture:** Next.js 15 (App Router) + TypeScript によるフルスタック構成。PostgreSQL (Supabase) + Prisma ORM でデータ管理、NextAuth.js v5 でメール+パスワード認証、Vercel Blob でファイル保存、Vercel Cron Jobs で毎朝9時に通知トリガー。

**Tech Stack:** Next.js 15, TypeScript, Prisma 6, PostgreSQL (Supabase), NextAuth.js v5 (beta), Tailwind CSS, Vercel Blob, Slack Incoming Webhook, Jest, @testing-library/react

---

## ファイルマップ

| ファイル | 役割 |
|---|---|
| `prisma/schema.prisma` | DB スキーマ |
| `src/lib/prisma.ts` | Prisma クライアント singleton |
| `src/lib/auth.ts` | NextAuth 設定 |
| `src/lib/slack.ts` | Slack 通知ユーティリティ |
| `src/middleware.ts` | 認証保護ミドルウェア |
| `src/types/next-auth.d.ts` | NextAuth 型拡張 |
| `src/app/layout.tsx` | ルートレイアウト |
| `src/app/page.tsx` | ルート → /dashboard リダイレクト |
| `src/app/(auth)/layout.tsx` | 認証ページ共通レイアウト |
| `src/app/(auth)/login/page.tsx` | ログインページ |
| `src/app/(auth)/register/page.tsx` | 登録ページ |
| `src/app/dashboard/page.tsx` | ダッシュボード（次回発表・直近スケジュール） |
| `src/app/groups/page.tsx` | 輪読グループ一覧 |
| `src/app/groups/[id]/page.tsx` | グループ詳細・発表リスト |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth エンドポイント |
| `src/app/api/register/route.ts` | ユーザー登録 |
| `src/app/api/groups/route.ts` | グループ一覧・作成 |
| `src/app/api/groups/[id]/route.ts` | グループ取得・削除 |
| `src/app/api/presentations/route.ts` | 発表作成 |
| `src/app/api/presentations/[id]/route.ts` | 発表更新・削除 |
| `src/app/api/presentations/[id]/upload/route.ts` | レジュメアップロード |
| `src/app/api/presentations/reorder/route.ts` | 順番並べ替え |
| `src/app/api/cron/notify/route.ts` | Cron 通知エンドポイント |
| `src/components/ui/Button.tsx` | 汎用ボタン |
| `src/components/ui/Input.tsx` | 汎用入力 |
| `src/components/ui/Card.tsx` | 汎用カード |
| `src/components/layout/Header.tsx` | グローバルナビ |
| `src/components/groups/NewGroupForm.tsx` | グループ作成フォーム |
| `src/components/presentations/PresentationList.tsx` | 発表リスト |
| `src/components/presentations/AddPresentationForm.tsx` | 発表追加フォーム |
| `src/components/presentations/FileUpload.tsx` | ファイルアップロード UI |
| `vercel.json` | Cron Job 設定 |
| `__tests__/api/register.test.ts` | 登録 API テスト |
| `__tests__/api/groups.test.ts` | グループ API テスト |
| `__tests__/api/presentations.test.ts` | 発表 API テスト |
| `__tests__/lib/slack.test.ts` | Slack 通知テスト |

---

### Task 1: Next.js プロジェクト初期化

**Files:**
- Create: (プロジェクトルート全体に Next.js を scaffold)
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Create: `.env.local`

- [ ] **Step 1: Next.js プロジェクトを現在のディレクトリに作成**

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --yes
```

Expected: Next.js 15 プロジェクトが現在のディレクトリに展開される（既存の README.md, CLAUDE.md, DESIGN.md は上書きされないことを確認すること）

- [ ] **Step 2: 追加パッケージをインストール**

```bash
npm install prisma @prisma/client next-auth@beta bcryptjs @vercel/blob
npm install --save-dev @types/bcryptjs jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom ts-jest @types/jest
```

- [ ] **Step 3: Jest 設定ファイルを作成**

`jest.config.ts`:
```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

export default createJestConfig(config)
```

`jest.setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 4: package.json に test スクリプトを追加**

`package.json` の `scripts` セクションに以下を追加（`next dev` などの既存スクリプトはそのまま残す）:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 5: 環境変数テンプレートを作成**

`.env.local`:
```env
DATABASE_URL="postgresql://user:password@host:5432/seminer_management"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/xxx/yyy/zzz"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxx"
CRON_SECRET="random-secret-for-cron-protection"
```

- [ ] **Step 6: .env.local が .gitignore に含まれていることを確認**

```bash
grep ".env.local" .gitignore
```

Expected: `.env.local` の行が出力される（なければ追加する）

- [ ] **Step 7: コミット**

```bash
git add -A
git commit -m "feat: initialize Next.js project with TypeScript and Tailwind"
```

---

### Task 2: Prisma スキーマと DB セットアップ

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`

- [ ] **Step 1: Prisma を初期化**

```bash
npx prisma init
```

Expected: `prisma/schema.prisma` と `.env` が作成される（`.env` の `DATABASE_URL` は `.env.local` で管理するため削除してよい）

- [ ] **Step 2: `prisma/schema.prisma` を以下の内容で上書きする**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String         @id @default(cuid())
  email         String         @unique
  name          String
  password      String
  createdAt     DateTime       @default(now())
  presentations Presentation[]

  @@map("users")
}

model ReadingGroup {
  id            String         @id @default(cuid())
  name          String
  description   String?
  createdAt     DateTime       @default(now())
  presentations Presentation[]

  @@map("reading_groups")
}

model Presentation {
  id          String       @id @default(cuid())
  order       Int
  title       String?
  scheduledAt DateTime?
  resumeUrl   String?
  notified    Boolean      @default(false)
  createdAt   DateTime     @default(now())
  presenter   User         @relation(fields: [presenterId], references: [id])
  presenterId String
  group       ReadingGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  groupId     String

  @@unique([groupId, order])
  @@map("presentations")
}
```

- [ ] **Step 3: Prisma クライアント singleton を作成**

`src/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 4: DATABASE_URL を Supabase から取得してセット**

Supabase (https://supabase.com) でプロジェクト作成 → Project Settings → Database → Connection string (URI mode) をコピーして `.env.local` の `DATABASE_URL` にセット。パスワードはプロジェクト作成時に設定したものを使う。

- [ ] **Step 5: マイグレーション実行**

```bash
npx prisma migrate dev --name init
```

Expected: `prisma/migrations/` ディレクトリが作成され、テーブルが DB に作成される

- [ ] **Step 6: コミット**

```bash
git add prisma/schema.prisma src/lib/prisma.ts
git commit -m "feat: add Prisma schema and database client"
```

---

### Task 3: NextAuth 認証設定

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/middleware.ts`
- Create: `src/types/next-auth.d.ts`

- [ ] **Step 1: `src/lib/auth.ts` を作成**

```typescript
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })
        if (!user) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )
        if (!isValid) return null

        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      return session
    },
  },
})
```

- [ ] **Step 2: NextAuth ルートを作成**

`src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import { handlers } from '@/lib/auth'
export const { GET, POST } = handlers
```

- [ ] **Step 3: 認証ミドルウェアを作成**

`src/middleware.ts`:
```typescript
import { auth } from '@/lib/auth'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage =
    req.nextUrl.pathname.startsWith('/login') ||
    req.nextUrl.pathname.startsWith('/register')

  if (!isLoggedIn && !isAuthPage) {
    return Response.redirect(new URL('/login', req.nextUrl))
  }
})

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 4: NextAuth のセッション型を拡張**

`src/types/next-auth.d.ts`:
```typescript
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
    } & DefaultSession['user']
  }
}
```

- [ ] **Step 5: NEXTAUTH_SECRET を生成してセット**

```bash
openssl rand -base64 32
```

生成した値を `.env.local` の `NEXTAUTH_SECRET` にセット。

- [ ] **Step 6: コミット**

```bash
git add src/lib/auth.ts src/app/api/auth/ src/middleware.ts src/types/
git commit -m "feat: add NextAuth credentials authentication and middleware"
```

---

### Task 4: ユーザー登録 API

**Files:**
- Create: `src/app/api/register/route.ts`
- Create: `__tests__/api/register.test.ts`

- [ ] **Step 1: テストを作成**

`__tests__/api/register.test.ts`:
```typescript
import { POST } from '@/app/api/register/route'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

describe('POST /api/register', () => {
  it('新しいユーザーを作成して201を返す', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
    })

    const req = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.email).toBe('test@example.com')
  })

  it('既存メールアドレスで400を返す', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'existing',
      email: 'test@example.com',
    })

    const req = new Request('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
npm test -- __tests__/api/register.test.ts
```

Expected: FAIL — Cannot find module '@/app/api/register/route'

- [ ] **Step 3: 登録 API を実装**

`src/app/api/register/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const { email, name, password } = await req.json()

  if (!email || !name || !password) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { email, name, password: hashed },
    select: { id: true, email: true, name: true },
  })

  return NextResponse.json(user, { status: 201 })
}
```

- [ ] **Step 4: テストが通ることを確認**

```bash
npm test -- __tests__/api/register.test.ts
```

Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/app/api/register/ __tests__/api/register.test.ts
git commit -m "feat: add user registration API"
```

---

### Task 5: UI プリミティブコンポーネント

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Input.tsx`
- Create: `src/components/ui/Card.tsx`

- [ ] **Step 1: Button コンポーネントを作成**

`src/components/ui/Button.tsx`:
```typescript
import { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  const base =
    'px-[22px] py-[11px] rounded-full text-[17px] font-normal transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-[#0066cc] text-white',
    secondary: 'bg-white text-[#0066cc] border border-[#0066cc]',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props} />
  )
}
```

- [ ] **Step 2: Input コンポーネントを作成**

`src/components/ui/Input.tsx`:
```typescript
import { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function Input({ label, id, className = '', ...props }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[14px] text-[#1d1d1f]">
        {label}
      </label>
      <input
        id={id}
        className={`h-[44px] px-5 rounded-full border border-[#e0e0e0] text-[17px] text-[#1d1d1f] outline-none focus:border-[#0066cc] ${className}`}
        {...props}
      />
    </div>
  )
}
```

- [ ] **Step 3: Card コンポーネントを作成**

`src/components/ui/Card.tsx`:
```typescript
interface Props {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: Props) {
  return (
    <div className={`bg-white rounded-[18px] border border-[#e0e0e0] p-6 ${className}`}>
      {children}
    </div>
  )
}
```

- [ ] **Step 4: コミット**

```bash
git add src/components/ui/
git commit -m "feat: add UI primitive components (Button, Input, Card)"
```

---

### Task 6: 認証ページ (ログイン・登録)

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/register/page.tsx`

- [ ] **Step 1: 認証ページ共通レイアウトを作成**

`src/app/(auth)/layout.tsx`:
```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
      {children}
    </div>
  )
}
```

- [ ] **Step 2: ログインページを作成**

`src/app/(auth)/login/page.tsx`:
```typescript
'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      email: form.get('email'),
      password: form.get('password'),
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError('メールアドレスまたはパスワードが正しくありません')
    } else {
      router.push('/dashboard')
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
        {error && <p className="text-red-500 text-[14px]">{error}</p>}
        <Button type="submit" disabled={loading} className="mt-2">
          {loading ? 'ログイン中...' : 'ログイン'}
        </Button>
      </form>

      <p className="mt-6 text-[14px] text-[#7a7a7a] text-center">
        アカウントをお持ちでない方は{' '}
        <Link href="/register" className="text-[#0066cc]">
          新規登録
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 3: 登録ページを作成**

`src/app/(auth)/register/page.tsx`:
```typescript
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
    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? '登録に失敗しました')
    } else {
      router.push('/login')
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
        {error && <p className="text-red-500 text-[14px]">{error}</p>}
        <Button type="submit" disabled={loading} className="mt-2">
          {loading ? '作成中...' : 'アカウント作成'}
        </Button>
      </form>

      <p className="mt-6 text-[14px] text-[#7a7a7a] text-center">
        すでにアカウントをお持ちの方は{' '}
        <Link href="/login" className="text-[#0066cc]">
          ログイン
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 4: コミット**

```bash
git add src/app/(auth)/
git commit -m "feat: add login and register pages"
```

---

### Task 7: グローバルナビゲーションとルートレイアウト

**Files:**
- Create: `src/components/layout/Header.tsx`
- Modify: `src/app/layout.tsx`
- Create: `src/app/page.tsx`

- [ ] **Step 1: Header コンポーネントを作成**

`src/components/layout/Header.tsx`:
```typescript
import { auth, signOut } from '@/lib/auth'
import Link from 'next/link'

export async function Header() {
  const session = await auth()

  return (
    <header className="h-[44px] bg-black flex items-center px-6 sticky top-0 z-50">
      <nav className="flex items-center justify-between w-full max-w-[1440px] mx-auto">
        <Link
          href="/dashboard"
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
```

- [ ] **Step 2: ルートレイアウトを更新**

`src/app/layout.tsx`:
```typescript
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
```

- [ ] **Step 3: ルートを /dashboard にリダイレクト**

`src/app/page.tsx`:
```typescript
import { redirect } from 'next/navigation'

export default function HomePage() {
  redirect('/dashboard')
}
```

- [ ] **Step 4: コミット**

```bash
git add src/components/layout/ src/app/layout.tsx src/app/page.tsx
git commit -m "feat: add global navigation header and root layout"
```

---

### Task 8: グループ API

**Files:**
- Create: `src/app/api/groups/route.ts`
- Create: `src/app/api/groups/[id]/route.ts`
- Create: `__tests__/api/groups.test.ts`

- [ ] **Step 1: テストを作成**

`__tests__/api/groups.test.ts`:
```typescript
import { GET, POST } from '@/app/api/groups/route'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    readingGroup: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  auth: jest.fn().mockResolvedValue({ user: { id: 'user-1', name: 'Test' } }),
}))

describe('GET /api/groups', () => {
  it('グループ一覧を返す', async () => {
    ;(prisma.readingGroup.findMany as jest.Mock).mockResolvedValue([
      { id: 'g-1', name: '論文輪読', description: null, createdAt: new Date(), _count: { presentations: 3 } },
    ])

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].name).toBe('論文輪読')
  })
})

describe('POST /api/groups', () => {
  it('新しいグループを作成して201を返す', async () => {
    ;(prisma.readingGroup.create as jest.Mock).mockResolvedValue({
      id: 'g-2',
      name: '書籍輪読',
      description: '技術書を読む会',
      createdAt: new Date(),
    })

    const req = new Request('http://localhost/api/groups', {
      method: 'POST',
      body: JSON.stringify({ name: '書籍輪読', description: '技術書を読む会' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.name).toBe('書籍輪読')
  })
})
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
npm test -- __tests__/api/groups.test.ts
```

Expected: FAIL

- [ ] **Step 3: グループ一覧・作成 API を実装**

`src/app/api/groups/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const groups = await prisma.readingGroup.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { presentations: true } } },
  })
  return NextResponse.json(groups)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const group = await prisma.readingGroup.create({
    data: { name, description },
  })
  return NextResponse.json(group, { status: 201 })
}
```

- [ ] **Step 4: グループ個別 API を実装**

`src/app/api/groups/[id]/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const group = await prisma.readingGroup.findUnique({
    where: { id },
    include: {
      presentations: {
        orderBy: { order: 'asc' },
        include: { presenter: { select: { id: true, name: true, email: true } } },
      },
    },
  })

  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(group)
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.readingGroup.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 5: テストが通ることを確認**

```bash
npm test -- __tests__/api/groups.test.ts
```

Expected: PASS

- [ ] **Step 6: コミット**

```bash
git add src/app/api/groups/ __tests__/api/groups.test.ts
git commit -m "feat: add reading group CRUD API"
```

---

### Task 9: 発表 (Presentation) API

**Files:**
- Create: `src/app/api/presentations/route.ts`
- Create: `src/app/api/presentations/[id]/route.ts`
- Create: `src/app/api/presentations/reorder/route.ts`
- Create: `__tests__/api/presentations.test.ts`

- [ ] **Step 1: テストを作成**

`__tests__/api/presentations.test.ts`:
```typescript
import { POST } from '@/app/api/presentations/route'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    presentation: {
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  auth: jest.fn().mockResolvedValue({ user: { id: 'user-1', name: 'Test' } }),
}))

describe('POST /api/presentations', () => {
  it('新しい発表を作成して201を返す', async () => {
    ;(prisma.presentation.count as jest.Mock).mockResolvedValue(2)
    ;(prisma.presentation.create as jest.Mock).mockResolvedValue({
      id: 'p-1',
      order: 3,
      title: 'Attention is All You Need',
      groupId: 'g-1',
      presenterId: 'user-1',
      presenter: { id: 'user-1', name: 'Test' },
    })

    const req = new Request('http://localhost/api/presentations', {
      method: 'POST',
      body: JSON.stringify({
        groupId: 'g-1',
        presenterId: 'user-1',
        title: 'Attention is All You Need',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.order).toBe(3)
  })
})
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
npm test -- __tests__/api/presentations.test.ts
```

Expected: FAIL

- [ ] **Step 3: 発表作成 API を実装**

`src/app/api/presentations/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { groupId, presenterId, title, scheduledAt } = await req.json()
  if (!groupId || !presenterId) {
    return NextResponse.json({ error: 'groupId and presenterId required' }, { status: 400 })
  }

  const count = await prisma.presentation.count({ where: { groupId } })
  const presentation = await prisma.presentation.create({
    data: {
      groupId,
      presenterId,
      title: title || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      order: count + 1,
    },
    include: { presenter: { select: { id: true, name: true } } },
  })

  return NextResponse.json(presentation, { status: 201 })
}
```

- [ ] **Step 4: 発表更新・削除 API を実装**

`src/app/api/presentations/[id]/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const data = await req.json()

  const updated = await prisma.presentation.update({
    where: { id },
    data: {
      title: data.title ?? undefined,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
    },
    include: { presenter: { select: { id: true, name: true } } },
  })
  return NextResponse.json(updated)
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const deleted = await prisma.presentation.delete({ where: { id } })

  await prisma.presentation.updateMany({
    where: { groupId: deleted.groupId, order: { gt: deleted.order } },
    data: { order: { decrement: 1 } },
  })

  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 5: 順番並べ替え API を実装**

`src/app/api/presentations/reorder/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderedIds } = await req.json()
  if (!Array.isArray(orderedIds)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  await prisma.$transaction(
    orderedIds.map((id: string, index: number) =>
      prisma.presentation.update({
        where: { id },
        data: { order: index + 1 },
      })
    )
  )

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 6: テストが通ることを確認**

```bash
npm test -- __tests__/api/presentations.test.ts
```

Expected: PASS

- [ ] **Step 7: コミット**

```bash
git add src/app/api/presentations/ __tests__/api/presentations.test.ts
git commit -m "feat: add presentation CRUD and reorder API"
```

---

### Task 10: ファイルアップロード API とコンポーネント

**Files:**
- Create: `src/app/api/presentations/[id]/upload/route.ts`
- Create: `src/components/presentations/FileUpload.tsx`

- [ ] **Step 1: アップロード API を実装**

`src/app/api/presentations/[id]/upload/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]
const MAX_SIZE = 20 * 1024 * 1024

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only PDF or PowerPoint allowed' }, { status: 400 })
  }

  const blob = await put(`resumes/${id}/${file.name}`, file, { access: 'public' })

  const updated = await prisma.presentation.update({
    where: { id },
    data: { resumeUrl: blob.url },
  })

  return NextResponse.json({ url: blob.url, presentation: updated })
}
```

- [ ] **Step 2: FileUpload コンポーネントを作成**

`src/components/presentations/FileUpload.tsx`:
```typescript
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
```

- [ ] **Step 3: コミット**

```bash
git add src/app/api/presentations/[id]/upload/ src/components/presentations/FileUpload.tsx
git commit -m "feat: add file upload API and component"
```

---

### Task 11: Slack 通知と Cron エンドポイント

**Files:**
- Create: `src/lib/slack.ts`
- Create: `src/app/api/cron/notify/route.ts`
- Create: `__tests__/lib/slack.test.ts`
- Create: `vercel.json`

- [ ] **Step 1: Slack テストを作成**

`__tests__/lib/slack.test.ts`:
```typescript
import { sendSlackNotification } from '@/lib/slack'

global.fetch = jest.fn()

describe('sendSlackNotification', () => {
  beforeEach(() => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test'
    ;(fetch as jest.Mock).mockClear()
  })

  it('Slack webhook に POST する', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({ ok: true })

    await sendSlackNotification('テスト通知')

    expect(fetch).toHaveBeenCalledWith(
      'https://hooks.slack.com/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ text: 'テスト通知' }),
      })
    )
  })

  it('SLACK_WEBHOOK_URL が未設定の場合は何もしない', async () => {
    delete process.env.SLACK_WEBHOOK_URL
    await sendSlackNotification('テスト')
    expect(fetch).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
npm test -- __tests__/lib/slack.test.ts
```

Expected: FAIL

- [ ] **Step 3: Slack ユーティリティを実装**

`src/lib/slack.ts`:
```typescript
export async function sendSlackNotification(text: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) return

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
}
```

- [ ] **Step 4: テストが通ることを確認**

```bash
npm test -- __tests__/lib/slack.test.ts
```

Expected: PASS

- [ ] **Step 5: Cron 通知エンドポイントを実装**

`src/app/api/cron/notify/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendSlackNotification } from '@/lib/slack'

const NOTIFY_DAYS_BEFORE = [7, 3, 1]

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  let notifiedCount = 0

  for (const days of NOTIFY_DAYS_BEFORE) {
    const target = new Date(now)
    target.setDate(target.getDate() + days)
    const start = new Date(target)
    start.setHours(0, 0, 0, 0)
    const end = new Date(target)
    end.setHours(23, 59, 59, 999)

    const presentations = await prisma.presentation.findMany({
      where: {
        scheduledAt: { gte: start, lte: end },
        notified: false,
      },
      include: {
        presenter: { select: { name: true } },
        group: { select: { name: true } },
      },
    })

    for (const p of presentations) {
      const message = [
        `📚 *輪読発表リマインダー*`,
        `発表者: ${p.presenter.name}`,
        `グループ: ${p.group.name}`,
        `タイトル: ${p.title ?? '（未定）'}`,
        `発表日: ${p.scheduledAt?.toLocaleDateString('ja-JP')}`,
        `発表まで *${days}日* です！`,
      ].join('\n')

      await sendSlackNotification(message)
      await prisma.presentation.update({
        where: { id: p.id },
        data: { notified: true },
      })
      notifiedCount++
    }
  }

  return NextResponse.json({ notified: notifiedCount })
}
```

- [ ] **Step 6: vercel.json で Cron Job を設定**

`vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/notify",
      "schedule": "0 9 * * *"
    }
  ]
}
```

注意: Vercel Cron の本番環境では `CRON_SECRET` を Vercel 環境変数に設定し、Cron エンドポイント呼び出し時に `Authorization: Bearer <CRON_SECRET>` ヘッダーを手動で付与するか、`vercel/cron` の署名検証に切り替えること。

- [ ] **Step 7: コミット**

```bash
git add src/lib/slack.ts src/app/api/cron/ __tests__/lib/slack.test.ts vercel.json
git commit -m "feat: add Slack notification and cron job endpoint"
```

---

### Task 12: グループ・発表管理ページ

**Files:**
- Create: `src/app/groups/page.tsx`
- Create: `src/app/groups/[id]/page.tsx`
- Create: `src/components/groups/NewGroupForm.tsx`
- Create: `src/components/presentations/PresentationList.tsx`
- Create: `src/components/presentations/AddPresentationForm.tsx`

- [ ] **Step 1: NewGroupForm クライアントコンポーネントを作成**

`src/components/groups/NewGroupForm.tsx`:
```typescript
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
      <Button type="submit" disabled={loading}>作成</Button>
      <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
        キャンセル
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: グループ一覧ページを作成**

`src/app/groups/page.tsx`:
```typescript
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
```

- [ ] **Step 3: AddPresentationForm を作成**

`src/components/presentations/AddPresentationForm.tsx`:
```typescript
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
```

- [ ] **Step 4: PresentationList コンポーネントを作成**

`src/components/presentations/PresentationList.tsx`:
```typescript
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
```

- [ ] **Step 5: グループ詳細ページを作成**

`src/app/groups/[id]/page.tsx`:
```typescript
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

  const presentations = group.presentations.map((p) => ({
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
```

- [ ] **Step 6: コミット**

```bash
git add src/app/groups/ src/components/
git commit -m "feat: add group and presentation management pages"
```

---

### Task 13: ダッシュボードページ

**Files:**
- Create: `src/app/dashboard/page.tsx`

- [ ] **Step 1: ダッシュボードページを作成**

`src/app/dashboard/page.tsx`:
```typescript
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default async function DashboardPage() {
  const session = await auth()

  const [upcoming, myNext] = await Promise.all([
    prisma.presentation.findMany({
      where: { scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
      include: {
        presenter: { select: { name: true } },
        group: { select: { id: true, name: true } },
      },
    }),
    prisma.presentation.findFirst({
      where: {
        presenterId: session!.user.id,
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: 'asc' },
      include: { group: { select: { id: true, name: true } } },
    }),
  ])

  return (
    <div className="max-w-[980px] mx-auto px-6 py-[80px]">
      <h1 className="text-[56px] font-semibold text-[#1d1d1f] tracking-[-0.28px] mb-2">
        こんにちは、{session!.user.name}さん
      </h1>
      <p className="text-[28px] text-[#1d1d1f] mb-12">輪読管理システム</p>

      {myNext && (
        <section className="mb-12">
          <h2 className="text-[21px] font-semibold text-[#1d1d1f] mb-4">
            あなたの次の発表
          </h2>
          <Card className="border-[#0066cc]">
            <p className="text-[14px] text-[#0066cc] font-semibold">
              {myNext.group.name}
            </p>
            <p className="text-[17px] font-semibold mt-1">
              {myNext.title ?? '（タイトル未定）'}
            </p>
            {myNext.scheduledAt && (
              <p className="text-[17px] text-[#7a7a7a] mt-1">
                {myNext.scheduledAt.toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
            <div className="mt-4">
              <Link href={`/groups/${myNext.group.id}`}>
                <Button variant="secondary" className="text-[14px] !py-2">
                  詳細を見る
                </Button>
              </Link>
            </div>
          </Card>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[21px] font-semibold text-[#1d1d1f]">直近の発表予定</h2>
          <Link href="/groups">
            <Button variant="secondary" className="text-[14px] !py-2">
              グループ一覧
            </Button>
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <p className="text-[17px] text-[#7a7a7a]">
            発表予定はありません。
            <Link href="/groups" className="text-[#0066cc] ml-2">
              グループを作成する
            </Link>
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((p) => (
              <Link key={p.id} href={`/groups/${p.group.id}`}>
                <Card className="cursor-pointer hover:border-[#0066cc] transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[14px] text-[#0066cc]">{p.group.name}</p>
                      <p className="text-[17px] font-semibold">
                        {p.title ?? '（タイトル未定）'}
                      </p>
                      <p className="text-[14px] text-[#7a7a7a]">
                        発表者: {p.presenter.name}
                      </p>
                    </div>
                    {p.scheduledAt && (
                      <p className="text-[17px] text-[#7a7a7a] shrink-0">
                        {p.scheduledAt.toLocaleDateString('ja-JP')}
                      </p>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 2: コミット**

```bash
git add src/app/dashboard/
git commit -m "feat: add dashboard page with upcoming presentations"
```

---

### Task 14: 全テスト実行・ビルド確認・デプロイ

- [ ] **Step 1: 全テストを実行**

```bash
npm test
```

Expected: All tests PASS（`__tests__/api/register.test.ts`, `__tests__/api/groups.test.ts`, `__tests__/api/presentations.test.ts`, `__tests__/lib/slack.test.ts` すべて PASS）

- [ ] **Step 2: TypeScript 型チェック**

```bash
npx tsc --noEmit
```

Expected: エラーなし

- [ ] **Step 3: ビルドを確認**

```bash
npm run build
```

Expected: ビルドエラーなし

- [ ] **Step 4: ローカル動作確認**

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスし、以下を確認:
1. `/register` でユーザー登録 → `/login` にリダイレクト
2. `/login` でログイン → `/dashboard` にリダイレクト
3. `/groups` でグループ作成
4. グループ詳細で発表追加・ファイルアップロード

- [ ] **Step 5: Vercel にデプロイ**

```bash
npx vercel --prod
```

Vercel プロジェクトの Environment Variables に以下をセット:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (本番 URL)
- `SLACK_WEBHOOK_URL`
- `BLOB_READ_WRITE_TOKEN`
- `CRON_SECRET`

- [ ] **Step 6: 最終コミット & プッシュ**

```bash
git add -A
git commit -m "chore: final cleanup and deploy preparation"
git push origin main
```
