import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";
import "./Navbar.css";

function NavbarLeft() {
  return (
    <Link to="/" className="navbar-logo">
      <div className="navbar-logo-icon">
        <img src="/Icon.svg" alt="ViFrost" />
      </div>
      <span className="navbar-title">ViFrost</span>
    </Link>
  );
}

function AuthButtons() {
  return (
    <div className="navbar-auth-actions">
      <Link to="/login" className="navbar-auth-btn">
        Log in
      </Link>
      <Link to="/signup" className="navbar-auth-btn navbar-auth-btn--primary">
        Sign up
      </Link>
    </div>
  );
}

function AvatarDropdown({ username }: { username: string }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="navbar-user-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="navbar-user-btn"
        title="Profile"
        onClick={() => setOpen((p) => !p)}
      >
        <div className="navbar-avatar">{username[0].toUpperCase()}</div>
        <span className="navbar-username">{username}</span>
      </button>
      {open && (
        <div className="navbar-dropdown">
          <button type="button" className="navbar-dropdown-item" onClick={() => go("/profile")}>
            Profile
          </button>
          <button type="button" className="navbar-dropdown-item" onClick={() => go("/match-history")}>
            Match History
          </button>
          <div className="navbar-dropdown-divider" />
          <button
            type="button"
            className="navbar-dropdown-item navbar-dropdown-item--danger"
            onClick={() => { setOpen(false); void signOut(); }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

function NavbarRight() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  const username: string =
    (user?.user_metadata?.username as string | undefined) ?? user?.email ?? "?";

  return (
    <div className="navbar-right">
      <button
        type="button"
        className="navbar-stats-btn"
        title="Leaderboard"
        onClick={() => navigate("/leaderboard")}
      >
        <img src="LeaderboardIcon.svg" alt="Leaderboard" />
      </button>

      <AnimatedThemeToggler className="navbar-theme-btn" />

      <div className="navbar-login">
        {isLoading ? null : user ? (
          <AvatarDropdown username={username} />
        ) : (
          <AuthButtons />
        )}
      </div>
    </div>
  );
}

export function Navbar() {
  return (
    <nav className="navbar">
      <NavbarLeft />
      <NavbarRight />
    </nav>
  );
}

export default Navbar;
