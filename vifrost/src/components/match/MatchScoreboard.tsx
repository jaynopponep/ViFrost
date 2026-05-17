import { forwardRef } from "react";
import { Avatar } from "@/components/Avatar";
import "./MatchScoreboard.css";

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
          <Avatar name={player.name} side="player" color={player.color} />
          <div className="match-scoreboard__meta">
            <div className="match-scoreboard__row">
              <span className="match-scoreboard__pct match-scoreboard__pct--player">
                {Math.round(player.pct)}%
              </span>
            </div>
            <div className="match-scoreboard__bar">
              <div
                className="match-scoreboard__fill match-scoreboard__fill--player"
                style={{ width: `${player.pct}%` }}
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
            <div className="match-scoreboard__row match-scoreboard__row--opp">
              <span className="match-scoreboard__pct match-scoreboard__pct--opp">
                {Math.round(opponent.pct)}%
              </span>
            </div>
            <div className="match-scoreboard__bar">
              <div
                className="match-scoreboard__fill match-scoreboard__fill--opp"
                style={{ width: `${opponent.pct}%`, marginLeft: "auto" }}
              />
            </div>
          </div>
          <Avatar name={opponent.name} side="opponent" color={opponent.color} />
        </div>
      </div>
    );
  },
);
