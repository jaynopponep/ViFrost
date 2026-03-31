import { palette } from "../theme/theme";
import "./Avatar.css";

interface AvatarProps {
  name: string;
  side: "player" | "opponent";
  color: string;
}

// alternates between player and opponent sides. styles are very slightly different
// player side: [(avatar) name]
// opponent side: [name (avatar)]
export function Avatar({ name, side, color }: AvatarProps) {
  return (
    <div className={`avatar avatar-${side}`}>
      {side === "opponent" && (
        <span
          className="avatar-name"
          style={{ color: palette.colorAvatarName }}
        >
          {name}
        </span>
      )}
      <div className="avatar-circle" style={{ backgroundColor: color }} />
      {side === "player" && (
        <span
          className="avatar-name"
          style={{ color: palette.colorAvatarName }}
        >
          {name}
        </span>
      )}
    </div>
  );
}
