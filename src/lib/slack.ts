export async function sendSlackNotification(text: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) return

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error(`Slack webhook failed: ${res.status}`)
}
