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
    <nav className="navbar">
      {/* Left: Logo */}
      <Link to="/" className="navbar-logo">
        <div className="navbar-logo-icon">
          <img src="/Icon.svg" alt="ViFrost" />
        </div>
        <span className="navbar-title">ViFrost</span>
      </Link>

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
      </div>
    </nav>
  );
}

export default Navbar;
