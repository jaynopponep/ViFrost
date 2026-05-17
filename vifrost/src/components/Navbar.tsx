import { Link, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { displayNameFromUser } from "@/lib/displayNameFromUser";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";
import "./Navbar.css";

export function Navbar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const username = user ? displayNameFromUser(user) : null;

  const handleLogout = async () => {
    setDropdownOpen(false);
    await signOut();
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
          {user ? (
            <>
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
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </>
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
      </div>
    </nav>
  );
}

export default Navbar;
