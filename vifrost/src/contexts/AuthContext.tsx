import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { readPersistedSession } from "@/lib/persistedSession";

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<{ error: Error | null; session: Session | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function slugFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "player";
  const cleaned = local.replace(/[^a-zA-Z0-9_-]/g, "");
  return cleaned || "player";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialSession = useMemo(
    () =>
      typeof localStorage !== "undefined"
        ? readPersistedSession(localStorage)
        : null,
    [],
  );
  const [session, setSession] = useState<Session | null>(initialSession);
  const [isLoading, setIsLoading] = useState(initialSession === null);

  useEffect(() => {
    const sb = supabase
    if (!sb) {
      setSession(null)
      setIsLoading(false)
      return
    }

    let cancelled = false

    void sb.auth
      .getSession()
      .then(({ data: { session: next } }) => {
        if (!cancelled) setSession(next)
      })
      .catch(() => {
        if (!cancelled) setSession(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const sb = supabase
    if (!sb) {
      return {
        error: new Error(
          "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
        ),
      }
    }
    const { error } = await sb.auth.signInWithPassword({
      email,
      password,
    })
    return { error: error as Error | null }
  }, [])

  const signUp = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const sb = supabase
      if (!sb) {
        return {
          error: new Error(
            "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
          ),
          session: null,
        }
      }
      const username = displayName?.trim() || slugFromEmail(email)
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      })
      return { error: error as Error | null, session: data.session }
    },
    [],
  )

  const signOut = useCallback(async () => {
    const sb = supabase
    if (!sb) return
    await sb.auth.signOut()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      signIn,
      signUp,
      signOut,
    }),
    [session, isLoading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
