import { Link, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";
import "./Navbar.css";

export interface NavbarProps {
  username: string | null;
  onUsernameSet: (name: string) => void;
  onLogout: () => void;
}

export function Navbar({ username, onUsernameSet, onLogout }: NavbarProps) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLoginClick = () => {
    const value = window.prompt("Enter username");
    if (value == null) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    onUsernameSet(trimmed);
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="navbar-logo">
        <div className="navbar-logo-icon">
          <img src="/Icon.svg" alt="ViFrost" />
        </div>
        <span className="navbar-title">ViFrost</span>
      </Link>

      <div className="navbar__right">
        <button
          type="button"
          className="navbar__stats-btn"
          title="Leaderboard"
          onClick={() => navigate("/leaderboard")}
        >
          <img src="LeaderboardIcon.svg" alt="Leaderboard" />
        </button>

        <AnimatedThemeToggler className="navbar__theme-btn" />

        <div className="navbar__login" ref={dropdownRef}>
          <button
            type="button"
            className="navbar-user-btn"
            onClick={() => setDropdownOpen((p) => !p)}
          >
            <div className="navbar-avatar">
              {username ? username[0].toUpperCase() : "?"}
            </div>
            {username && <span className="navbar-username">{username}</span>}
          </button>

          {dropdownOpen && (
            <div className="navbar-dropdown">
              {username ? (
                <>
                  <div className="navbar-dropdown-header">{username}</div>
                  <button
                    type="button"
                    className="navbar-dropdown-item"
                    onClick={() => { setDropdownOpen(false); navigate("/profile"); }}
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    className="navbar-dropdown-item"
                    onClick={() => { setDropdownOpen(false); navigate("/match-history"); }}
                  >
                    Match History
                  </button>
                  <div className="navbar-dropdown-divider" />
                  <button
                    type="button"
                    className="navbar-dropdown-item navbar-dropdown-item--danger"
                    onClick={() => { setDropdownOpen(false); onLogout(); }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="navbar-dropdown-item"
                  onClick={() => { setDropdownOpen(false); handleLoginClick(); }}
                >
                  Login
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
