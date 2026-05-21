/**
 * @jest-environment node
 */
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
