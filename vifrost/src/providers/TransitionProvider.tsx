import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, type NavigateOptions, type To } from "react-router-dom";
import gsap from "gsap";

// data-router note: react router 7 here uses createBrowserRouter/RouterProvider,
// so there is no <Routes location={...}> to freeze. instead the opaque backdrop
// (site background colour) fully covers the screen at the swap moment, so the
// instant route change behind it is never visible. simpler than the freeze trick.

interface RouteTransitionContextValue {
  navigateWithTransition: (to: To, options?: NavigateOptions) => void;
}

const RouteTransitionContext = createContext<RouteTransitionContextValue | null>(
  null,
);

export function useRouteTransition(): RouteTransitionContextValue {
  const ctx = useContext(RouteTransitionContext);
  if (!ctx) {
    throw new Error(
      "useRouteTransition must be used within <TransitionProvider>",
    );
  }
  return ctx;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function TransitionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const pathsRef = useRef<SVGPathElement[]>([]);
  const isAnimatingRef = useRef(false);
  const [active, setActive] = useState(false);
  const navigate = useNavigate();

  // measure each path once so the stroke-dash maths is correct, and park
  // them fully hidden (offset === length) so nothing shows at rest.
  useEffect(() => {
    if (!svgRef.current) return;
    pathsRef.current = Array.from(svgRef.current.querySelectorAll("path"));
    pathsRef.current.forEach((path) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = String(length);
      path.style.strokeDashoffset = String(length);
    });
  }, []);

  const navigateWithTransition = useCallback(
    (to: To, options?: NavigateOptions) => {
      if (isAnimatingRef.current) return;

      // honour reduced-motion: swap instantly, no animation.
      if (prefersReducedMotion() || pathsRef.current.length === 0) {
        navigate(to, options);
        return;
      }

      isAnimatingRef.current = true;
      setActive(true);

      const backdrop = backdropRef.current;

      // LEAVE: draw the first strokes in, fatten them, and fade the backdrop
      // up until the screen is fully covered.
      const leave = gsap.timeline({
        onComplete: () => {
          // screen is covered: swap the route behind it.
          navigate(to, options);

          // ENTER: the second stroke sweep continues off-screen and the
          // backdrop fades out, revealing the new page.
          const enter = gsap.timeline({
            onComplete: () => {
              isAnimatingRef.current = false;
              setActive(false);
            },
          });

          pathsRef.current.forEach((path) => {
            const length = path.getTotalLength();
            enter.to(
              path,
              {
                strokeDashoffset: -length,
                attr: { "stroke-width": 200 },
                duration: 0.8,
                ease: "power1.inOut",
                onComplete: () => {
                  gsap.set(path, { strokeDashoffset: length });
                },
              },
              0,
            );
          });

          if (backdrop) {
            enter.to(
              backdrop,
              { opacity: 0, duration: 0.5, ease: "power1.inOut" },
              0.2,
            );
          }
        },
      });

      if (backdrop) {
        leave.to(
          backdrop,
          { opacity: 1, duration: 0.55, ease: "power1.inOut" },
          0,
        );
      }

      pathsRef.current.forEach((path) => {
        leave.to(
          path,
          {
            strokeDashoffset: 0,
            attr: { "stroke-width": 700 },
            duration: 0.8,
            ease: "power1.inOut",
          },
          0,
        );
      });
    },
    [navigate],
  );

  return (
    <RouteTransitionContext.Provider value={{ navigateWithTransition }}>
      {children}
      <div
        className={`transition-svg${active ? " transition-svg--active" : ""}`}
        aria-hidden="true"
      >
        <div ref={backdropRef} className="transition-backdrop" />
        <svg
          ref={svgRef}
          viewBox="0 0 2453 2535"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M227.549 1818.76C227.549 1818.76 406.016 2207.75 569.049 2130.26C843.431 1999.85 -264.104 1002.3 227.549 876.262C552.918 792.849 773.647 2456.11 1342.05 2130.26C1885.43 1818.76 14.9644 455.772 760.548 137.262C1342.05 -111.152 1663.5 2266.35 2209.55 1972.76C2755.6 1679.18 1536.63 384.467 1826.55 137.262C2013.5 -22.1463 2209.55 381.262 2209.55 381.262"
            stroke="var(--transition-stroke-1)"
            strokeWidth="200"
            strokeLinecap="round"
          />
          <path
            d="M1661.28 2255.51C1661.28 2255.51 2311.09 1960.37 2111.78 1817.01C1944.47 1696.67 718.456 2870.17 499.781 2255.51C308.969 1719.17 2457.51 1613.83 2111.78 963.512C1766.05 313.198 427.949 2195.17 132.281 1455.51C-155.219 736.292 2014.78 891.514 1708.78 252.012C1437.81 -314.29 369.471 909.169 132.281 566.512C18.1772 401.672 244.781 193.012 244.781 193.012"
            stroke="var(--transition-stroke-2)"
            strokeWidth="200"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </RouteTransitionContext.Provider>
  );
}
