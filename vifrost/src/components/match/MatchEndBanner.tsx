import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";
import "./MatchEndBanner.css";
import {
  matchEndOutcome,
  outcomeTitle,
  outcomeTitleClass,
  outcomeShowsConfetti,
  type MatchWinner,
} from "./matchEndOutcome";

export interface MatchEndBannerProps {
  winner: MatchWinner;
  playerName: string;
  opponentName: string;
  playerPct: number;
  opponentPct: number;
  playerStyle: number;
  opponentStyle: number;
}

export function MatchEndBanner(props: MatchEndBannerProps) {
  const {
    winner,
    playerName,
    opponentName,
    playerPct,
    opponentPct,
    playerStyle,
    opponentStyle,
  } = props;
  const navigate = useNavigate();
  const outcome = matchEndOutcome(winner);
  const showConfetti = outcomeShowsConfetti(outcome);
  const confettiRef = useRef<ConfettiRef>(null);

  useEffect(() => {
    if (!showConfetti) return;
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
  }, [showConfetti]);

  return (
    <div className="match-end-banner">
      {showConfetti && (
        <Confetti
          ref={confettiRef}
          manualstart
          className="match-end-banner__confetti"
        />
      )}
      <div className="match-end-banner__card">
        <h2 className={`match-end-banner__title ${outcomeTitleClass(outcome)}`}>
          {outcomeTitle(outcome)}
        </h2>
        <div className="match-end-banner__grid">
          <div>
            <div className="match-end-banner__name">{playerName}</div>
            <div className="match-end-banner__stat">Tests: {Math.round(playerPct)}%</div>
            <div className="match-end-banner__stat">Style: {playerStyle}</div>
          </div>
          <div>
            <div className="match-end-banner__name">{opponentName}</div>
            <div className="match-end-banner__stat">Tests: {Math.round(opponentPct)}%</div>
            <div className="match-end-banner__stat">Style: {opponentStyle}</div>
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
