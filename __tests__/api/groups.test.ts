/**
 * @jest-environment node
 */
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
