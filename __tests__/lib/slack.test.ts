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
