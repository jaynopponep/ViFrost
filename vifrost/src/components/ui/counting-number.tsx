import { useEffect } from "react";
import {
  motion,
  useSpring,
  useTransform,
  type SpringOptions,
} from "motion/react";

// motion-only count-up number. mirrors what animate-ui's CountingNumber does
// (a spring driving a numeric value) without pulling in @base-ui-components.
// the value spring starts at 0 so it counts up on mount, then animates on any
// change. a MotionValue rendered as a motion child updates without re-render.
export interface CountingNumberProps {
  value: number;
  className?: string;
  // default mirrors animate-ui's ProgressValue spring.
  transition?: SpringOptions;
}

export function CountingNumber({
  value,
  className,
  transition = { stiffness: 80, damping: 20 },
}: CountingNumberProps) {
  const spring = useSpring(0, transition);
  const display = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={className}>{display}</motion.span>;
}
