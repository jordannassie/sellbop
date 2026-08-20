import type { CreativeErrorCode } from './types'

export class CreativeError extends Error {
  readonly code: CreativeErrorCode
  readonly status: number

  constructor(code: CreativeErrorCode, message: string, status = 400) {
    super(message)
    this.name = 'CreativeError'
    this.code = code
    this.status = status
  }

  toResult() {
    return {
      success: false as const,
      error_code: this.code,
      message: this.message,
      generation_status: 'failed' as const,
    }
  }
}

export function safeProviderMessage(err: unknown): string {
  if (err instanceof CreativeError) return err.message
  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    if (msg.includes('rate') || msg.includes('429')) return 'Image provider rate limit reached. Try again shortly.'
    if (msg.includes('timeout') || msg.includes('timed out')) return 'Generation timed out. Try again.'
    if (msg.includes('content_policy') || msg.includes('safety')) return 'Prompt was rejected by the image provider.'
    return 'Creative generation failed.'
  }
  return 'Creative generation failed.'
}
