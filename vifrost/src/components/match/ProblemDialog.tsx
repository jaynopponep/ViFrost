import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import "./ProblemDialog.css";

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

        {countdown !== null ? (
          <div className="problem-dialog__countdown" aria-live="polite">
            {countdown}
          </div>
        ) : (
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
