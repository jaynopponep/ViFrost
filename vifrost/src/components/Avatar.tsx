import "./Avatar.css";

interface AvatarProps {
  name: string;
  side: "player" | "opponent";
  color: string;
  result?: "win" | "lose" | "tie" | null;
  // when false, render only the circle (and result badge); the caller lays
  // out the name itself. defaults true so existing usages are unchanged.
  showName?: boolean;
}

// player side:   [circle] name [result]
// opponent side: [result] name [circle]
const RESULT_DISPLAY = {
  win: { icon: "✓", className: "avatar-result-win" },
  lose: { icon: "✗", className: "avatar-result-lose" },
  tie: { icon: "🏳️", className: "avatar-result-tie" },
};

export function Avatar({
  name,
  side,
  color,
  result,
  showName = true,
}: AvatarProps) {
  const display = result ? RESULT_DISPLAY[result] : null;

  return (
    <div className={`avatar avatar-${side}`}>
      {side === "opponent" && display && (
        <span className={`avatar-result ${display.className}`}>
          {display.icon}
        </span>
      )}
      {side === "opponent" && showName && (
        <span
          className="avatar-name"
          style={{ color: "var(--colorAvatarName)" }}
        >
          {name}
        </span>
      )}
      <div className="avatar-circle" style={{ backgroundColor: color }} />
      {side === "player" && showName && (
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
