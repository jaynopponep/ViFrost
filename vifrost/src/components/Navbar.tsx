import { useNavigate } from "react-router-dom";
import "./Navbar.css";

export interface NavbarProps {
  username: string | null;
  onUsernameSet: (name: string) => void;
}

export function Navbar({ username, onUsernameSet }: NavbarProps) {
  const handleLoginClick = () => {
    const value = window.prompt("Enter username");
    if (value == null) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    onUsernameSet(trimmed);
  };

  const navigate = useNavigate();
  return (
    <nav className="navbar">
      {/* Left: Logo */}
      <div className="navbar__logo">
        <div className="navbar__logo-icon">
          <img src="/Icon.svg" alt="ViFrost" />
        </div>
        <span className="navbar__title">ViFrost</span>
      </div>

      {/* Right: Icons + Login */}
      <div className="navbar__right">
        <button className="navbar__stats-btn" title="Stats">
          <img src="LeaderboardIcon.svg" alt="Leaderboard" />
        </button>

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
