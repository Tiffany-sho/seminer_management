/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/groups/route'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    readingGroup: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}))

const mockAuth = auth as jest.Mock

describe('GET /api/groups', () => {
  it('グループ一覧を返す', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', name: 'Test' } })
    ;(prisma.readingGroup.findMany as jest.Mock).mockResolvedValue([
      { id: 'g-1', name: '論文輪読', description: null, createdAt: new Date(), _count: { presentations: 3 } },
    ])

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].name).toBe('論文輪読')
  })

  it('未認証の場合は401を返す', async () => {
    mockAuth.mockResolvedValue(null)

    const res = await GET()
    expect(res.status).toBe(401)
  })
})

describe('POST /api/groups', () => {
  it('新しいグループを作成して201を返す', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', name: 'Test' } })
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

  it('未認証の場合は401を返す', async () => {
    mockAuth.mockResolvedValue(null)

    const req = new Request('http://localhost/api/groups', {
      method: 'POST',
      body: JSON.stringify({ name: 'test' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })
})
