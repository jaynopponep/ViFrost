import { Link, useNavigate } from "react-router-dom";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";
import "./Navbar.css";

export interface NavbarProps {
  username: string | null;
  onUsernameSet: (name: string) => void;
}

export function Navbar({ username }: NavbarProps) {
  const navigate = useNavigate();
  return (
    <nav className="navbar">
      {/* Left: Logo */}
      <Link to="/" className="navbar__logo">
        <div className="navbar__logo-icon">
          <img src="/Icon.svg" alt="ViFrost" />
        </div>
        <span className="navbar__title">ViFrost</span>
      </Link>

      {/* Right: Icons + Login */}
      <div className="navbar__right">
        <button className="navbar__stats-btn" title="Stats">
          <img src="LeaderboardIcon.svg" alt="Leaderboard" />
        </button>

        <AnimatedThemeToggler className="navbar__theme-btn" />

        <div className="navbar__login">
          {username ? (
            <span className="navbar__name">{username}</span>
          ) : (
            <button
              type="button"
              className="navbar__log-in-btn"
              onClick={() => navigate("/profile")}
            >
              <img src="/AvatarIcon.svg" alt="Avatar" />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
