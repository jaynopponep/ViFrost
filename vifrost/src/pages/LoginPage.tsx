import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { isSupabaseConfigured } from "@/lib/supabase"
import { PageShell } from "@/components/ui/page-shell"
import "./AuthPages.css"

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

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
            />
          </div>
          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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
