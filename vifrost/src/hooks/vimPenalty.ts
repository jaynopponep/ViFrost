// penalty helpers. 
// useKeybindListener wires dom events to these.

export const PENALTY_ARROW = -100;
export const PENALTY_MOUSE = -200;
export const PENALTY_COUNTER_PRODUCTIVE = -60;

// a counted nav command, reduced to the axis it moves on plus direction and
// count. j/k = vertical, h/l = horizontal, w/b = word, f/F = find.
export type NavAxis = "vertical" | "horizontal" | "word" | "find";
export interface NavCommand {
  axis: NavAxis;
  forward: boolean;
  count: number;
}

// strict exact-reversal: same axis, same count, opposite direction. any
// intervening cursor move clears the tracked prev (handled in the listener),
// so this only ever sees an immediately-adjacent pair.
export function isExactReversal(
  prev: NavCommand | null,
  next: NavCommand,
): boolean {
  if (!prev) return false;
  return (
    prev.axis === next.axis &&
    prev.count === next.count &&
    prev.forward !== next.forward
  );
}
