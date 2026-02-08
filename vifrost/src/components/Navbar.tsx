export interface NavbarProps {
  username: string | null
  onUsernameSet: (name: string) => void
}

export function Navbar({ username, onUsernameSet }: NavbarProps) {
  const handleLoginClick = () => {
    const value = window.prompt('Enter username')
    if (value == null) return
    const trimmed = value.trim()
    if (!trimmed) return
    onUsernameSet(trimmed)
  }

  return (
    <nav className="navbar">
      <div className="navbar__spacer" />
      <div className="navbar__login">
        {username ? (
          <span className="navbar__name">{username}</span>
        ) : (
          <button
            type="button"
            className="navbar__log-in-btn"
            onClick={handleLoginClick}
          >
            Log In
          </button>
        )}
      </div>
    </nav>
  )
}

export default Navbar
