import { randomUUID } from 'crypto'

export interface ProductIdeasLogger {
  requestId: string
  info: (message: string) => void
  error: (message: string, err?: unknown) => void
  timed: <T>(label: string, fn: () => Promise<T>) => Promise<T>
}

export function createProductIdeasLogger(requestId?: string): ProductIdeasLogger {
  const id = requestId ?? randomUUID().slice(0, 8)
  const prefix = `[product-ideas] request ${id}`

  return {
    requestId: id,
    info(message: string) {
      console.log(`${prefix} ${message}`)
    },
    error(message: string, err?: unknown) {
      if (err instanceof Error) {
        console.error(`${prefix} ${message}: ${err.message}`)
      } else if (err != null) {
        console.error(`${prefix} ${message}:`, err)
      } else {
        console.error(`${prefix} ${message}`)
      }
    },
    async timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
      const start = Date.now()
      try {
        const result = await fn()
        console.log(`${prefix} ${label} ${Date.now() - start}ms success`)
        return result
      } catch (err) {
        console.error(`${prefix} ${label} ${Date.now() - start}ms failed`)
        throw err
      }
    },
  }
}
