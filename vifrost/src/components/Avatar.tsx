import "./Avatar.css";

interface AvatarProps {
  name: string;
  side: "player" | "opponent";
  color: string;
}

export function Avatar({ name, side, color }: AvatarProps) {
  return (
    <div className={`avatar avatar-${side}`}>
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
    </div>
  );
}
