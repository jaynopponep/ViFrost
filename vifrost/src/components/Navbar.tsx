import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserCircleIcon,
  Clock01Icon,
  Logout03Icon,
  DashboardSquare01Icon,
} from "@hugeicons/core-free-icons";
import { useProfile } from "@/contexts/ProfileContext";
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

// shared shadcn-style menu-item classes for the popover panel. neutral
// hover overlay (not bg-accent) so it reads on the app's teal panel.
const MENU_ITEM =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 " +
  "text-left text-sm transition-colors outline-none hover:bg-white/10 " +
  "focus-visible:bg-white/10";

function AvatarDropdown({ username }: { username: string }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  // controlled so selecting an item closes the panel. base-ui's popover owns
  // outside-click / escape / focus return, so the old manual mousedown
  // listener + wrapper ref are gone.
  const { isAdmin } = useProfile();
  const [open, setOpen] = useState(false);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="navbar-user-btn" title="Profile">
        <div className="navbar-avatar">{username[0]?.toUpperCase() ?? "?"}</div>
        <span className="navbar-username">{username}</span>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-48 gap-0 rounded-xl border border-[var(--colorBorder)] bg-[var(--colorSurfaceAlt)] p-1 text-[var(--colorText)] ring-0"
      >
        <button type="button" className={MENU_ITEM} onClick={() => go("/profile")}>
          <HugeiconsIcon icon={UserCircleIcon} size={17} strokeWidth={2} />
          Profile
        </button>
        <button
          type="button"
          className={MENU_ITEM}
          onClick={() => go("/match-history")}
        >
          <HugeiconsIcon icon={Clock01Icon} size={17} strokeWidth={2} />
          Match History
        </button>
        {isAdmin ? (
          <button
            type="button"
            className={MENU_ITEM}
            onClick={() => go("/admin/dashboard")}
          >
            <HugeiconsIcon
              icon={DashboardSquare01Icon}
              size={17}
              strokeWidth={2}
            />
            Admin dashboard
          </button>
        ) : null}
        <div className="my-1 h-px bg-[var(--colorBorder)]" />
        <button
          type="button"
          className={
            MENU_ITEM +
            " text-destructive hover:bg-destructive/10 hover:text-destructive"
          }
          onClick={() => {
            setOpen(false);
            void signOut();
          }}
        >
          <HugeiconsIcon icon={Logout03Icon} size={17} strokeWidth={2} />
          Sign Out
        </button>
      </PopoverContent>
    </Popover>
  );
}

function NavbarRight() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { isAdmin } = useProfile();

  const username: string =
    (user?.user_metadata?.username as string | undefined) ?? user?.email ?? "?";

  return (
    <div className="navbar-right">
      {isAdmin ? (
        <button
          type="button"
          className="navbar-auth-btn"
          title="Admin dashboard"
          onClick={() => navigate("/admin/dashboard")}
        >
          Admin
        </button>
      ) : null}
      <button
        type="button"
        className="navbar-stats-btn"
        title="Leaderboard"
        onClick={() => navigate("/leaderboard")}
      >
        <img src="/LeaderboardIcon.svg" alt="Leaderboard" />
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
