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

  const handleLogoutClick = () => {
    setDropdownOpen(false);
    onLogout();
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

        <div className="navbar__login">
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
                onClick={handleProfileOption}
              >
                Profile
              </button>
              {username ? (
                <button
                  type="button"
                  className="navbar-dropdown-item"
                  onClick={handleLogoutClick}
                >
                  Logout
                </button>
              ) : (
                <button
                  type="button"
                  className="navbar-dropdown-item"
                  onClick={handleLoginOption}
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
