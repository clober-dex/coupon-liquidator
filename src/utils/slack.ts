export async function sendSlackMessage(
  type: 'info' | 'debug',
  rows: string[],
  title?: string,
) {
  if (type === 'info' && !process.env.SLACK_INFO_WEBHOOK_URL) {
    throw new Error('SLACK_INFO_WEBHOOK_URL is not defined')
  }
  if (type === 'debug' && !process.env.SLACK_DEBUG_WEBHOOK_URL) {
    throw new Error('SLACK_DEBUG_WEBHOOK_URL is not defined')
  }
  const url =
    (type === 'info'
      ? process.env.SLACK_INFO_WEBHOOK_URL
      : type === 'debug'
      ? process.env.SLACK_DEBUG_WEBHOOK_URL
      : '') || ''
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: title
        ? title + '\n```\n' + rows.join('\n') + '\n```'
        : '```\n' + rows.join('\n') + '\n```',
    }),
  })
}
