/**
 * @jest-environment node
 */
import { POST } from '@/app/api/presentations/route'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    presentation: {
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}))

const mockAuth = auth as jest.Mock

describe('POST /api/presentations', () => {
  it('新しい発表を作成して201を返す', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', name: 'Test' } })
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

  it('未認証の場合は401を返す', async () => {
    mockAuth.mockResolvedValue(null)

    const req = new Request('http://localhost/api/presentations', {
      method: 'POST',
      body: JSON.stringify({ groupId: 'g-1', presenterId: 'user-1' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })
})
