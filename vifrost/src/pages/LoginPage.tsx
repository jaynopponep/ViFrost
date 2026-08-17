import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { isSupabaseConfigured } from "@/lib/supabase"
import { PageShell } from "@/components/ui/page-shell"
import {
  AuthPenguin,
  EyeIcon,
  useAuthPenguin,
} from "@/components/auth/AuthPenguin"
import "./AuthPages.css"

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const { penguin, identityField, passwordField, revealed, toggleReveal } =
    useAuthPenguin()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured. Copy .env.example to .env and add your project keys.")
      return
    }
    setPending(true)
    const { error: err } = await signIn(email.trim(), password)
    setPending(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate("/")
  }

  return (
    <PageShell maxWidth="max-w-[480px]" className="auth-page">
      <div className="auth-card">
        <AuthPenguin {...penguin} />
        <h1 className="auth-card__title">Log in</h1>
        <p className="auth-card__subtitle">Sign in with your email and password to play and track progress.</p>

        {error ? <p className="auth-error">{error}</p> : null}

        <form onSubmit={onSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              {...identityField}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <div className="auth-password-wrap">
              <input
                id="login-password"
                type={revealed ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                {...passwordField}
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={toggleReveal}
                onMouseDown={(e) => e.preventDefault()}
                aria-label={revealed ? "Hide password" : "Show password"}
              >
                <EyeIcon off={revealed} />
              </button>
            </div>
          </div>
          <button type="submit" className="auth-submit" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="auth-footer">
          No account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </PageShell>
  )
}
