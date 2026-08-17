import 'server-only'

import { createHash, randomBytes } from 'crypto'

/** Issuer / resource identity for this server's OAuth metadata. */
export function getIssuer(req: Request): string {
  const url = new URL(req.url)
  const forwardedHost = req.headers.get('x-forwarded-host')
  const forwardedProto = req.headers.get('x-forwarded-proto')
  if (forwardedHost) return `${forwardedProto ?? 'https'}://${forwardedHost}`
  return url.origin
}

export function generateClientId(): string {
  return `mcp_client_${randomBytes(16).toString('base64url')}`
}

export function generateAuthCode(): string {
  return `mcp_code_${randomBytes(32).toString('base64url')}`
}

/** PKCE (RFC 7636) S256 verification: base64url(sha256(code_verifier)) === code_challenge */
export function verifyPkceS256(codeVerifier: string, codeChallenge: string): boolean {
  const computed = createHash('sha256').update(codeVerifier).digest('base64url')
  return computed === codeChallenge
}

export const AUTH_CODE_TTL_MS = 5 * 60 * 1000 // 5 minutes, single-use
