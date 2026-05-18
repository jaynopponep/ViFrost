import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";
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
  const confettiRef = useRef<ConfettiRef>(null);

  useEffect(() => {
    if (!youWon) return;
    const ref = confettiRef.current;
    if (!ref) return;
    const burst = () => {
      ref.fire({
        particleCount: 14,
        angle: 60,
        spread: 55,
        startVelocity: 45,
        origin: { x: 0, y: 0.75 },
      });
      ref.fire({
        particleCount: 14,
        angle: 120,
        spread: 55,
        startVelocity: 45,
        origin: { x: 1, y: 0.75 },
      });
    };
    const timers = [0, 250, 500].map((d) => window.setTimeout(burst, d));
    return () => timers.forEach(window.clearTimeout);
  }, [youWon]);

  return (
    <div className="match-end-banner">
      {youWon && (
        <Confetti
          ref={confettiRef}
          manualstart
          className="match-end-banner__confetti"
        />
      )}
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
