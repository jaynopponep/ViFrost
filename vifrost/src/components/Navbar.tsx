import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";
import "./Navbar.css";

export function Navbar() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { isAdmin } = useProfile();
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

      <div className="navbar__right">
        {isAdmin ? (
          <button
            type="button"
            className="navbar__auth-btn"
            title="Admin dashboard"
            onClick={() => navigate("/admin/dashboard")}
          >
            Admin
          </button>
        ) : null}
        <button
          type="button"
          className="navbar__stats-btn"
          title="Leaderboard"
          onClick={() => navigate("/leaderboard")}
        >
          <img src="LeaderboardIcon.svg" alt="Leaderboard" />
        </button>

        <AnimatedThemeToggler className="navbar__theme-btn" />

        <div className="navbar__login">
          {isLoading ? null : user ? (
            <button
              type="button"
              className="navbar__profile-btn"
              title="Profile"
              onClick={() => navigate("/profile")}
            >
              <img src="/AvatarIcon.svg" alt="Profile" />
            </button>
          ) : (
            <div className="navbar__auth-actions">
              <Link to="/login" className="navbar__auth-btn">
                Log in
              </Link>
              <Link
                to="/signup"
                className="navbar__auth-btn navbar__auth-btn--primary"
              >
                Sign up
              </Link>
            </div>
          )}
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
