import { motion, AnimatePresence } from "motion/react";
import "./VimDeltaFloat.css";

export interface VimDelta {
  id: number;
  value: number;
}

export interface VimDeltaFloatProps {
  deltas: VimDelta[];
  onDismiss: (id: number) => void;
}

export function VimDeltaFloat({ deltas, onDismiss }: VimDeltaFloatProps) {
  return (
    <span className="vim-delta-float" aria-hidden="true">
      <AnimatePresence>
        {deltas
          .filter((d) => d.value !== 0)
          .map((d) => {
            // deterministic lane from the stable id so floats fired in the
            // same handler (consecutive ids, e.g. -60 then +20) never stack
            // exactly on top of each other. id-based, not array-index, so a
            // still-animating float never shifts when an earlier one dismisses.
            const laneX = ((d.id % 4) - 1.5) * 14;
            return (
            <motion.span
              key={d.id}
              className={
                "vim-delta-float__item " +
                (d.value >= 0
                  ? "vim-delta-float__item--gain"
                  : "vim-delta-float__item--loss")
              }
              style={{ left: `${laneX}px` }}
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -26 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              onAnimationComplete={() => onDismiss(d.id)}
            >
              {d.value >= 0 ? `+${d.value}` : d.value}
            </motion.span>
            );
          })}
      </AnimatePresence>
    </span>
  );
}
