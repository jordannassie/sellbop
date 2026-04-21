import type { IAuthProvider, AuthSession } from '@/lib/domain/auth'
import { DEMO_USERS, DEMO_CREDENTIALS } from '@/lib/demo-data/seed'

const SESSION_KEY = 'sellbop_demo_session'

export class DemoAuthAdapter implements IAuthProvider {
  async signIn(email: string, password: string): Promise<AuthSession> {
    const expectedPassword = DEMO_CREDENTIALS[email.toLowerCase()]
    if (!expectedPassword || expectedPassword !== password) {
      throw new Error('Invalid email or password.')
    }

    const user = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (!user) throw new Error('User not found.')

    const session: AuthSession = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    }

    return session
  }

  async signUp(email: string, _password: string, name: string): Promise<AuthSession> {
    // In demo mode, new signups create a temporary buyer session
    const session: AuthSession = {
      userId: `demo-user-${Date.now()}`,
      email,
      name,
      role: 'buyer',
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    }

    return session
  }

  async signOut(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY)
    }
  }

  async getSession(): Promise<AuthSession | null> {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as AuthSession
    } catch {
      return null
    }
  }
}

export const demoAuth = new DemoAuthAdapter()
