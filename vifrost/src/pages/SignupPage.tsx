import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { isSupabaseConfigured } from "@/lib/supabase"
import { PageShell } from "@/components/ui/page-shell"
import "./AuthPages.css"

export function SignupPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured. Copy .env.example to .env and add your project keys.")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    setPending(true)
    const { error: err, session } = await signUp(
      email.trim(),
      password,
      displayName.trim() || undefined,
    )
    setPending(false)
    if (err) {
      setError(err.message)
      return
    }
    if (session) {
      navigate("/")
      return
    }
    setSuccess(
      "Check your email to confirm your account if required. You can sign in once your account is active.",
    )
    window.setTimeout(() => navigate("/login"), 2800)
  }

  return (
    <PageShell maxWidth="max-w-[480px]" className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Sign up</h1>
        <p className="auth-card__subtitle">Create an account with email and password. Your display name is used in-game.</p>

        {error ? <p className="auth-error">{error}</p> : null}
        {success ? <p className="auth-success">{success}</p> : null}

        <form onSubmit={onSubmit}>
          <div className="auth-field">
            <label htmlFor="signup-display">Display name (optional)</label>
            <input
              id="signup-display"
              type="text"
              autoComplete="username"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Shown in lobby and profile"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="signup-confirm">Confirm password</label>
            <input
              id="signup-confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <button type="submit" className="auth-submit" disabled={pending || Boolean(success)}>
            {pending ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </PageShell>
  )
}
