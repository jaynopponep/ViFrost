import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BorderBeam } from "@/components/ui/border-beam";
import "./ProblemDialog.css";


const COUNTDOWN_BEAM_COLOR: Record<string, string> = {
  high: "var(--countdown-beam-high)",
  mid: "var(--countdown-beam-mid)",
  low: "var(--countdown-beam-low)",
};

export interface ProblemDialogProps {
  open: boolean;
  problemTitle: string;
  problemStatement: string;
  problemDescription?: string;
  playerReady: boolean;
  opponentReady: boolean;
  countdown: number | null;
  onReadyClick: (() => void) | undefined;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_DESCRIPTION = "Fix the buggy code below to make all tests pass.";

export function ProblemDialog(props: ProblemDialogProps) {
  const {
    open,
    problemTitle,
    problemStatement,
    problemDescription = DEFAULT_DESCRIPTION,
    playerReady,
    opponentReady,
    countdown,
    onReadyClick,
    onOpenChange,
  } = props;

  const readOnly = onReadyClick === undefined;
  const preventDismiss = !readOnly;

  // traffic-light cue for the pre-game countdown: far out = red, closing =
  // yellow, imminent = green. generic high/mid/low so any count maps sanely.
  const countdownLevel =
    countdown === null
      ? null
      : countdown >= 3
        ? "high"
        : countdown === 2
          ? "mid"
          : "low";

  // base-ui's onOpenChange signature is (open, eventDetails). We adapt it to
  // the simpler (open: boolean) => void contract exposed by ProblemDialog,
  // and use eventDetails.cancel() to block dismissal in locked mode.
  const handleOpenChange = (
    nextOpen: boolean,
    eventDetails: { reason: string; cancel: () => void },
  ) => {
    if (preventDismiss && !nextOpen) {
      const reason = eventDetails?.reason;
      if (reason === "escape-key" || reason === "outside-press") {
        eventDetails.cancel();
        return;
      }
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      disablePointerDismissal={preventDismiss}
    >
      <DialogContent
        className={`problem-dialog ${preventDismiss ? "problem-dialog--locked" : ""}`}
        showCloseButton={!preventDismiss}
      >
        <DialogHeader>
          <DialogTitle>{problemTitle}</DialogTitle>
          <DialogDescription>{problemDescription}</DialogDescription>
        </DialogHeader>

        <pre className="problem-dialog__statement">{problemStatement}</pre>

        {countdown !== null && (
          <div
            className={`problem-dialog__countdown problem-dialog__countdown--${countdownLevel}`}
            aria-live="polite"
          >
            {countdown}
          </div>
        )}
        {countdownLevel !== null && (
          <BorderBeam
            // re-key per level so the new color swaps cleanly between ticks.
            key={countdownLevel}
            size={190}
            duration={1.6}
            borderWidth={3}
            // both stops the level color (only the tail fades to transparent)
            // so the comet stays solid instead of washing out to the white
            // light-mode surface; drop-shadow gives the actual glow.
            colorFrom={COUNTDOWN_BEAM_COLOR[countdownLevel]}
            colorTo={COUNTDOWN_BEAM_COLOR[countdownLevel]}
            style={{
              filter: `drop-shadow(0 0 5px ${COUNTDOWN_BEAM_COLOR[countdownLevel]})`,
            }}
            transition={{
              type: "spring",
              stiffness: 60,
              damping: 20,
              duration: 1.6,
            }}
          />
        )}
        {countdown === null && (
          <div className="problem-dialog__footer">
            <div className="problem-dialog__chips">
              <span
                className={`problem-dialog__chip ${playerReady ? "is-ready" : ""}`}
              >
                YOU {playerReady ? "✓" : "•"}
              </span>
              <span
                className={`problem-dialog__chip ${opponentReady ? "is-ready" : ""}`}
              >
                OPPONENT {opponentReady ? "✓" : "•"}
              </span>
            </div>
            {!readOnly && (
              <button
                type="button"
                className="problem-dialog__ready"
                disabled={playerReady}
                onClick={() => onReadyClick?.()}
              >
                {playerReady ? "Waiting for opponent…" : "Ready up"}
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
