import "./Avatar.css";

interface AvatarProps {
  name: string;
  side: "player" | "opponent";
  color: string;
  result?: "win" | "lose" | "tie" | null;
}

// player side:   [circle] name [result]
// opponent side: [result] name [circle]
const RESULT_DISPLAY = {
  win: { icon: "✓", className: "avatar-result-win" },
  lose: { icon: "✗", className: "avatar-result-lose" },
  tie: { icon: "🏳️", className: "avatar-result-tie" },
};

export function Avatar({ name, side, color, result }: AvatarProps) {
  const display = result ? RESULT_DISPLAY[result] : null;

  return (
    <div className={`avatar avatar-${side}`}>
      {side === "opponent" && display && (
        <span className={`avatar-result ${display.className}`}>
          {display.icon}
        </span>
      )}
      {side === "opponent" && (
        <span
          className="avatar-name"
          style={{ color: "var(--colorAvatarName)" }}
        >
          {name}
        </span>
      )}
      <div className="avatar-circle" style={{ backgroundColor: color }} />
      {side === "player" && (
        <span
          className="avatar-name"
          style={{ color: "var(--colorAvatarName)" }}
        >
          {name}
        </span>
      )}
      {side === "player" && display && (
        <span className={`avatar-result ${display.className}`}>
          {display.icon}
        </span>
      )}
    </div>
  );
}
