import * as React from "react";

import { Popover, PopoverContent } from "@/components/ui/popover";

import "./TestDetailPopover.css";

export interface TestDetailPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  playerTests: boolean[];
  opponentTests: boolean[];
  playerName: string;
  opponentName: string;
}

type CellState = "pass" | "fail" | "pending";

function cellFor(arr: boolean[], i: number): CellState {
  if (i >= arr.length) return "pending";
  return arr[i] ? "pass" : "fail";
}

function labelFor(state: CellState): string {
  return state === "pass" ? "✓" : state === "fail" ? "✗" : "—";
}

export function TestDetailPopover(props: TestDetailPopoverProps) {
  const {
    open,
    onOpenChange,
    anchorRef,
    playerTests,
    opponentTests,
    playerName,
    opponentName,
  } = props;

  const rows = Math.max(playerTests.length, opponentTests.length, 1);

  // base-ui's onOpenChange signature is (open, eventDetails). Adapt it to the
  // simpler (open: boolean) => void contract exposed by this component.
  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverContent
        className="test-detail"
        align="center"
        sideOffset={8}
        anchor={anchorRef}
      >
        <div className="test-detail__header">
          <span className="test-detail__col-label">{playerName}</span>
          <span className="test-detail__col-label test-detail__col-label--opp">
            {opponentName}
          </span>
        </div>
        <div className="test-detail__grid">
          {Array.from({ length: rows }).map((_, i) => {
            const p = cellFor(playerTests, i);
            const o = cellFor(opponentTests, i);
            return (
              <div className="test-detail__row" key={i}>
                <span
                  className={`test-detail__cell test-detail__cell--${p}`}
                >
                  T{i + 1} {labelFor(p)}
                </span>
                <span
                  className={`test-detail__cell test-detail__cell--${o}`}
                >
                  T{i + 1} {labelFor(o)}
                </span>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
