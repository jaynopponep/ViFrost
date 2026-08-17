import { useEffect, useState } from "react";

// the app encodes theme as a `dark` class on <html> (see theme/theme.ts and
// animated-theme-toggler). this hook reactively mirrors that class so any
// component can follow the user's chosen theme without re-implementing the
// MutationObserver dance.
export function useIsDarkTheme(): boolean {
  const [isDark, setIsDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const update = () =>
      setIsDark(document.documentElement.classList.contains("dark"));

    update();

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}
