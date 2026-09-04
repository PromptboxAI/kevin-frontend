import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isAuthConfigured } from './env'
import { getSupabase } from './supabase'

type AuthState = {
  session: Session | null
  /** True until the initial session lookup settles -- guards a redirect flash. */
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  /**
   * Creates the account and returns whether Supabase already issued a session.
   * With email confirmation ON (the project's setting) it does NOT: the user
   * has to confirm first, which is exactly what the sign-up flow's verify step
   * is for. Callers must branch on this rather than assume they are signed in.
   */
  signUp: (
    email: string,
    password: string,
    profile?: Record<string, unknown>,
  ) => Promise<{ session: Session | null; needsConfirmation: boolean }>
  /** Confirms a sign-up with the 6-digit code from the email. */
  verifySignUp: (email: string, token: string) => Promise<void>
  /** Re-sends the confirmation email. */
  resendSignUp: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // The public portal must work with no auth keys; nothing to restore there.
    if (!isAuthConfigured) {
      setLoading(false)
      return
    }
    const supabase = getSupabase()
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })

    // Fires on sign-in, sign-out and silent token refresh, so api.ts always
    // reads a live access token.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      session,
      loading,
      async signIn(email, password) {
        const { error } = await getSupabase().auth.signInWithPassword({ email, password })
        if (error) throw error
      },
      async signUp(email, password, profile) {
        const { data, error } = await getSupabase().auth.signUp({
          email,
          password,
          // Lands on user_metadata; the app reads name/firm from there until
          // there is a profile table to write.
          options: { data: profile ?? {} },
        })
        if (error) throw error
        return { session: data.session, needsConfirmation: !data.session }
      },
      async verifySignUp(email, token) {
        const { error } = await getSupabase().auth.verifyOtp({
          email,
          token,
          type: 'signup',
        })
        if (error) throw error
      },
      async resendSignUp(email) {
        const { error } = await getSupabase().auth.resend({ type: 'signup', email })
        if (error) throw error
      },
      async signOut() {
        await getSupabase().auth.signOut()
      },
    }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
