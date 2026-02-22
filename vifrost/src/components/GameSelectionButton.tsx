import "./GameSelectionButton.css";

interface GameSelectionButtonProps {
  label: string;
  onClick?: () => void;
}

export function GameSelectionButton({label, onClick }: GameSelectionButtonProps) {
  return (
    <button className="game-selection-btn" onClick={onClick}>
      {label}
    </button>
  );
}

export default GameSelectionButton;
