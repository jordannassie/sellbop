export interface AuthSession {
  userId: string
  email: string
  name: string | null
  avatarUrl: string | null
}

export interface AccountSummary {
  hasStore: boolean
  hasPurchases: boolean
  hasSubscriptions: boolean
}

export interface IAuthProvider {
  signIn(email: string, password: string): Promise<void>
  signUp(email: string, password: string, name: string): Promise<void>
  signInWithGoogle(): Promise<void>
  signOut(): Promise<void>
  getSession(): Promise<AuthSession | null>
}
