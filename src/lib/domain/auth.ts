// Auth provider interface — implement this for demo mode, Supabase, etc.

export interface AuthSession {
  userId: string
  email: string
  name: string
  role: 'creator' | 'buyer'
}

export interface IAuthProvider {
  signIn(email: string, password: string): Promise<AuthSession>
  signUp(email: string, password: string, name: string): Promise<AuthSession>
  signOut(): Promise<void>
  getSession(): Promise<AuthSession | null>
}
