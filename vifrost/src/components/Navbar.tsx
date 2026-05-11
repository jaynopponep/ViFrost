import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { AppTheme } from "../App";
import "./Navbar.css";

export interface NavbarProps {
  username: string | null;
  onUsernameSet: (name: string) => void;
  onLogout: () => void;
  theme: AppTheme;
  onToggleTheme: () => void;
}

export function Navbar({ username, onUsernameSet, onLogout, theme, onToggleTheme }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

      {/* Center nav links */}
      <div className="navbar-links">
        <Link to="/" className="navbar-link">Home</Link>
        <Link to="/profile" className="navbar-link">Profile</Link>
        <Link to="/match-history" className="navbar-link">History</Link>
      </div>

      {/* Right: theme toggle + Play button + user */}
      <div className="navbar-right">
        <button
          type="button"
          className="navbar-theme-toggle"
          onClick={onToggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "☀" : "☾"}
        </button>

        <button
          type="button"
          className="navbar-play-btn"
          onClick={() => navigate("/")}
        >
          Play
        </button>

        <div className="navbar-user" ref={dropdownRef}>
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
