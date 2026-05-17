import { useNavigate } from "react-router-dom";
import "./MatchEndBanner.css";

export interface MatchEndBannerProps {
  winner: "player" | "opponent";
  playerName: string;
  opponentName: string;
  playerPct: number;
  opponentPct: number;
  playerKeybindScore: number;
  opponentKeybindScore: number;
}

export function MatchEndBanner(props: MatchEndBannerProps) {
  const {
    winner,
    playerName,
    opponentName,
    playerPct,
    opponentPct,
    playerKeybindScore,
    opponentKeybindScore,
  } = props;
  const navigate = useNavigate();
  const youWon = winner === "player";

  return (
    <div className="match-end-banner">
      <div className="match-end-banner__card">
        <h2 className={`match-end-banner__title ${youWon ? "is-win" : "is-loss"}`}>
          {youWon ? "You won" : "You lost"}
        </h2>
        <div className="match-end-banner__grid">
          <div>
            <div className="match-end-banner__name">{playerName}</div>
            <div className="match-end-banner__stat">Tests: {Math.round(playerPct)}%</div>
            <div className="match-end-banner__stat">Style: {playerKeybindScore}</div>
          </div>
          <div>
            <div className="match-end-banner__name">{opponentName}</div>
            <div className="match-end-banner__stat">Tests: {Math.round(opponentPct)}%</div>
            <div className="match-end-banner__stat">Style: {opponentKeybindScore}</div>
          </div>
        </div>
        <button
          type="button"
          className="match-end-banner__button"
          onClick={() => navigate("/lobby")}
        >
          Back to lobby
        </button>
      </div>
    </div>
  );
}
