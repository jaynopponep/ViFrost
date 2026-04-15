import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

export interface NavbarProps {
  username: string | null;
  onUsernameSet: (name: string) => void;
}

export function Navbar({ username, onUsernameSet }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLoginClick = () => {
    const value = window.prompt("Enter username");
    if (value == null) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    onUsernameSet(trimmed);
  };

  const navigate = useNavigate();

  const handleAvatarClick = () => {
    setDropdownOpen((prev) => !prev);
  };

  const handleLoginOption = () => {
    setDropdownOpen(false);
    handleLoginClick();
  };

  const handleProfileOption = () => {
    setDropdownOpen(false);
    navigate("/profile");
  };

  return (
    <nav className="navbar">
      {/* Left: Logo */}
      <Link to="/" className="navbar-logo">
        <div className="navbar-logo-icon">
          <img src="/Icon.svg" alt="ViFrost" />
        </div>
        <span className="navbar-title">ViFrost</span>
      </Link>

      <div className="navbar-right">
        <button className="navbar-stats-btn" title="Stats">
          <img src="LeaderboardIcon.svg" alt="Leaderboard" />
        </button>

        <div className="navbar-login" ref={dropdownRef}>
          {username ? (
            <span className="navbar-name">{username}</span>
          ) : (
            <>
              <button
                type="button"
                className="navbar-log-in-btn"
                onClick={handleAvatarClick}
              >
                <img src="/AvatarIcon.svg" alt="Avatar" />
              </button>
              {dropdownOpen && (
                <div className="navbar-dropdown">
                  <button
                    type="button"
                    className="navbar-dropdown-item"
                    onClick={handleLoginOption}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    className="navbar-dropdown-item"
                    onClick={handleProfileOption}
                  >
                    Profile
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
