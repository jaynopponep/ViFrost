export type MatchWinner = "player" | "opponent" | "tie";
export type MatchEndOutcome = "win" | "loss" | "tie";

export function matchEndOutcome(winner: MatchWinner): MatchEndOutcome {
  if (winner === "player") return "win";
  if (winner === "tie") return "tie";
  return "loss";
}

export function outcomeTitle(o: MatchEndOutcome): string {
  return o === "win" ? "You won" : o === "tie" ? "You tied" : "You lost";
}

export function outcomeTitleClass(o: MatchEndOutcome): string {
  return o === "win" ? "is-win" : o === "tie" ? "is-tie" : "is-loss";
}

export function outcomeShowsConfetti(o: MatchEndOutcome): boolean {
  return o === "win";
}
