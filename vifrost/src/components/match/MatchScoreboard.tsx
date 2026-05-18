import { forwardRef } from "react";
import { motion } from "motion/react";
import { Avatar } from "@/components/Avatar";
import { CountingNumber } from "@/components/ui/counting-number";
import "./MatchScoreboard.css";

const FILL_SPRING = { type: "spring", stiffness: 100, damping: 30 } as const;

export interface MatchScoreboardProps {
  player: { name: string; color: string; pct: number };
  opponent: { name: string; color: string; pct: number };
  onInfoClick: () => void;
  onReopenProblem: () => void;
}

export const MatchScoreboard = forwardRef<HTMLButtonElement, MatchScoreboardProps>(
  function MatchScoreboard(props, infoBtnRef) {
    const { player, opponent, onInfoClick, onReopenProblem } = props;

    return (
      <div className="match-scoreboard">
        <div className="match-scoreboard__player">
          <Avatar
            name={player.name}
            side="player"
            color={player.color}
            showName={false}
          />
          <div className="match-scoreboard__meta">
            <div className="match-scoreboard__row">
              <span className="match-scoreboard__name">{player.name}</span>
              <span className="match-scoreboard__pct match-scoreboard__pct--player">
                <CountingNumber value={player.pct} />%
              </span>
            </div>
            <div
              className="match-scoreboard__bar"
              role="progressbar"
              aria-label={`${player.name} test progress`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(player.pct)}
            >
              <motion.div
                className="match-scoreboard__fill match-scoreboard__fill--player"
                initial={{ width: 0 }}
                animate={{ width: `${player.pct}%` }}
                transition={FILL_SPRING}
              />
            </div>
          </div>
        </div>

        <div className="match-scoreboard__icons">
          <button
            type="button"
            className="match-scoreboard__icon-btn"
            onClick={onReopenProblem}
            aria-label="Reopen problem statement"
          >
            ?
          </button>
          <button
            ref={infoBtnRef}
            type="button"
            className="match-scoreboard__icon-btn"
            onClick={onInfoClick}
            aria-label="Show test results"
          >
            i
          </button>
        </div>

        <div className="match-scoreboard__player match-scoreboard__player--opp">
          <div className="match-scoreboard__meta">
            <div className="match-scoreboard__row">
              <span className="match-scoreboard__pct match-scoreboard__pct--opp">
                <CountingNumber value={opponent.pct} />%
              </span>
              <span className="match-scoreboard__name">{opponent.name}</span>
            </div>
            <div
              className="match-scoreboard__bar"
              role="progressbar"
              aria-label={`${opponent.name} test progress`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(opponent.pct)}
            >
              <motion.div
                className="match-scoreboard__fill match-scoreboard__fill--opp"
                style={{ marginLeft: "auto" }}
                initial={{ width: 0 }}
                animate={{ width: `${opponent.pct}%` }}
                transition={FILL_SPRING}
              />
            </div>
          </div>
          <Avatar
            name={opponent.name}
            side="opponent"
            color={opponent.color}
            showName={false}
          />
        </div>
      </div>
    );
  },
);
