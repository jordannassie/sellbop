import 'server-only'

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

export async function callOpenAiJson(system: string, user: string): Promise<unknown> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_UNAVAILABLE')

  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    console.error('[Product Ideas] OpenAI error:', await response.text())
    throw new Error('OPENAI_FAILED')
  }

  const json = await response.json() as { choices?: { message?: { content?: string } }[] }
  const raw = json.choices?.[0]?.message?.content ?? '{}'
  return JSON.parse(raw)
}
