export interface MatchEndStyleInput {
  // each player's accumulated style: score - passes*400 (see deriveVim).
  // this is the figure the live scoreboard shows climbing during the match.
  playerVim: number;
  opponentVim: number;
}

export interface MatchEndStyleScores {
  player: number;
  opponent: number;
}

// the end banner's "Style" is per-player accumulated style, identical to the
// live scoreboard. it is deliberately NOT the end-of-game keybind bonus
// (20 * |keybind-count diff|), which is a comparative award that goes to
// whoever pressed fewer keys -- that made an idle opponent show a huge style
// and the active winner show 0.
export function matchEndStyleScores(
  input: MatchEndStyleInput,
): MatchEndStyleScores {
  return { player: input.playerVim, opponent: input.opponentVim };
}
