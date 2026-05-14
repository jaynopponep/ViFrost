import "./Avatar.css";

interface AvatarProps {
  name: string;
  side: "player" | "opponent";
  color: string;
  result?: "win" | "lose" | "tie" | null;
}

// player side:   [circle] name [result]
// opponent side: [result] name [circle]
export function Avatar({ name, side, color, result }: AvatarProps) {
  const indicator = result === "win" ? "✓" : result === "lose" ? "✗" : result === "tie" ? "🏳️" : null;
  const indicatorClass = result === "win" ? "avatar-result-win" : result === "lose" ? "avatar-result-lose" : "avatar-result-tie";

  return (
    <div className={`avatar avatar-${side}`}>
      {side === "opponent" && indicator && (
        <span className={`avatar-result ${indicatorClass}`}>{indicator}</span>
      )}
      {side === "opponent" && (
        <span className="avatar-name" style={{ color: "var(--colorAvatarName)" }}>
          {name}
        </span>
      )}
      <div className="avatar-circle" style={{ backgroundColor: color }} />
      {side === "player" && (
        <span className="avatar-name" style={{ color: "var(--colorAvatarName)" }}>
          {name}
        </span>
      )}
      {side === "player" && indicator && (
        <span className={`avatar-result ${indicatorClass}`}>{indicator}</span>
      )}
    </div>
  );
}
